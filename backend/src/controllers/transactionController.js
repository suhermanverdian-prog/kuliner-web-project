const { z } = require('zod');
const TransactionService = require('../services/transactionService');
const TransactionRepository = require('../repositories/transactionRepository');

class TransactionController {

  async getTransactions(req, res) {
    try {
      const userContext = req.userContext || {};
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const { data, count } = await TransactionRepository.getTransactions(userContext, page, limit);

      res.set('X-Total-Count', count);
      res.set('X-Total-Pages', Math.ceil(count / limit));

      const normalized = (data || []).map(tx => {
          const itemsField = tx.items;
          if (itemsField && typeof itemsField === 'object' && !Array.isArray(itemsField)) {
              return {
                  ...tx,
                  items: itemsField.items || [],
                  table_type: itemsField.table_type || tx.table_type || 'Meja',
                  kds_status: itemsField.kds_status || tx.kds_status,
                  cashier_name: itemsField.cashier_name || tx.cashier_name,
              };
          }
          return tx;
      });

      res.json(normalized);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTransaction(req, res) {
    try {
      const tenantId = req.userContext?.tenantId || req.headers['x-tenant-id'];
      const outletId = req.userContext?.outletId || req.headers['x-outlet-id'];

      if (!tenantId || tenantId === 'undefined') {
          if (req.userContext?.role !== 'superadmin') {
              console.error('🚨 Security Alert: Missing Tenant ID in transaction request');
              return res.status(403).json({ error: 'RBAC: Sesi Anda tidak valid. Silakan Login ulang.' });
          }
      }

      const result = await TransactionService.createTransaction(req.body, tenantId, outletId, true);
      
      // Normalisasi format transaksi baru agar seragam
      const itemsField = result.items;
      let normalizedResult = result;
      if (itemsField && typeof itemsField === 'object' && !Array.isArray(itemsField)) {
          normalizedResult = {
              ...result,
              items: itemsField.items || [],
              table_type: itemsField.table_type || result.table_type || 'Meja',
              kds_status: itemsField.kds_status || result.kds_status,
              cashier_name: itemsField.cashier_name || result.cashier_name,
          };
      }

      // BROADCAST REAL-TIME (KDS & Admin Panel)
      const io = req.app.get('io');
      if (io) {
          io.emit('NEW_TRANSACTION', normalizedResult);
          console.log(`📡 [RealTime] Broadcast NEW_TRANSACTION: ${normalizedResult.order_number}`);
      }

      res.status(201).json({
          ...normalizedResult,
          message: 'Transaksi berhasil dicatat dan stok telah diperbarui.'
      });

    } catch (error) {
      console.error('❌ Transaction Error:', error.message);
      res.status(500).json({ error: 'Gagal memproses transaksi: ' + error.message });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] || req.userContext?.tenantId;
      
      await TransactionService.confirmPayment(id, tenantId, req.body);
      res.json({ ok: true, message: 'Pembayaran berhasil dikonfirmasi dan stok diperbarui.' });
    } catch (error) {
      console.error('❌ Confirm Payment Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async updateKdsStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const kdsStatusSchema = z.enum(['pending', 'cooking', 'ready', 'served']);
      const parsedStatus = kdsStatusSchema.safeParse(status);
      
      if (!parsedStatus.success) {
        return res.status(400).json({ error: 'Status KDS tidak valid. Pilih antara pending, cooking, ready, atau served.' });
      }
      
      await TransactionService.updateKdsStatus(id, parsedStatus.data);
      
      const io = req.app.get('io');
      if (io) {
          io.emit('KDS_UPDATE', { id, status: parsedStatus.data });
          console.log(`📡 [RealTime] Broadcast KDS_UPDATE for ${id}`);
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async requestVoid(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { role, name, tenantId } = req.userContext || {};

      await TransactionService.requestVoid(id, reason, role, name, tenantId);
      res.json({ ok: true, message: 'Permintaan Void dikirim ke Manager' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async approveVoid(req, res) {
    try {
      const { id } = req.params;
      const { role, name, tenantId } = req.userContext || {};
      console.log('🔍 [Debug Approve Void] Params:', { id, role, name, tenantId });
      
      await TransactionService.approveVoid(id, role, name, tenantId);
      res.json({ ok: true });
    } catch (error) {
      console.error('❌ [Debug Approve Void] Error:', error.message);
      res.status(error.message.includes('RBAC') ? 403 : 500).json({ error: error.message });
    }
  }

  async getTrendReport(req, res) {
    try {
      const userContext = req.userContext || {};
      const current = await TransactionService.getTrendReport(userContext);
      res.json({ current });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTopSelling(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await TransactionService.getTopSelling(userContext);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();
