import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Minus, 
  Plus, 
  Clock, 
  Printer, 
  MessageSquare, 
  User, 
  Award, 
  Wallet, 
  QrCode, 
  Banknote, 
  MapPin,
  Star
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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

function ProductImage({ src, alt, icon, className }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return <img src={src} alt={alt} onError={() => setError(true)} className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${className}`} />;
  }
  return <span className="text-4xl filter drop-shadow-md">{icon || '☕'}</span>;
}

function OrderTracking({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const txs = await api.getTransactions();
        const found = txs.find(t => t.id === orderId);
        if (found) setOrder(found);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground animate-pulse font-medium">Menghubungkan ke dapur...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-6">ID: {orderId}</p>
      <Button onClick={onBack} variant="outline" className="rounded-full px-8">Kembali ke Menu</Button>
    </div>
  );

  const steps = [
    { key: 'new', label: 'Pesanan Diterima', icon: <ShoppingBag size={20} />, desc: 'Dapur telah menerima pesananmu' },
    { key: 'cooking', label: 'Sedang Dimasak', icon: <Coffee size={20} />, desc: 'Koki sedang menyiapkan hidanganmu' },
    { key: 'ready', label: 'Siap Disajikan', icon: <CheckCircle2 size={20} />, desc: 'Silakan ambil di meja kasir' },
    { key: 'served', label: 'Selesai', icon: <Star size={20} />, desc: 'Terima kasih! Selamat menikmati' },
  ];

  const currentIdx = steps.findIndex(s => s.key === (order.kdsStatus || 'new'));

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="max-w-md mx-auto">
        {/* Header Tracking */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MapPin size={120} className="rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Live Order Tracking</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Status Pesanan</h1>
            <p className="opacity-70 text-sm font-medium">#{order?.id?.slice(-6).toUpperCase()} · {order?.customerName || 'Pelanggan'}</p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="px-6 -mt-8">
          <Card className="border-none shadow-2xl rounded-3xl">
            <CardContent className="p-8">
              <div className="space-y-10 relative">
                {/* Connector Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-muted" />
                <div 
                  className="absolute left-[19px] top-2 w-0.5 bg-primary transition-all duration-1000 ease-in-out" 
                  style={{ height: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  
                  return (
                    <div key={step.key} className={`flex gap-6 relative z-10 transition-all duration-500 ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isCurrent ? 'bg-primary text-primary-foreground scale-125 shadow-lg shadow-primary/30 ring-4 ring-primary/20' : 
                        isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-black ${isCurrent ? 'text-primary text-lg' : 'text-foreground'}`}>{step.label}</h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Card */}
        <div className="px-6 mt-6">
          <Card className="rounded-3xl border-muted/50">
            <CardContent className="p-6">
              <h5 className="font-bold mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                Rincian Pesanan
              </h5>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">
                      <span className="font-bold text-foreground">{item.qty}x</span> {item.name}
                    </span>
                    <span className="font-bold">{formatRupiah(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-dashed flex justify-between items-center">
                  <span className="font-bold">Total Pembayaran</span>
                  <span className="text-lg font-black text-primary">{formatRupiah(order.total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <Button onClick={() => printReceipt(order)} variant="outline" className="rounded-2xl gap-2 h-12 font-bold">
                  <Printer size={18} /> Struk
                </Button>
                <Button onClick={() => sendWA(order)} className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl gap-2 h-12 font-bold">
                  <Smartphone size={18} /> WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button onClick={onBack} variant="ghost" className="w-full mt-6 text-muted-foreground hover:text-primary font-bold rounded-2xl h-12">
            <ArrowLeft size={18} className="mr-2" /> Kembali ke Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { key: 'Tunai',         label: 'Tunai',        icon: <Banknote size={20} />, desc: 'Bayar ke kasir' },
  { key: 'QRIS',          label: 'QRIS',         icon: <QrCode size={20} />, desc: 'Scan QR Code' },
  { key: 'E-Wallet',      label: 'E-Wallet',     icon: <Wallet size={20} />, desc: 'GoPay / OVO / Dana' },
  { key: 'Kartu Debit',   label: 'Kartu',        icon: <CreditCard size={20} />, desc: 'Debit / Kredit' },
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="p-6 flex items-center gap-4 border-b bg-card sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-black">Konfirmasi Pesanan</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section: Customer Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-black">Informasi Kontak</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nama Lengkap</label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Contoh: Budi Santoso"
                  className="rounded-2xl h-12 bg-muted/30 border-none"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">No. WhatsApp</label>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="Contoh: 08123456789"
                  className="rounded-2xl h-12 bg-muted/30 border-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Tipe Pesanan</label>
                  <select 
                    value={form.orderType}
                    onChange={e => setForm({...form, orderType: e.target.value})}
                    className="w-full h-12 rounded-2xl bg-muted/30 border-none px-4 text-sm font-medium outline-none appearance-none"
                  >
                    <option value="Dine-in">Dine-in</option>
                    <option value="Take Away">Take Away</option>
                  </select>
                </div>
                {form.orderType === 'Dine-in' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">No. Meja</label>
                    <Input 
                      value={form.tableNum}
                      onChange={e => setForm({...form, tableNum: e.target.value})}
                      placeholder="Meja"
                      className="rounded-2xl h-12 bg-muted/30 border-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Payment Method */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-black">Metode Pembayaran</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  type="button"
                  key={pm.key}
                  onClick={() => setForm({...form, paymentMethod: pm.key})}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                    form.paymentMethod === pm.key 
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                    : 'border-muted bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    form.paymentMethod === pm.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {pm.icon}
                  </div>
                  <div className="font-black text-sm">{pm.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{pm.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Section: Note */}
          <section className="space-y-4 pb-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-black">Catatan Pesanan</h2>
            </div>
            <textarea
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              placeholder="Contoh: Kurangi gula, es batu dipisah, dll."
              className="w-full p-4 rounded-2xl bg-muted/30 border-none min-h-[100px] text-sm font-medium outline-none"
            />
          </section>
        </form>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-30">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Bayar</p>
              <p className="text-xl font-black text-primary">{formatRupiah(total)}</p>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-[1.5] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/30"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Konfirmasi & Pesan <ChevronRight size={20} className="ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClose, onChangeQty, onCheckout }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-[1000] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-full max-w-sm bg-background h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-xl font-black">Keranjang</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={24} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-10">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={40} className="text-muted-foreground" />
              </div>
              <h4 className="text-lg font-bold">Keranjang Kosong</h4>
              <p className="text-sm">Pilih menu favoritmu untuk mulai memesan!</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                  <ProductImage src={item.image} alt={item.name} icon={item.icon} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="font-bold text-sm truncate">{item.name}</h4>
                  <p className="text-primary font-black text-sm mt-0.5">{formatRupiah(item.price)}</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <button 
                      onClick={() => onChangeQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-muted-foreground/30 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{item.qty}</span>
                    <button 
                      onClick={() => onChangeQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t space-y-4 bg-muted/20">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pajak (10%)</span>
                <span>{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-dashed">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(total)}</span>
              </div>
            </div>
            <Button 
              onClick={() => onCheckout(total)}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20"
            >
              Checkout Sekarang
            </Button>
          </div>
        )}
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
  const [orderMode, setOrderMode] = useState(tableFromQR ? 'Dine-in' : null);
  const [tableNumber, setTableNumber] = useState(tableFromQR || '');

  useEffect(() => {
    const fetchMenu = () => api.getMenu().then(data => setMenu(data));
    fetchMenu();
    const interval = setInterval(fetchMenu, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.removeItem('lastOrderId');
      setActiveOrderId(null);
    } else {
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
    const matchSearch = (m.name || '').toLowerCase().includes(search.toLowerCase());
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

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-[100] w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">BM</div>
            <span className="font-black text-xl tracking-tight text-primary">BrewMaster</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-muted/50 py-1 pl-1 pr-3 rounded-full border border-muted-foreground/10">
                <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs uppercase">
                  {user.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-accent leading-none">{user.points || 0} PTS</span>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" asChild className="rounded-full font-bold text-xs">
                <a href="#/member-login">👤 Member</a>
              </Button>
            )}
            
            <Button 
              id="btn-buka-keranjang"
              onClick={() => setShowCart(true)}
              variant={totalItems > 0 ? "default" : "secondary"}
              size="sm"
              className="rounded-full px-4 h-9 font-black transition-all duration-300"
            >
              <ShoppingBag size={16} className="mr-2" />
              {totalItems > 0 ? totalItems : '0'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-primary px-6 pt-10 pb-20 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-background/5 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-accent font-black uppercase tracking-[0.2em] text-[10px] mb-3">Selamat Datang</p>
          <p className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            {user?.name ? `Siap ngopi lagi, ${user.name.split(' ')[0]}?` : 'Nikmati Kopi Terbaik Hari Ini.'}
          </p>
          <p className="text-white/60 font-medium text-sm md:text-base max-w-sm">
            Temukan racikan kopi autentik dan kudapan lezat favoritmu di BrewMaster.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10 relative z-20">
        {/* Search & Categories */}
        <div className="bg-card rounded-[2.5rem] p-6 shadow-2xl border border-muted/50 space-y-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Lagi pengen minum apa?" 
              className="pl-12 h-14 rounded-3xl bg-muted/30 border-none font-medium text-base focus-visible:ring-primary"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {['Semua', ...MENU_CATEGORIES].map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)}
                className={`px-6 h-10 rounded-2xl whitespace-nowrap font-black text-xs transition-all duration-300 transform active:scale-95 ${
                  category === c 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <div className="text-4xl mb-4">☕</div>
              <p className="font-bold">Menu tidak ditemukan</p>
              <p className="text-sm">Coba cari dengan kata kunci lain.</p>
            </div>
          ) : (
            filtered.map(item => {
              const qty = getQty(item.id);
              return (
                <div key={item.id} className={`group bg-card rounded-[2rem] border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                  qty > 0 ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : 'border-muted/50'
                }`}>
                  <div className="flex p-4 gap-4 h-[140px]">
                    <div className="w-1/3 aspect-square rounded-2xl overflow-hidden bg-muted relative">
                      <ProductImage src={item.image} alt={item.name} icon={item.icon} />
                      {qty > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg">
                          {qty}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h3 className="font-black text-base truncate group-hover:text-primary transition-colors">{item.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{item.category}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-lg text-primary">{formatRupiah(item.price)}</span>
                        
                        {qty === 0 ? (
                          <button 
                            id={`btn-tambah-${item.id}`}
                            onClick={() => addToCart(item)}
                            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                          >
                            <Plus size={20} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 bg-background/50 backdrop-blur-md rounded-xl p-1 border">
                            <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"><Minus size={14} /></button>
                            <span className="font-black text-sm">{qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Persistent Floating Checkout Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-8 left-6 right-6 z-[500] animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-xl mx-auto bg-primary text-primary-foreground rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl shadow-primary/40 ring-4 ring-primary/20">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative">
                <ShoppingBag size={24} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-[10px] font-black flex items-center justify-center border-2 border-primary">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">Total Pesanan</p>
                <p className="text-xl font-black">{formatRupiah(cart.reduce((s, i) => s + i.price * i.qty, 0))}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCart(true)} 
                variant="ghost" 
                className="rounded-2xl w-14 h-14 p-0 bg-white/10 hover:bg-white/20 border-none"
              >
                <ShoppingBag size={24} />
              </Button>
              <Button 
                onClick={() => {
                  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
                  const total = subtotal + Math.round(subtotal * 0.1);
                  setCheckoutTotal(total);
                }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 rounded-2xl px-8 font-black text-lg shadow-inner group"
              >
                Pesan Sekarang
                <ChevronRight size={24} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
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
