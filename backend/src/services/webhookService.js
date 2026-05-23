const { supabase } = require('../supabase');

class WebhookService {
  static async simulatePayment(transactionId, tenantId) {
    // 1. Ambil transaksi
    const { data: trx, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchErr || !trx) throw new Error('Transaksi tidak ditemukan');

    // 2. Simulasi: Panggil internal confirm-payment endpoint logic
    const PORT = process.env.PORT || 3001;
    const confirmRes = await fetch(`http://localhost:${PORT}/api/transactions/${transactionId}/confirm-payment`, {
      method: 'PUT',
      headers: {
        'x-tenant-id': tenantId,
        'x-user-role': 'system',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: trx.payment_method,
        cashReceived: trx.total,
        change: 0
      })
    });

    if (!confirmRes.ok) throw new Error('Konfirmasi internal gagal');

    return { status: 'success', message: 'Webhook simulated and payment confirmed.' };
  }
}

module.exports = WebhookService;
