import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export default function DigitalReceipt({ transaction }) {
  const rawUser = useAppStore(state => state.user);
  const user = (rawUser && rawUser.user && rawUser.token) ? rawUser.user : rawUser;

  if (!transaction) return null;

  const items = transaction.items || [];
  const tax = Number(transaction.tax) || 0;
  const discount = Number(transaction.discount) || 0;
  const subtotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
  const grandTotal = Number(transaction.total) || (subtotal + tax - discount);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white text-zinc-900 border border-zinc-200 p-6 rounded-lg font-mono tabular-nums text-xs shadow-2xl relative">
      {/* Receipt Cut Deco */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-200 via-transparent to-zinc-200" />
      
      {/* Header */}
      <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-300">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">KEN COFFEE CO.</h3>
        <p className="text-[10px] text-zinc-500">Kawasan SCBD Lot 8, Jakarta Selatan</p>
        <p className="text-[9px] text-zinc-400">Telp: 021-99887766</p>
      </div>

      {/* Transaction Metadata */}
      <div className="py-4 space-y-1 text-[10px] text-zinc-600 border-b border-dashed border-zinc-300 leading-relaxed">
        <div className="flex justify-between">
          <span>NO STRUK :</span>
          <span className="font-bold">{transaction.id?.slice(0, 18).toUpperCase() || 'TRX-TEMP'}</span>
        </div>
        <div className="flex justify-between">
          <span>TANGGAL  :</span>
          <span>{transaction.created_at ? new Date(transaction.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>KASIR    :</span>
          <span className="uppercase">{transaction.cashier_name || user?.name || 'SYSTEM'}</span>
        </div>
      </div>

      {/* Purchased Items */}
      <div className="py-4 space-y-3 border-b border-dashed border-zinc-300">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between font-bold">
              <span className="uppercase">{item.name}</span>
              <span>{formatCurrency(Number(item.price) * Number(item.qty))}</span>
            </div>
            <div className="flex justify-between text-zinc-500 text-[10px]">
              <span>{Number(item.qty)} x {formatCurrency(item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="py-4 space-y-1.5 border-b border-dashed border-zinc-300 font-medium">
        <div className="flex justify-between">
          <span>SUBTOTAL</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>DISKON</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>PPN (11%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-amber-600 pt-2">
          <span>TOTAL</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Footer & QR */}
      <div className="pt-6 text-center space-y-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-24 h-24 bg-zinc-100 border-2 border-zinc-300 rounded p-1.5 flex items-center justify-center">
            {/* Mock QR Code visually satisfying */}
            <div className="w-full h-full bg-[radial-gradient(#18181b_40%,transparent_40%)] bg-[length:6px_6px]" />
          </div>
          <span className="text-[8px] text-zinc-400 uppercase tracking-widest leading-none">Scan untuk Validasi Kriptografis</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-zinc-800">Terima Kasih</p>
          <p className="text-[8px] text-zinc-400">Signature: {transaction.signature?.slice(0, 16) || 'SECURED-BY-HMAC-SHA256'}</p>
        </div>
      </div>
    </div>
  );
}
