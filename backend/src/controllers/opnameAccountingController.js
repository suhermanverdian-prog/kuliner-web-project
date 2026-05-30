const crypto = require('crypto');
const { supabase } = require('../supabase');
const OpnameRepository = require('../repositories/opnameRepository');
const TransactionRepository = require('../repositories/transactionRepository');

class OpnameAccountingController {
  /**
   * GET /api/opname/accounting/templates
   * Get all journal templates for a tenant
   */
  async getTemplates(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { data, error } = await supabase
        .from('opname_journal_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/opname/accounting/templates
   * Create a new journal template with variance-to-GL account mappings
   */
  async createTemplate(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { name, mapping } = req.body;

      if (!name || !mapping) {
        return res.status(400).json({ error: 'Nama template dan pemetaan akun GL wajib diisi.' });
      }

      const { data, error } = await supabase
        .from('opname_journal_templates')
        .insert([{
          tenant_id: tenantId,
          name,
          variance_category_to_account_mapping: mapping,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * POST /api/opname/:sessionId/journals/create
   * Preview/Create adjustment journal entries from approved opname sessions
   */
  async createJournals(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { sessionId } = req.params;
      const { templateId } = req.body;

      const session = await OpnameRepository.getSessionById(sessionId, tenantId);
      if (!session) return res.status(404).json({ error: 'Sesi opname tidak ditemukan.' });

      const items = await OpnameRepository.getSessionItems(sessionId, tenantId);

      // Fetch Journal Template
      let mapping = {};
      if (templateId) {
        const { data: temp } = await supabase
          .from('opname_journal_templates')
          .select('*')
          .eq('id', templateId)
          .eq('tenant_id', tenantId)
          .single();
        if (temp) mapping = temp.variance_category_to_account_mapping || {};
      }

      // Default Account Mapping
      const settings = await TransactionRepository.getSettings(tenantId);
      const amap = settings?.accounting_map || {};
      const defaultInvCode = amap.inventory || '1-2000';
      const defaultHppCode = amap.hpp || '5-1000';

      const accounts = await TransactionRepository.getAccountsByCodes([defaultInvCode, defaultHppCode]);
      const getAccountId = (code) => accounts?.find(a => a.code === code)?.id;

      const inventoryAccId = getAccountId(defaultInvCode);
      const hppAccId = getAccountId(defaultHppCode);

      // Debit/Credit Ledger calculations based on variance categories
      const entries = [];
      let totalDebit = 0;
      let totalCredit = 0;
      let lineNum = 1;

      for (const item of (items || [])) {
        const variance = Number(item.variance || 0);
        if (variance === 0) continue;

        const cost = Number(item.bahan?.cost || 0);
        const amount = Math.abs(variance * cost);
        if (amount === 0) continue;

        const cat = item.variance_category || 'normal';
        let mappedAccId = mapping[cat] || hppAccId; // Default to HPP/Loss

        if (variance > 0) {
          // Positive Variance: Debit Inventory Asset, Credit Gain/HPP
          entries.push({
            line_number: lineNum++,
            gl_account_id: inventoryAccId,
            debit_amount: amount,
            credit_amount: 0,
            description: `Kelebihan Fisik: ${item.bahan?.name || 'Bahan'}`,
            variance_category: cat
          });
          entries.push({
            line_number: lineNum++,
            gl_account_id: mappedAccId,
            debit_amount: 0,
            credit_amount: amount,
            description: `Penyesuaian Selisih Positif: ${item.bahan?.name || 'Bahan'}`,
            variance_category: cat
          });
          totalDebit += amount;
          totalCredit += amount;
        } else {
          // Negative Variance: Debit HPP/Loss/Expense, Credit Inventory Asset
          entries.push({
            line_number: lineNum++,
            gl_account_id: mappedAccId,
            debit_amount: amount,
            credit_amount: 0,
            description: `Kekurangan Fisik (${cat}): ${item.bahan?.name || 'Bahan'}`,
            variance_category: cat
          });
          entries.push({
            line_number: lineNum++,
            gl_account_id: inventoryAccId,
            debit_amount: 0,
            credit_amount: amount,
            description: `Pengurangan Nilai Persediaan: ${item.bahan?.name || 'Bahan'}`,
            variance_category: cat
          });
          totalDebit += amount;
          totalCredit += amount;
        }
      }

      // GAAP Double-Entry Verification check
      const verification_result = {
        total_debit: Math.round(totalDebit),
        total_credit: Math.round(totalCredit),
        balanced: Math.round(totalDebit) === Math.round(totalCredit)
      };

      res.json({
        session_id: sessionId,
        journal_number: `OPN-JR-${Date.now().toString().slice(-6)}`,
        status: 'draft',
        entries,
        verification_result
      });
    } catch (err) {
      res.status(550).json({ error: err.message });
    }
  }

  /**
   * POST /api/opname/:sessionId/journals/post
   * Post adjustment journal entries to General Ledger (GL)
   */
  async postJournals(req, res) {
    try {
      const { tenantId, id: userId } = req.userContext || {};
      const { sessionId } = req.params;
      const { entries, journalNumber } = req.body;

      if (!entries || entries.length === 0) {
        return res.status(400).json({ error: 'Detail entri jurnal tidak boleh kosong.' });
      }

      // Verify double-entry balance in backend
      let sumDebit = 0;
      let sumCredit = 0;
      entries.forEach(e => {
        sumDebit += Number(e.debit_amount || 0);
        sumCredit += Number(e.credit_amount || 0);
      });

      if (Math.round(sumDebit) !== Math.round(sumCredit)) {
        return res.status(400).json({ error: 'Jurnal tidak seimbang! Total Debit harus sama dengan Kredit.' });
      }

      // Create Opname Journal Header
      const { data: journal, error: jErr } = await supabase
        .from('opname_journals')
        .insert([{
          tenant_id: tenantId,
          opname_session_id: sessionId,
          journal_number: journalNumber || `OPN-JR-${Date.now().toString().slice(-6)}`,
          status: 'posted',
          total_debit: sumDebit,
          total_credit: sumCredit,
          gl_posting_date: new Date().toISOString(),
          posted_by: userId
        }])
        .select()
        .single();

      if (jErr) throw jErr;

      // Create Journal Entries Details
      const journalLines = entries.map(e => ({
        tenant_id: tenantId,
        journal_id: journal.id,
        line_number: e.line_number,
        gl_account_id: e.gl_account_id,
        debit_amount: e.debit_amount,
        credit_amount: e.credit_amount,
        description: e.description,
        variance_category: e.variance_category || 'normal'
      }));

      const { error: lineErr } = await supabase
        .from('opname_journal_entries')
        .insert(journalLines);

      if (lineErr) throw lineErr;

      // Update Opname Session marking journal as created
      await supabase
        .from('opname_sessions')
        .update({
          auto_journal_created: true,
          journal_ids: [journal.id]
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      res.status(201).json({
        success: true,
        journal,
        message: 'Jurnal penyesuaian persediaan berhasil diposting ke General Ledger.'
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * GET /api/opname/accounting/reconciliation
   * Generate automatic reconciliation report comparing opname totals with General Ledger
   */
  async getReconciliation(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      
      // Get all approved opname sessions
      const { data: sessions } = await supabase
        .from('opname_sessions')
        .select('id, outlet_id, approved_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'approved');

      // Get all posted opname journals
      const { data: journals } = await supabase
        .from('opname_journals')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'posted');

      const sessionIds = (sessions || []).map(s => s.id);
      
      // Calculate total opname variance value
      let opname_variance_total = 0;
      if (sessionIds.length > 0) {
        const { data: items } = await supabase
          .from('opname_items')
          .select('variance, bahan(cost)')
          .in('opname_session_id', sessionIds);

        (items || []).forEach(item => {
          const cost = Number(item.bahan?.cost || 0);
          const variance = Number(item.variance || 0);
          opname_variance_total += Math.abs(variance * cost);
        });
      }

      // Calculate total general ledger journaled amount
      let journal_amount_total = 0;
      (journals || []).forEach(j => {
        journal_amount_total += Number(j.total_debit || 0);
      });

      const difference = Math.abs(opname_variance_total - journal_amount_total);
      const reconciled = difference < 10; // Allow micro-rounding differences of under Rp 10

      res.json({
        opname_variance_total: Math.round(opname_variance_total),
        journal_amount_total: Math.round(journal_amount_total),
        variance_difference: Math.round(difference),
        reconciled
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new OpnameAccountingController();
