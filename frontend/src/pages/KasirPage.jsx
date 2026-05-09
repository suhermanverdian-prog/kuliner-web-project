import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';

function ConfirmPaymentModal({ tx, onClose, onSuccess }) {
  const [cashReceived, setCashReceived] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = tx.total;
  const cashNum = Number(String(cashReceived).replace(/[^0-9]/g, '')) || 0;
  const change = cashNum - total;
  const isCash = tx.paymentMethod === 'Tunai';
  const isReadyToPay = isCash ? cashNum >= total : confirmed;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.confirmPayment(tx.id, {
        cashReceived: isCash ? cashNum : total,
        change: isCash ? change : 0,
        paymentMethod: tx.paymentMethod
      });
      onSuccess(res);
    } catch (e) {
      alert('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const METHOD_INFO = {
    'QRIS':          { icon: '📱', instruction: 'Minta pelanggan scan QR Code di mesin kasir/display QRIS. Pastikan notifikasi pembayaran sudah diterima sebelum konfirmasi.' },
    'Transfer Bank': { icon: '🏦', instruction: 'Minta pelanggan menunjukkan bukti transfer. Periksa mutasi rekening BCA 1234-5678-90 a/n BrewMaster untuk memastikan dana sudah masuk.' },
    'Kartu Debit':   { icon: '💳', instruction: 'Proses kartu debit/kredit pelanggan di mesin EDC. Tunggu hingga slip pembayaran tercetak.' },
    'E-Wallet':      { icon: '📲', instruction: 'Minta pelanggan scan QR OVO/GoPay/Dana yang tersedia. Pastikan notifikasi pembayaran berhasil muncul.' },
  };
  const methodInfo = METHOD_INFO[tx.paymentMethod];

  const cashButtons = [total];
  for (const d of [20000, 50000, 100000, 200000]) {
    if (d > total && cashButtons.length < 4) cashButtons.push(d);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-title">💳 Konfirmasi Pembayaran</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {tx.id} · {tx.customerName || 'Pelanggan'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Ringkasan pesanan */}
          <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rincian Pesanan</div>
            {tx.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span>{item.qty}× {item.name}</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', borderTop: '1.5px dashed var(--border)', paddingTop: '8px' }}>
              <span>Total Tagihan</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {tx.tableType} · Metode: <strong>{tx.paymentMethod}</strong>
            </div>
          </div>

          {/* TUNAI */}
          {isCash && (
            <>
              <div className="form-group">
                <label className="form-label">💵 Uang Diterima dari Pelanggan</label>
                <input
                  type="text" className="form-control"
                  style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center' }}
                  value={cashNum > 0 ? formatRupiah(cashNum) : ''}
                  onChange={e => setCashReceived(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ketik nominal uang..."
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {cashButtons.map(amt => (
                    <button key={amt} type="button"
                      onClick={() => setCashReceived(String(amt))}
                      style={{
                        flex: 1, minWidth: '80px', padding: '8px 4px', borderRadius: 'var(--radius-sm)',
                        border: cashNum === amt ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: cashNum === amt ? '#FFF3EC' : '#fff',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                      }}>
                      {amt === total ? 'Uang Pas' : formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderRadius: 'var(--radius-md)', marginTop: '4px',
                background: change >= 0 ? '#EDFAF3' : '#FEF0EE',
                color: change >= 0 ? '#1A4A2E' : '#E85D4A',
                border: `2px solid ${change >= 0 ? '#86EFAC' : '#FCA5A5'}`
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {change >= 0 ? '✅ Kembalian ke Pelanggan' : '⚠️ Uang Kurang'}
                  </div>
                  {change < 0 && <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Kurang {formatRupiah(Math.abs(change))}</div>}
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  {change >= 0 ? formatRupiah(change) : '–'}
                </span>
              </div>
            </>
          )}

          {/* NON-TUNAI: instruksi + checkbox */}
          {!isCash && methodInfo && (
            <div>
              <div style={{ background: '#EDF5FA', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                  {methodInfo.icon} Langkah Konfirmasi {tx.paymentMethod}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1A4A5F', lineHeight: 1.7 }}>
                  {methodInfo.instruction}
                </div>
              </div>
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                padding: '14px', borderRadius: 'var(--radius-sm)',
                background: confirmed ? '#EDFAF3' : 'var(--bg)',
                border: `2px solid ${confirmed ? '#86EFAC' : 'var(--border)'}`
              }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: confirmed ? '#1A4A2E' : 'var(--text-primary)' }}>
                  {confirmed ? '✅ Pembayaran sudah dikonfirmasi diterima' : 'Centang jika pembayaran sudah diterima & valid'}
                </span>
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 1, opacity: isReadyToPay ? 1 : 0.5 }}
            onClick={handleConfirm} disabled={loading || !isReadyToPay}>
            {loading
              ? '⏳ Memproses...'
              : isCash
                ? `✅ Lunas · Kembalikan ${formatRupiah(change >= 0 ? change : 0)}`
                : '✅ Konfirmasi Pembayaran Lunas'
            }
          </button>
        </div>
      </div>
    </div>
  );
}



function CheckoutModal({ cart, onClose, onSuccess, user }) {
  const [payMethod, setPayMethod] = useState('Tunai');
  const [discount, setDiscount] = useState(0);
  const [tableNum, setTableNum] = useState('');
  const [orderType, setOrderType] = useState('Dine-in');
  const [splitCount, setSplitCount] = useState(1);
  const [loading, setLoading] = useState(false);

  // Feature Lock: Hanya tier pro/franchise yang bisa QRIS
  const tenantTier = user?.tenant?.tier || 'lite';
  const isPremium = tenantTier === 'pro' || tenantTier === 'franchise';

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = Math.round(subtotal * 0.1);
  const discountAmount = discount ? Math.round(subtotal * (discount / 100)) : 0;
  const total = subtotal + taxAmount - discountAmount;
  const splitTotal = splitCount > 1 ? Math.round(total / splitCount) : total;

  const handlePay = async () => {
    setLoading(true);
    try {
      const tableType = orderType === 'Dine-in' && tableNum ? `Meja ${tableNum}` : orderType;
      const transactionData = {
        tableType,
        paymentMethod: payMethod,
        cashierName: 'Kasir',
        subtotal,
        taxAmount,
        discountAmount,
        total,
        type: orderType,
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
      };
      const res = await api.checkout(transactionData);
      onSuccess(res);
    } catch (e) {
      console.error('Gagal memproses pembayaran', e);
      alert('Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">💳 Proses Pembayaran</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipe Pesanan</label>
              <select className="form-control" value={orderType} onChange={e => setOrderType(e.target.value)}>
                <option>Dine-in</option>
                <option>Take Away</option>
                <option>Delivery</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nomor Meja</label>
              <input className="form-control" placeholder="cth: Meja 3" value={tableNum} onChange={e => setTableNum(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Metode Pembayaran</label>
            <div className="flex gap-2" style={{flexWrap:'wrap'}}>
              {['Tunai','QRIS','Kartu Debit','Transfer','Hutang'].map(m => {
                const isLocked = !isPremium && m !== 'Tunai';
                return (
                  <button key={m} type="button"
                    className={`cat-tab ${payMethod === m ? 'active' : ''}`}
                    onClick={() => {
                      if (isLocked) return alert('Fitur ini hanya tersedia untuk Paket Pro. Silakan upgrade!');
                      setPayMethod(m);
                    }}
                    style={{ opacity: isLocked ? 0.5 : 1, position: 'relative' }}
                  >
                    {m} {isLocked && <span style={{fontSize:'0.7rem', marginLeft:'4px'}}>🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Diskon (%)</label>
              <input type="number" className="form-control" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Split Bill (Orang)</label>
              <input type="number" className="form-control" min="1" max="20" value={splitCount} onChange={e => setSplitCount(Number(e.target.value))} />
            </div>
          </div>
          <div style={{background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'16px', marginTop:'8px'}}>
            <div className="cart-summary-row"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            <div className="cart-summary-row"><span>Pajak (10%)</span><span>{formatRupiah(taxAmount)}</span></div>
            {discount > 0 && <div className="cart-summary-row" style={{color:'var(--success)'}}><span>Diskon {discount}%</span><span>-{formatRupiah(discountAmount)}</span></div>}
            <div className="cart-total-row"><span>Total</span><span style={{color:'var(--primary)'}}>{formatRupiah(total)}</span></div>
            {splitCount > 1 && (
              <div className="cart-summary-row" style={{marginTop:'8px', paddingTop:'8px', borderTop:'1px dashed var(--border-light)', color:'var(--accent)', fontWeight:800}}>
                <span>Tagihan per orang ({splitCount}x)</span>
                <span>{formatRupiah(splitTotal)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Batal</button>
          <button id="btn-bayar-modal" className="btn btn-primary" disabled={loading} onClick={handlePay} style={{flex: 1, padding: '12px'}}>
            {loading ? '⏳ Memproses...' : `💵 Bayar ${formatRupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ tx, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:'400px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{textAlign:'center', padding:'40px 28px'}}>
          <div style={{fontSize:'4rem', marginBottom:'12px', animation:'bounceIn 0.4s ease'}}>✅</div>
          <h2 style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', marginBottom:'4px'}}>Pembayaran Berhasil!</h2>
          {tx && (
            <div style={{background:'var(--bg)', borderRadius:'var(--radius-md)', padding:'16px', margin:'16px 0', textAlign:'left'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'6px'}}>
                <span style={{color:'var(--text-muted)'}}>ID Transaksi</span>
                <span style={{fontWeight:700, color:'var(--primary)', fontFamily:'monospace'}}>{tx.id}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'6px'}}>
                <span style={{color:'var(--text-muted)'}}>Total Bayar</span>
                <span style={{fontWeight:800, color:'var(--primary)'}}>{tx.total?.toLocaleString('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0})}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem'}}>
                <span style={{color:'var(--text-muted)'}}>Metode</span>
                <span style={{fontWeight:600}}>{tx.paymentMethod}</span>
              </div>
              {tx.cashReceived > 0 && (
                <>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginTop:'6px'}}>
                    <span style={{color:'var(--text-muted)'}}>Tunai Diterima</span>
                    <span>{formatRupiah(tx.cashReceived)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginTop:'6px', fontWeight:700, color:'var(--success)'}}>
                    <span>Kembalian</span>
                    <span>{formatRupiah(tx.change)}</span>
                  </div>
                </>
              )}
            </div>
          )}
          <button id="btn-transaksi-baru" className="btn btn-primary btn-lg w-full" onClick={onClose} style={{justifyContent:'center'}}>
            🧾 Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KasirPage({ user }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTx, setLastTx] = useState(null);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'pending'
  const [selectedPendingTx, setSelectedPendingTx] = useState(null);

  const fetchMenuAndOrders = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [menuData, txData, shiftData] = await Promise.all([
        api.getMenu(), 
        api.getTransactions(),
        api.getActiveShift()
      ]);
      setMenus(menuData);
      setActiveShift(shiftData);
      setPendingOrders(txData.filter(t => 
        (t.paymentStatus === 'pending_payment' && t.paymentMethod === 'Tunai') || 
        t.paymentStatus === 'pending_acceptance'
      ));
    } catch (e) {
      console.error(e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndOrders(true);
    const interval = setInterval(() => fetchMenuAndOrders(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = menus.filter(m => {
    const matchCat = category === 'Semua' || m.category === category;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleSuccess = (txData) => {
    setLastTx(txData);
    setShowCheckout(false);
    setShowSuccess(true);
    setCart([]);
  };

  // BR-001: Block UI if no active shift
  if (!loading && !activeShift) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--text-primary)' }}>Kasir Terkunci</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
          Shift kasir belum dimulai. Berdasarkan aturan BR-001, pesanan hanya bisa dibuat jika ada shift yang aktif.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => window.location.hash = '#/shift'}>
          Buka Shift Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* Kiri: Menu atau Pending Orders */}
      <div className="pos-menu" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '16px 24px 0' }}>
          <button onClick={() => setActiveTab('menu')} style={{
            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'menu' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: activeTab === 'menu' ? 700 : 500, color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '1rem'
          }}>
            🍔 Pesanan Baru
          </button>
          <button onClick={() => setActiveTab('pending')} style={{
            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            borderBottom: activeTab === 'pending' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: activeTab === 'pending' ? 700 : 500, color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '1rem'
          }}>
            ⏳ Menunggu Pembayaran
            {pendingOrders.length > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                {pendingOrders.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'menu' ? (
          <>
            <div className="menu-search-bar" style={{ margin: '16px 24px 0' }}>
              <span className="search-icon">🔍</span>
              <input id="search-menu" placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
        <div className="category-tabs">
          {MENU_CATEGORIES.map(c => (
            <button key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div className="menu-grid">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat menu...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Menu tidak ditemukan.</div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden', transition: 'var(--transition)' }} onClick={() => addToCart(item)}>
                <div style={{ height: '120px', background: 'linear-gradient(135deg, #FFF8F4, #FEECD8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    item.icon
                  )}
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.category}</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatRupiah(item.price)}</div>
                </div>
              </div>
            ))
          )}
        </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg)' }}>
            {pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
                <div style={{ fontWeight: 600 }}>Tidak ada pesanan tertunda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingOrders.map(tx => {
                  const isOjol = tx.paymentStatus === 'pending_acceptance';
                  const ojolPlatform = tx.tableType || 'Ojol';
                  return (
                  <div key={tx.id} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {tx.id} - {tx.customerName || 'Pelanggan'}
                        {isOjol && <span className={`badge ${ojolPlatform.includes('Go') ? 'badge-danger' : ojolPlatform.includes('Grab') ? 'badge-success' : 'badge-warning'}`}>{ojolPlatform}</span>}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Metode: {tx.paymentMethod}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '8px' }}>{formatRupiah(tx.total)}</div>
                      {isOjol ? (
                        <button onClick={async () => {
                          try {
                            await api.confirmPayment(tx.id, { paymentMethod: tx.paymentMethod, cashierName: 'Kasir', cashReceived: tx.total, change: 0 });
                            fetchMenuAndOrders(true);
                          } catch(e) { alert('Gagal menerima order ojol'); }
                        }} className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          🛵 Terima Order
                        </button>
                      ) : (
                        <button onClick={() => setSelectedPendingTx(tx)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          💳 Proses Bayar
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="pos-cart">
        <div className="cart-header">
          <div className="flex justify-between items-center">
            <span className="cart-title">🛒 Keranjang</span>
            {totalItems > 0 && (
              <span className="badge badge-brown">{totalItems} item</span>
            )}
          </div>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p style={{fontWeight:600}}>Keranjang Kosong</p>
              <p className="text-sm mt-1">Klik menu untuk menambahkan pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatRupiah(item.price * item.qty)}</div>
                </div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            <div className="cart-summary-row"><span>Pajak (10%)</span><span>{formatRupiah(Math.round(subtotal * 0.1))}</span></div>
            <div className="cart-total-row">
              <span>Total</span>
              <span style={{color:'var(--primary)'}}>{formatRupiah(subtotal + Math.round(subtotal * 0.1))}</span>
            </div>
            <button id="btn-checkout" className="checkout-btn" onClick={() => setShowCheckout(true)}>
              💳 Bayar Sekarang
            </button>
            <button className="btn btn-outline w-full mt-2" style={{justifyContent:'center'}} onClick={() => setCart([])}>
              🗑️ Hapus Semua
            </button>
          </div>
        )}
      </div>

      {showCheckout && <CheckoutModal cart={cart} onClose={() => setShowCheckout(false)} onSuccess={handleSuccess} user={user} />}
      {showSuccess && <SuccessModal tx={lastTx} onClose={() => setShowSuccess(false)} />}
      {selectedPendingTx && <ConfirmPaymentModal tx={selectedPendingTx} onClose={() => setSelectedPendingTx(null)} onSuccess={(tx) => { setSelectedPendingTx(null); handleSuccess(tx); fetchMenuAndOrders(); }} />}
    </div>
  );
}
