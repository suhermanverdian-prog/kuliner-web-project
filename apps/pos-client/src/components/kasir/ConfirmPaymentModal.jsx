import { useState } from 'react';
import { formatRupiah } from '../../utils/formatters';
import api from '../../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { ShoppingCart, CheckCircle2, AlertCircle, Smartphone, Zap } from 'lucide-react';
import { cn } from "../../lib/utils";

const parseItems = (items) => {
  if (!items) return [];
  let parsed = items;
  if (typeof items === 'string') {
    try {
      parsed = JSON.parse(items);
    } catch (e) {
      console.error('Failed to parse items string:', e);
      return [];
    }
  }
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.cart)) return parsed.cart;
    if (Array.isArray(parsed.data)) return parsed.data;
    const values = Object.values(parsed);
    if (values.length > 0 && values.every(v => typeof v === 'object' && v !== null)) {
      return values;
    }
  }
  return [];
};

export default function ConfirmPaymentModal({ tx, onClose, onSuccess }) {
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

  const handleSimulateWebhook = async () => {
    setLoading(true);
    try {
      await api.simulateWebhook(tx.id);
      onSuccess();
    } catch (e) {
      alert('Simulasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-mono tabular-nums bg-black/50">
      <Card className="w-full max-w-lg border border-border rounded-lg overflow-hidden bg-card flex flex-col max-h-[90vh]">
        <CardHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500">
                <ShoppingCart size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black">Keranjang Pesanan</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Konfirmasi Pembayaran
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8 overflow-y-auto flex-1">
          <div>
            {parseItems(tx.items).map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 dark:text-zinc-100 font-medium">{item.qty}x <span className="text-foreground font-bold">{item.name}</span></span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
              <span className="font-black text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total Tagihan</span>
              <span className="font-black text-3xl text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(total)}</span>
            </div>
          </div>

          {isCash ? (
            <div className="space-y-6">
              <div className="p-6 space-y-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] text-center block">Masukkan Uang Diterima</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-600 dark:text-zinc-300 group-focus-within:text-amber-500 transition-colors">Rp</span>
                  <input
                    type="text"
                    className="w-full h-20 text-3xl text-right pr-6 font-mono tabular-nums font-black bg-card border border-border rounded-lg focus:outline-none focus:border-amber-500 text-foreground transition-colors"
                    value={cashNum > 0 ? cashNum.toLocaleString('id-ID') : ''}
                    onChange={e => setCashReceived(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className={cn(
                "p-6 rounded-lg flex justify-between items-center transition-all duration-500 border-2 shadow-inner",
                change >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
              )}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{change >= 0 ? 'Uang Kembali' : 'Kurang Bayar'}</p>
                  <p className="text-3xl font-black mt-1 font-mono tabular-nums">{formatRupiah(Math.abs(change))}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", change >= 0 ? "bg-emerald-100 dark:bg-emerald-800" : "bg-rose-100 dark:bg-rose-800")}>
                  {change >= 0 ? <CheckCircle2 /> : <AlertCircle />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500/20 border-dashed rounded-lg space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Smartphone size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-bold">Pembayaran via {tx.paymentMethod}.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-10 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest gap-2" onClick={handleSimulateWebhook} disabled={loading}>
                  <Zap size={14} className="fill-current" /> Simulasi Webhook
                </Button>
              </div>
              <Button
                variant={confirmed ? "default" : "outline"}
                className={cn("w-full h-20 text-xl font-black gap-4 rounded-lg border-2 transition-all", confirmed ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900" : "")}
                onClick={() => setConfirmed(!confirmed)}
              >
                {confirmed ? <CheckCircle2 size={32} /> : <div className="w-8 h-8 border-4 border-zinc-300 dark:border-zinc-700 rounded-lg" />}
                Konfirmasi Manual
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-8 border-t border-border bg-background gap-4">
          <Button variant="ghost" className="h-14 flex-1 font-bold rounded-lg border border-border text-foreground bg-card" onClick={onClose}>Batalkan</Button>
          <Button className={cn("h-14 flex-[2] text-lg font-black rounded-lg", !isReadyToPay ? "" : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900")} disabled={!isReadyToPay || loading} onClick={handleConfirm}>
            {loading ? 'Menyelesaikan...' : 'Selesaikan Transaksi'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
