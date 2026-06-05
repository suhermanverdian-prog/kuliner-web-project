import React from 'react';
import { formatRupiah } from '../utils/formatters';

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
  
  if (Array.isArray(parsed)) {
    return parsed;
  }
  
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

/**
 * @component ReceiptTemplate
 * @description Desain Struk Thermal 58mm/80mm Standard Indonesia
 */
export const ReceiptTemplate = React.forwardRef(({ tx, user }, ref) => {
  if (!tx) return null;

  return (
    <div ref={ref} className="bg-white text-zinc-950 p-6 font-mono text-[11px] leading-tight w-[300px] mx-auto shadow-sm print:shadow-none">
      {/* HEADER */}
      <div className="text-center space-y-1 mb-4 border-b border-dashed border-zinc-300 pb-4">
        <h1 className="text-lg font-black tracking-tighter uppercase">BREWMASTER</h1>
        <p className="text-[9px] font-bold uppercase tracking-widest">{user?.tenant?.name || 'Enterprise Coffee'}</p>
        <p className="text-[8px] opacity-70">Jln. Kebangsaan No. 45, Jakarta</p>
        <p className="text-[8px] opacity-70">Telp: 0812-3456-7890</p>
      </div>

      {/* INFO TRANSAKSI */}
      <div className="space-y-1 mb-4 border-b border-dashed border-zinc-300 pb-4">
        <div className="flex justify-between">
          <span>NO REG:</span>
          <span className="font-bold">{tx.order_number || tx.id?.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>KASIR:</span>
          <span>{tx.cashier_name || user?.name || 'System'}</span>
        </div>
        <div className="flex justify-between">
          <span>WAKTU:</span>
          <span>{new Date(tx.created_at).toLocaleString('id-ID', { hour12: false })}</span>
        </div>
        <div className="flex justify-between">
          <span>TIPE:</span>
          <span className="font-bold uppercase">{tx.table_type || 'Take Away'}</span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="space-y-2 mb-4 border-b border-dashed border-zinc-300 pb-4">
        {parseItems(tx.items).map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">{item.name}</span>
            </div>
            {item.customizationSummary && (
              <div className="text-[9px] text-zinc-600 dark:text-zinc-400 italic leading-none pl-2">
                * {item.customizationSummary}
              </div>
            )}
            {(item.note || item.customization?.note) && (
              <div className="text-[9px] text-zinc-500 pl-2">
                Catatan: {item.note || item.customization?.note}
              </div>
            )}
            <div className="flex justify-between opacity-80 pt-0.5">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.qty * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <div className="space-y-1 mb-6">
        <div className="flex justify-between">
          <span>SUBTOTAL</span>
          <span>{formatRupiah(tx.total - (tx.tax || 0) + (tx.discount || 0))}</span>
        </div>
        {tx.discount > 0 && (
          <div className="flex justify-between">
            <span>DISKON</span>
            <span>-{formatRupiah(tx.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>PAJAK (10%)</span>
          <span>{formatRupiah(tx.tax || 0)}</span>
        </div>
        <div className="flex justify-between text-base font-black pt-2 border-t border-dashed border-zinc-300">
          <span>TOTAL</span>
          <span>{formatRupiah(tx.total)}</span>
        </div>
        
        <div className="flex justify-between pt-4 opacity-70">
          <span className="uppercase text-[9px]">{tx.payment_method || 'Tunai'}</span>
          <span>{formatRupiah(tx.cash_received || tx.total)}</span>
        </div>
        <div className="flex justify-between opacity-70">
          <span className="uppercase text-[9px]">KEMBALI</span>
          <span>{formatRupiah(tx.change_amount || 0)}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center space-y-2 border-t border-dashed border-zinc-300 pt-4">
        <p className="font-bold text-[10px]">TERIMA KASIH</p>
        <p className="text-[8px] opacity-60">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
        <div className="pt-2 flex justify-center">
           <div className="border border-zinc-300 p-2 text-[8px] tracking-[0.4em] font-black opacity-30">
              KEN ENTERPRISE
           </div>
        </div>
      </div>
    </div>
  );
});
