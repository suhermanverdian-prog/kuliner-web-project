import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';

const printReceipt = (order) => {
  const printWindow = window.open('', '_blank');
  const itemsHtml = order.items.map(i => `
    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
      <span>${i.name} x${i.qty}</span>
      <span>${formatRupiah(i.price * i.qty)}</span>
    </div>
  `).join('');

  printWindow.document.write(`
    <html>
      <body style="font-family:monospace; width:300px; padding:10px;">
        <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:10px; margin-bottom:10px;">
          <h2 style="margin:0;">BrewMaster Coffee</h2>
          <p style="font-size:10px; margin:2px;">Jl. Kopi Nikmat No. 123</p>
          <p style="font-size:10px; margin:2px;">WA: 0812-3456-7890</p>
        </div>
        <div style="font-size:10px; margin-bottom:10px;">
          <div>ID: ${order.id}</div>
          <div>Tgl: ${new Date(order.createdAt).toLocaleString()}</div>
          <div>Cust: ${order.customerName || 'Guest'}</div>
          <div>Tipe: ${order.tableType || 'Take Away'}</div>
        </div>
        <div style="border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
          ${itemsHtml}
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:bold;">
          <span>TOTAL</span>
          <span>${formatRupiah(order.total)}</span>
        </div>
        <div style="text-align:center; margin-top:20px; font-size:10px;">
          <p>Terima kasih atas pesanan Anda!</p>
          <p>Cek status pesanan Anda di menu Tracking</p>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const sendWA = (order) => {
  const text = `Halo ${order.customerName}! Terima kasih sudah memesan di BrewMaster Coffee. %0A%0AOrder ID: ${order.id}%0ATotal: ${formatRupiah(order.total)}%0AStatus: ${order.kdsStatus}%0A%0ACek status pesanan kamu secara real-time di sini: ${window.location.origin}/#/guest`;
  window.open(`https://wa.me/${order.customerPhone}?text=${text}`, '_blank');
};

function ProductImage({ src, alt, icon }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return <img src={src} alt={alt} onError={() => setError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return <span style={{ fontSize: '1.2rem' }}>{icon || '☕'}</span>;
}

function CartDrawer({ cart, onClose, onChangeQty, onCheckout }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        width: '340px', background: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', animation: 'slideFromRight 0.25s ease'
      }}>
        <style>{`@keyframes slideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>🛒 Keranjang Saya</h3>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
              <p style={{ fontWeight: 600 }}>Keranjang kosong</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Pilih menu yang kamu suka!</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>{formatRupiah(item.price)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => onChangeQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>−</button>
                <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => onChangeQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1.5px solid var(--primary)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Subtotal</span><span>{formatRupiah(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <span>Pajak (10%)</span><span>{formatRupiah(tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', paddingTop: '12px', borderTop: '1.5px dashed var(--border)', marginBottom: '16px' }}>
              <span>Total</span><span style={{ color: 'var(--primary)' }}>{formatRupiah(total)}</span>
            </div>
            <button id="btn-guest-checkout" onClick={() => onCheckout(total)} style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
            }}>
              📋 Pesan Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { key: 'Tunai',         label: 'Tunai',        icon: '💵', desc: 'Bayar langsung ke kasir' },
  { key: 'QRIS',          label: 'QRIS',         icon: '📱', desc: 'Scan QR di kasir' },
  { key: 'Transfer Bank', label: 'Transfer Bank', icon: '🏦', desc: 'BCA / Mandiri / BNI' },
  { key: 'Kartu Debit',   label: 'Kartu Debit',  icon: '💳', desc: 'Debit / Kredit' },
  { key: 'E-Wallet',      label: 'E-Wallet',     icon: '📲', desc: 'OVO / GoPay / Dana' },
];

function CheckoutForm({ total, cart, onBack, onSuccess, user, defaultOrderType, defaultTableNum }) {
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    tableNum: defaultTableNum || '', 
    note: '', 
    orderType: defaultOrderType || 'Dine-in',
    paymentMethod: 'Tunai'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert('Nama dan nomor WhatsApp wajib diisi!');
    setLoading(true);
    try {
      const trxData = {
        items: cart,
        total: total,
        paymentMethod: form.paymentMethod,
        tableType: form.orderType === 'Dine-in' ? (form.tableNum ? `Meja ${form.tableNum}` : 'Meja Umum') : 'Take Away',
        customerName: form.name,
        customerPhone: form.phone,
        note: form.note,
        type: 'Self Order',
        cashierName: 'Self Service'
      };
      const res = await api.checkout(trxData);
      onSuccess(res.id);
    } catch (err) {
      alert('Gagal mengirim pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const orderNum = 'ORD-' + Math.floor(Math.random() * 900 + 100);
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '48px 36px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--primary)', marginBottom: '8px' }}>Pesanan Diterima!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Halo <strong>{form.name}</strong>! Pesananmu sedang kami proses.</p>
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', textAlign: 'center', marginBottom: '12px' }}>{orderNum}</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span>{item.icon} {item.name} x{item.qty}</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '10px', paddingTop: '10px', borderTop: '1.5px dashed var(--border)' }}>
              <span>Total</span><span style={{ color: 'var(--primary)' }}>{formatRupiah(total)}</span>
            </div>
          </div>
          <div style={{ background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.85rem', color: '#1A4A2E', marginBottom: '20px' }}>
            📱 Notifikasi akan dikirim ke <strong>{form.phone}</strong> via WhatsApp
          </div>
          <button onClick={onSuccess} style={{
            width: '100%', padding: '12px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
          }}>
            ➕ Pesan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Kembali ke Menu
        </button>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '6px' }}>📋 Detail Pesanan</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>Isi data di bawah untuk melanjutkan pesanan</p>

          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.875rem' }}>🛒 Ringkasan Pesanan</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '6px 0', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    <ProductImage src={item.image} alt={item.name} icon={item.icon} />
                  </div>
                  <span>{item.name} × {item.qty}</span>
                </div>
                <span>{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '10px', paddingTop: '10px', borderTop: '1.5px dashed var(--border)' }}>
              <span>Total (incl. pajak 10%)</span>
              <span style={{ color: 'var(--primary)' }}>{formatRupiah(total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">👤 Nama / Atas Nama *</label>
              <input id="guest-name" className="form-control" placeholder="cth: Rina" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">📱 Nomor WhatsApp *</label>
              <input id="guest-phone" className="form-control" placeholder="cth: 081234567890" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Untuk notifikasi status pesanan</p>
            </div>

            {/* Tipe Pesanan */}
            <div className="form-group">
              <label className="form-label">🪑 Tipe Pesanan</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Dine-in', 'Take Away'].map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, orderType: t })} style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.875rem', transition: 'var(--transition)',
                    border: form.orderType === t ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: form.orderType === t ? 'var(--primary)' : '#fff',
                    color: form.orderType === t ? '#fff' : 'var(--text-secondary)'
                  }}>
                    {t === 'Dine-in' ? '🪑 Dine-in' : '🥡 Take Away'}
                  </button>
                ))}
              </div>
            </div>
            {form.orderType === 'Dine-in' && (
              <div className="form-group">
                <label className="form-label">🔢 Nomor Meja</label>
                <input className="form-control" placeholder="cth: 3" value={form.tableNum} onChange={e => setForm({ ...form, tableNum: e.target.value })} />
              </div>
            )}

            {/* Metode Pembayaran */}
            <div className="form-group">
              <label className="form-label">💳 Metode Pembayaran *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PAYMENT_METHODS.map(pm => {
                  const isSelected = form.paymentMethod === pm.key;
                  return (
                    <button key={pm.key} type="button" onClick={() => setForm({ ...form, paymentMethod: pm.key })} style={{
                      padding: '12px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      textAlign: 'left', transition: 'var(--transition)',
                      border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: isSelected ? 'var(--bg-card)' : '#fff',
                      boxShadow: isSelected ? '0 0 0 3px rgba(111,78,55,0.1)' : 'none'
                    }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{pm.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{pm.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pm.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info pembayaran sesuai metode */}
            {form.paymentMethod === 'QRIS' && (
              <div style={{ background: 'var(--info-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--info)' }}>
                📱 <strong>QRIS:</strong> Tunjukkan kode QR saat tiba di kasir untuk pembayaran.
              </div>
            )}
            {form.paymentMethod === 'Transfer Bank' && (
              <div style={{ background: 'var(--info-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--info)' }}>
                🏦 <strong>Transfer Bank:</strong> No. Rekening BCA <strong>1234-5678-90</strong> a/n BrewMaster Coffee. Tunjukkan bukti transfer ke kasir.
              </div>
            )}
            {form.paymentMethod === 'E-Wallet' && (
              <div style={{ background: 'var(--info-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--info)' }}>
                📲 <strong>E-Wallet:</strong> Scan QR OVO/GoPay/Dana yang tersedia di kasir.
              </div>
            )}

            <div className="form-group">
              <label className="form-label">📝 Catatan (opsional)</label>
              <textarea className="form-control" rows="2" placeholder="cth: Tanpa es, kurang manis..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* Tombol Pesan */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Total Pembayaran</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{formatRupiah(total)}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>via {form.paymentMethod}</div>
            </div>

            <button id="btn-kirim-pesanan" type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', marginTop: '4px',
              background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(111,78,55,0.3)'
            }}>
              {loading ? '⏳ Mengirim...' : `✅ Kirim Pesanan · ${formatRupiah(total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OrderTracking({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const txs = await api.getTransactions();
      const found = txs.find(t => t.id === orderId);
      if (found) setOrder(found);
      setLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Mencari data pesanan...</div>;
  if (!order) return <div style={{padding:'40px', textAlign:'center'}}>Pesanan tidak ditemukan.</div>;

  // Tampilkan status pending_payment secara eksplisit
  if (order.paymentStatus === 'pending_payment') {
    const isCash = order.paymentMethod === 'Tunai';
    const isQR = order.paymentMethod === 'QRIS' || order.paymentMethod === 'E-Wallet';
    const isTransfer = order.paymentMethod === 'Transfer Bank' || order.paymentMethod === 'Kartu Debit';

    const handleSimulateWebhook = async () => {
      try {
        await api.simulateWebhook({
          orderId: orderId,
          status: 'success',
          paymentMethod: order.paymentMethod,
          total: order.total
        });
        // refresh status will happen in the interval automatically
      } catch (e) {
        alert('Gagal mensimulasikan webhook pembayaran');
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{isCash ? '💳' : isQR ? '📱' : '🏦'}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Selesaikan Pembayaran</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Order ID: <strong>{orderId}</strong></p>

          <div style={{ background: '#FFF8EC', border: `2px solid ${isCash ? 'var(--warning)' : 'var(--info)'}`, borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            {isCash && (
              <>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: '#92400E' }}>📢 Silakan ke kasir untuk membayar</div>
                <div style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.7 }}>
                  Pesananmu sudah diterima. Silakan menuju kasir dan tunjukkan Order ID <strong>{orderId}</strong> untuk menyelesaikan pembayaran.
                  Pesananmu akan mulai diproses setelah pembayaran dikonfirmasi kasir.
                </div>
              </>
            )}
            {isQR && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, marginBottom: '16px', color: '#1E3A8A' }}>Scan QR Code Berikut</div>
                <div style={{ background: '#fff', padding: '16px', display: 'inline-block', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <div style={{ width: '200px', height: '200px', background: 'repeating-conic-gradient(#000 0% 25%, transparent 0% 50%) 50% / 20px 20px', opacity: 0.6, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', fontWeight: 800, color: 'var(--primary)' }}>QRIS</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1E40AF', marginTop: '16px' }}>
                  Buka aplikasi M-Banking atau E-Wallet Anda (Gopay, OVO, Dana) lalu scan QR di atas.
                </div>
              </div>
            )}
            {isTransfer && (
              <>
                <div style={{ fontWeight: 700, marginBottom: '16px', color: '#1E3A8A', textAlign: 'center' }}>Transfer Bank</div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Bank BCA</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', marginBottom: '8px' }}>1234-5678-90</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>a/n BrewMaster Coffee</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1E40AF', marginTop: '16px', textAlign: 'center' }}>
                  Silakan transfer tepat sebesar <strong>{formatRupiah(order.total)}</strong>
                </div>
              </>
            )}
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Detail Tagihan</div>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span>{item.name} x{item.qty}</span>
                <span>{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
              <span>Total Tagihan</span>
              <span style={{ color: 'var(--primary)' }}>{formatRupiah(order.total)}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Metode: {order.paymentMethod}</div>
          </div>

          {!isCash && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👇 Simulasi jika sistem menerima Webhook Payment Gateway</div>
              <button onClick={handleSimulateWebhook} className="btn" style={{ background: 'var(--success)', color: '#fff', width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 'var(--radius-md)', fontWeight: 700, border: 'none' }}>
                🔄 Simulasikan Pembayaran Berhasil
              </button>
            </div>
          )}

          <button onClick={onBack} className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>☕ Pesan Menu Lainnya</button>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'new', label: 'Pesanan Diterima', icon: '📝', desc: 'Dapur telah menerima pesananmu' },
    { key: 'cooking', label: 'Sedang Dimasak', icon: '🔥', desc: 'Koki sedang menyiapkan hidanganmu' },
    { key: 'ready', label: 'Siap Disajikan', icon: '✅', desc: 'Silakan ambil di meja kasir atau tunggu pelayan' },
    { key: 'served', label: 'Selesai', icon: '🎉', desc: 'Terima kasih! Selamat menikmati' },
  ];

  const currentIdx = steps.findIndex(s => s.key === (order.kdsStatus || 'new'));

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Tracking Pesanan</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Order ID: <strong>{orderId}</strong></p>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', paddingLeft: '30px' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />
          
          {steps.map((s, i) => {
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s.key} style={{ position: 'relative', opacity: isDone ? 1 : 0.4 }}>
                <div style={{ 
                  position: 'absolute', left: '-27px', top: '2px', width: '16px', height: '16px', borderRadius: '99px',
                  background: isDone ? 'var(--primary)' : 'var(--border)',
                  border: isCurrent ? '4px solid var(--border-light)' : 'none',
                  zIndex: 2
                }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.desc}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
             <span className="text-sm font-bold">Detail Pesanan</span>
             <span className="badge badge-info">{order.kdsStatus}</span>
          </div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>{item.name} x{item.qty}</span>
              <span>{formatRupiah(item.price * item.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>{formatRupiah(order.total)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => printReceipt(order)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>🖨️ Cetak Struk</button>
          <button onClick={() => sendWA(order)} className="btn btn-success" style={{ flex: 1, justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none' }}>📱 Kirim WA</button>
        </div>

        <button onClick={onBack} className="btn btn-primary w-full mt-4" style={{ justifyContent: 'center' }}>Kembali ke Menu</button>
      </div>
    </div>
  );
}

export default function GuestMenuPage({ user, tableFromQR }) {
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [menu, setMenu] = useState([]);
  
  // orderMode: null (belum pilih) | 'Dine-in' | 'Take Away'
  // Jika ada tableFromQR, langsung set mode Dine-in dan lewati splash
  const [orderMode, setOrderMode] = useState(tableFromQR ? 'Dine-in' : null);
  const [tableNumber, setTableNumber] = useState(tableFromQR || '');

  useEffect(() => {
    const fetchMenu = () => api.getMenu().then(data => setMenu(data));
    fetchMenu();
    const interval = setInterval(fetchMenu, 5000); // Polling setiap 5 detik agar selalu update
    return () => clearInterval(interval);
  }, []);

  // Jika sudah login sebagai member, jangan tampilkan tracking lama - langsung ke menu
  useEffect(() => {
    if (user) {
      // Member login: selalu mulai dari menu, hapus sisa tracking lama
      localStorage.removeItem('lastOrderId');
      setActiveOrderId(null);
    } else {
      // Guest: cek apakah ada pesanan aktif yang sedang dilacak
      const saved = localStorage.getItem('lastOrderId');
      if (saved) setActiveOrderId(saved);
    }
  }, [user]);

  const handleOrderSuccess = (id) => {
    localStorage.setItem('lastOrderId', id);
    setActiveOrderId(id);
    setCart([]);
    setCheckoutTotal(null);
  };

  const filtered = menu.filter(m => {
    const matchCat = category === 'Semua' || m.category === category;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  if (activeOrderId) {
    return <OrderTracking orderId={activeOrderId} onBack={() => { setActiveOrderId(null); localStorage.removeItem('lastOrderId'); }} />;
  }

  if (checkoutTotal !== null) {
    return (
      <CheckoutForm
        total={checkoutTotal}
        cart={cart}
        onBack={() => setCheckoutTotal(null)}
        onSuccess={handleOrderSuccess}
        user={user}
        defaultOrderType={orderMode || 'Take Away'}
        defaultTableNum={tableNumber}
      />
    );
  }

  // Splash screens for order mode and table number have been removed.


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
        padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-light)', fontSize: '1.2rem', fontWeight: 700 }}>☕ BrewMaster</span>
            {user && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>· Halo, {user.name.split(' ')[0]}!</span>
            )}
          </div>

          {/* Kanan: Login Member (hanya jika belum login) + Keranjang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!user && (
              <a href="#/member-login" style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                fontWeight: 600, fontSize: '0.8rem',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                👤 Login Member
              </a>
            )}
            {/* Jika sudah login sebagai customer */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff'
                }}>{user.avatar || user.name[0]}</div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>⭐ {user.points || 0} poin</span>
              </div>
            )}
            {/* Keranjang */}
            <button id="btn-buka-keranjang" onClick={() => setShowCart(true)} style={{
              background: totalItems > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
              padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition)'
            }}>
              🛒
              {totalItems > 0 && (
                <span style={{ background: '#fff', color: 'var(--accent)', borderRadius: '99px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 60%, var(--accent) 100%)',
        padding: '28px 20px 36px',
        textAlign: 'center', color: '#fff'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>☕</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '4px' }}>
          {user ? `Halo, ${user.name.split(' ')[0]}!` : 'Selamat Datang!'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>Pilih menu favoritmu dan pesan sekarang</p>
      </div>

      {/* Search & Filter */}
      <div style={{ maxWidth: '720px', margin: '-20px auto 0', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-lg)', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Cari menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {MENU_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '6px 14px', borderRadius: '99px', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'var(--transition)',
                background: category === c ? 'var(--primary)' : 'var(--bg)',
                color: category === c ? '#fff' : 'var(--text-secondary)',
                border: category === c ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', paddingBottom: '100px' }}>
          {filtered.map(item => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} style={{
                background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)', border: qty > 0 ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                transition: 'var(--transition)'
              }}>
                <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--bg-card), var(--border-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', position: 'relative' }}>
                  <ProductImage src={item.image} alt={item.name} icon={item.icon} />
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.category}</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem', marginBottom: '10px' }}>{formatRupiah(item.price)}</div>

                  {qty === 0 ? (
                    <button id={`btn-tambah-${item.id}`} onClick={() => addToCart(item)} style={{
                      width: '100%', padding: '8px', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                    }}>
                      + Tambah
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button onClick={() => changeQty(item.id, -1)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>−</button>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Checkout Bar */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: '#fff', borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{totalItems} item dipilih</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
              {formatRupiah(cart.reduce((s, i) => s + i.price * i.qty, 0))}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> + pajak 10%</span>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} style={{
            background: 'rgba(111,78,55,0.1)', color: 'var(--primary)',
            border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)',
            padding: '10px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
          }}>🛒 Lihat</button>
          <button onClick={() => {
            const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
            const total = subtotal + Math.round(subtotal * 0.1);
            setCheckoutTotal(total);
          }} style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(111,78,55,0.3)'
          }}>📋 Pesan Sekarang →</button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onChangeQty={changeQty}
          onCheckout={(total) => { setShowCart(false); setCheckoutTotal(total); }}
        />
      )}
    </div>
  );
}
