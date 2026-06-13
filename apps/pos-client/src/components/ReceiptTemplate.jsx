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

export const ReceiptTemplate = React.forwardRef(({ tx, user }, ref) => {
  if (!tx) return null;

  return (
    <div ref={ref} className="receipt-container bg-white text-zinc-950 p-6 font-mono text-[11px] leading-tight w-[300px] mx-auto shadow-sm print:shadow-none">
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
        }
        .receipt-container {
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
          width: 280px !important;
          color: #000 !important;
          background: #fff !important;
          margin: 0 auto;
        }
        .receipt-container .text-center { text-align: center !important; }
        .receipt-container .uppercase { text-transform: uppercase !important; }
        .receipt-container .font-bold { font-weight: bold !important; }
        .receipt-container .font-black { font-weight: 900 !important; }
        .receipt-container .text-lg { font-size: 15px !important; }
        .receipt-container .text-base { font-size: 12px !important; }
        .receipt-container .text-[10px] { font-size: 10px !important; }
        .receipt-container .text-[9px] { font-size: 9px !important; }
        .receipt-container .text-[8px] { font-size: 8px !important; }
        .receipt-container .opacity-70 { opacity: 0.7 !important; }
        .receipt-container .opacity-80 { opacity: 0.8 !important; }
        .receipt-container .opacity-60 { opacity: 0.6 !important; }
        .receipt-container .opacity-30 { opacity: 0.3 !important; }
        .receipt-container .pl-2 { padding-left: 8px !important; }
        .receipt-container .italic { font-style: italic !important; }
        .receipt-container .flex {
          display: flex !important;
          justify-content: space-between !important;
        }
        .receipt-container .justify-between {
          justify-content: space-between !important;
        }
        .receipt-container .mb-4 { margin-bottom: 12px !important; }
        .receipt-container .mb-6 { margin-bottom: 18px !important; }
        .receipt-container .pb-4 { padding-bottom: 12px !important; }
        .receipt-container .pt-4 { padding-top: 12px !important; }
        .receipt-container .pt-2 { padding-top: 6px !important; }
        .receipt-container .border-b { border-bottom: 1px dashed #000 !important; }
        .receipt-container .border-t { border-top: 1px dashed #000 !important; }
        .receipt-container .border { border: 1px solid #000 !important; }
        .receipt-container .p-2 { padding: 6px !important; }
        .receipt-container .tracking-widest { letter-spacing: 0.1em !important; }
        .receipt-container .tracking-tighter { letter-spacing: -0.05em !important; }
        .receipt-container .tracking-\\[0\\.4em\\] { letter-spacing: 0.4em !important; }
      `}</style>
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
            {(item.customizationSummary || item.customization_summary) && (
              <div className="text-[9px] text-zinc-600 dark:text-zinc-400 italic leading-none pl-2">
                * {item.customizationSummary || item.customization_summary}
              </div>
            )}
            {(item.note || item.customization?.note || item.customization_summary?.note) && (
              <div className="text-[9px] text-zinc-500 pl-2">
                Catatan: {item.note || item.customization?.note || item.customization_summary?.note}
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
