const TransactionService = require('../services/transactionService');
const TransactionRepository = require('../repositories/transactionRepository');

class TransactionController {

  async getTransactions(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const { data, count } = await TransactionRepository.getTransactions(tenantId, page, limit);

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
      
      // BROADCAST REAL-TIME (KDS & Admin Panel)
      const io = req.app.get('io');
      if (io) {
          io.emit('NEW_TRANSACTION', result);
          console.log(`📡 [RealTime] Broadcast NEW_TRANSACTION: ${result.order_number}`);
      }

      res.status(201).json({
          ...result,
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
      
      await TransactionService.updateKdsStatus(id, status);
      
      const io = req.app.get('io');
      if (io) {
          io.emit('KDS_UPDATE', { id, status });
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
      const { role } = req.userContext || {};

      await TransactionService.requestVoid(id, reason, role);
      res.json({ ok: true, message: 'Permintaan Void dikirim ke Manager' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async approveVoid(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.userContext || {};
      
      await TransactionService.approveVoid(id, role);
      res.json({ ok: true });
    } catch (error) {
      res.status(error.message.includes('RBAC') ? 403 : 500).json({ error: error.message });
    }
  }

  async getTrendReport(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const current = await TransactionService.getTrendReport(tenantId);
      res.json({ current });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTopSelling(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await TransactionService.getTopSelling(tenantId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();
