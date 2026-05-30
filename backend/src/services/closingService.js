const ClosingRepository = require('../repositories/closingRepository');
const TransactionRepository = require('../repositories/transactionRepository');
const { supabase } = require('../supabase');
const crypto = require('crypto');

class ClosingService {
  async getClosings(tenantId) {
    return await ClosingRepository.getClosings(tenantId);
  }

  async checkDateClosed(tenantId, dateStr) {
    if (!dateStr) return false;
    const period = dateStr.slice(0, 7); // Format: 'YYYY-MM'
    return await ClosingRepository.isPeriodClosed(tenantId, period);
  }

  async closePeriod(tenantId, period, closedBy) {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      throw new Error('Format periode harus YYYY-MM');
    }

    const isAlreadyClosed = await ClosingRepository.isPeriodClosed(tenantId, period);
    if (isAlreadyClosed) {
      throw new Error(`Periode ${period} sudah ditutup sebelumnya.`);
    }

    // 1. Hitung Rentang Tanggal Periode
    const year = parseInt(period.split('-')[0]);
    const month = parseInt(period.split('-')[1]);
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, -1)).toISOString();

    // 2. Ambil Semua Journal Lines di periode ini yang masuk kategori Pendapatan (4%) dan Beban (5%)
    const { data: journalHeaders, error: headersErr } = await supabase
      .from('journals')
      .select('id, date, journal_lines(*)')
      .eq('tenant_id', tenantId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (headersErr) throw headersErr;

    // Kumpulkan running balance per akun Pendapatan & Beban
    const accountBalances = {}; // { account_id: { code, name, netBalance } }

    if (journalHeaders && journalHeaders.length > 0) {
      for (const jh of journalHeaders) {
        if (!jh.journal_lines) continue;
        for (const line of jh.journal_lines) {
          const code = line.account_code || '';
          // Hanya peduli akun Pendapatan (dimulai angka 4) dan Beban (dimulai angka 5)
          if (code.startsWith('4') || code.startsWith('5')) {
            if (!accountBalances[line.account_id]) {
              accountBalances[line.account_id] = {
                code,
                name: line.account_name,
                debit: 0,
                credit: 0
              };
            }
            accountBalances[line.account_id].debit += Number(line.debit || 0);
            accountBalances[line.account_id].credit += Number(line.credit || 0);
          }
        }
      }
    }

    // 3. Buat Jurnal Penutup (Closing Entry)
    const journalLines = [];
    const journalId = crypto.randomUUID();
    let netIncome = 0; // Laba/Rugi Bersih

    for (const accId in accountBalances) {
      const balance = accountBalances[accId];
      const isRevenue = balance.code.startsWith('4');
      const netAmount = isRevenue 
        ? (balance.credit - balance.debit) // Pendapatan normal kredit
        : (balance.debit - balance.credit); // Beban normal debit

      if (netAmount === 0) continue;

      if (isRevenue) {
        netIncome += netAmount;
        // Zeroing out Revenue: Debit akun pendapatan sebesar saldo kredit bersihnya
        journalLines.push({
          journal_id: journalId,
          account_id: accId,
          account_code: balance.code,
          account_name: `Tutup Buku: ${balance.name}`,
          debit: netAmount,
          credit: 0,
          tenant_id: tenantId
        });
      } else {
        netIncome -= netAmount;
        // Zeroing out Expense: Kredit akun beban sebesar saldo debit bersihnya
        journalLines.push({
          journal_id: journalId,
          account_id: accId,
          account_code: balance.code,
          account_name: `Tutup Buku: ${balance.name}`,
          debit: 0,
          credit: netAmount,
          tenant_id: tenantId
        });
      }
    }

    if (journalLines.length === 0) {
      throw new Error('Tidak ada saldo Pendapatan atau Beban aktif yang perlu ditutup pada periode ini.');
    }

    // 4. Cari Akun Laba Ditahan (Retained Earnings, e.g. 3-2000)
    const retainedEarningsCode = '3-2000';
    const accounts = await TransactionRepository.getAccountsByCodes([retainedEarningsCode]);
    const retainedEarningsAccId = accounts?.find(a => a.code === retainedEarningsCode)?.id;

    if (!retainedEarningsAccId) {
      throw new Error('Akun Laba Ditahan (3-2000) tidak ditemukan di Chart of Accounts. Tutup buku dibatalkan.');
    }

    // Balancing line ke Laba Ditahan
    if (netIncome > 0) {
      // Untung: Kredit Laba Ditahan (Equity bertambah)
      journalLines.push({
        journal_id: journalId,
        account_id: retainedEarningsAccId,
        account_code: retainedEarningsCode,
        account_name: 'Tutup Buku: Laba Ditahan Bulanan',
        debit: 0,
        credit: netIncome,
        tenant_id: tenantId
      });
    } else if (netIncome < 0) {
      // Rugi: Debit Laba Ditahan (Equity berkurang)
      journalLines.push({
        journal_id: journalId,
        account_id: retainedEarningsAccId,
        account_code: retainedEarningsCode,
        account_name: 'Tutup Buku: Rugi Ditahan Bulanan',
        debit: Math.abs(netIncome),
        credit: 0,
        tenant_id: tenantId
      });
    }

    // 5. Post Jurnal Penutup & Kunci Periode
    const journalHeader = {
      id: journalId,
      tenant_id: tenantId,
      date: endDate, // Tanggal hari terakhir periode
      reference: `CLOSE-${period}`,
      description: `Jurnal Penutup Otomatis Periode ${period}`,
      total_amount: Math.abs(netIncome)
    };

    await TransactionRepository.insertJournalHeader(journalHeader);
    await TransactionRepository.insertJournalLines(journalLines);

    // Kunci di tabel closings
    const closingRecord = {
      tenant_id: tenantId,
      period,
      closed_by: closedBy || 'System Administrator',
      closed_at: new Date().toISOString()
    };
    await ClosingRepository.createClosing(closingRecord);

    return {
      success: true,
      period,
      net_income: netIncome,
      journal_id: journalId
    };
  }
}

module.exports = new ClosingService();
