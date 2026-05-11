const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; font-size: 12px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A4; margin: 15mm; } .no-print { display: none; } }
  .page { max-width: 800px; margin: 0 auto; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .logo { width: 48px; height: 48px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color:#fff; letter-spacing: -1px; }
  .store-name { font-size: 16px; font-weight: 800; color: #1e293b; }
  .store-info { font-size: 10px; color: #64748b; margin-top: 2px; }
  .report-title { text-align: right; }
  .report-title h2 { font-size: 15px; font-weight: 700; color: #6366f1; }
  .report-title p { font-size: 10px; color: #64748b; margin-top: 3px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; color: #374151; font-weight: 700; font-size: 10px; text-transform: uppercase; padding: 8px 10px; text-align: left; border: 1px solid #e2e8f0; }
  td { padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 11px; vertical-align: middle; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-yellow { background: #fef9c3; color: #b45309; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .kpi-label { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; }
  .kpi-value { font-size: 15px; font-weight: 800; color: #1e293b; margin-top: 4px; }
  .kpi-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
  .highlight { background: #6366f1 !important; color: #fff !important; font-weight: 700; }
  .highlight td { background: #6366f1 !important; color: #fff !important; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
  .summary-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
  .summary-row.total { font-weight: 800; font-size: 13px; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
  .laba-bersih { background: #6366f1; color: #fff; border-radius: 8px; padding: 14px; text-align: center; }
  .laba-bersih .value { font-size: 24px; font-weight: 800; }
  .laba-bersih .label { font-size: 11px; opacity: 0.85; margin-top: 4px; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #6366f1; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; z-index: 999; }
`;

function reportHeader(meta, title) {
  return `
    <div class="header">
      <div class="header-left">
        <div class="logo">K</div>
        <div>
          <div class="store-name">${meta.storeName}</div>
          <div class="store-info" style="font-weight:700;color:#6366f1;font-size:9px;text-transform:uppercase;letter-spacing:1px">Kitchen Enterprise Nodes &bull; KEN</div>
          <div class="store-info">${meta.storeAddress}</div>
          <div class="store-info">${meta.storePhone}</div>
        </div>
      </div>
      <div class="report-title">
        <h2>${title}</h2>
        <p>${meta.periodLabel}</p>
      </div>
    </div>`;
}

function reportFooter(meta) {
  return `<div class="footer"><span>Dicetak oleh: ${meta.printedBy || 'admin'}</span><span>${meta.printedAt}</span></div>`;
}

function buildHTML(meta, title, bodyHTML) {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
    <title>${title} - ${meta.storeName}</title>
    <style>${BASE_CSS}
      .toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: #1e293b; color: #fff; padding: 10px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
      .toolbar .title { flex: 1; font-weight: 700; font-size: 14px; }
      .toolbar .hint { font-size: 11px; color: #94a3b8; }
      .toolbar button { padding: 8px 18px; border: none; border-radius: 7px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .btn-pdf { background: #ef4444; color: #fff; }
      .btn-print { background: #6366f1; color: #fff; }
      .btn-close { background: #475569; color: #fff; }
      .toolbar button:hover { opacity: 0.85; }
      .page-wrap { margin-top: 60px; }
      @media print { .toolbar { display: none !important; } .page-wrap { margin-top: 0; } }
    </style>
    </head>
    <body>
    <div class="toolbar no-print">
      <span class="title">📄 ${title}</span>
      <button class="btn-print" onclick="window.print()">🖨️ Print</button>
      <button class="btn-close" onclick="window.close()">✕ Tutup</button>
    </div>
    <div class="page-wrap">
    <div class="page">
      ${reportHeader(meta, title)}
      ${bodyHTML}
      ${reportFooter(meta)}
    </div>
    </div>
    <script>
      // Auto-open print dialog after short delay so page renders first
      window.onload = function() {
        setTimeout(function() { window.print(); }, 800);
      };
    </script>
    </body></html>`;
}

// ───────── TEMPLATE FUNCTIONS ─────────

function tplPenjualanHarian(d) {
  const rows = d.byMethod.map(m =>
    `<tr><td>${m.name}</td><td style="text-align:right">${fmt(m.amount)}</td></tr>`).join('');
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Ringkasan Penjualan</div>
      <table>
        <thead><tr><th>Keterangan</th><th>Member</th><th>Guest</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>Total Transaksi</td><td>${d.summary.memberTrx}</td><td>${d.summary.guestTrx}</td><td><b>${d.summary.totalTrx}</b></td></tr>
          <tr><td>Omzet Bruto (Gross Sales)</td><td>${fmt(d.memberSales)}</td><td>${fmt(d.guestSales)}</td><td><b>${fmt(d.summary.grossSales)}</b></td></tr>
          <tr><td>Diskon / Voucher</td><td>-</td><td>-</td><td>${fmt(d.summary.discount)}</td></tr>
          <tr class="highlight"><td><b>Omzet Netto (Net Sales)</b></td><td><b>${fmt(d.memberSales)}</b></td><td><b>${fmt(d.guestSales)}</b></td><td><b>${fmt(d.summary.netSales)}</b></td></tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Rekonsiliasi Pembayaran</div>
      <table>
        <thead><tr><th>Metode Pembayaran</th><th>Jumlah (Rp)</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="highlight"><td><b>TOTAL</b></td><td style="text-align:right"><b>${fmt(d.payment.total)}</b></td></tr>
          <tr><td>SELISIH KAS</td><td style="text-align:right; color: ${d.payment.selisih === 0 ? '#16a34a' : '#dc2626'}">${fmt(d.payment.selisih)}</td></tr>
        </tbody>
      </table>
    </div>`);
}

function tplInventaris(d) {
  const rows = d.items.map((b, i) => `
    <tr>
      <td>${i+1}</td><td>${b.name}</td><td>${b.unit}</td>
      <td style="text-align:right; font-weight:700">${b.stock}</td>
      <td style="text-align:right">${b.minStock}</td>
      <td><span class="badge ${b.status === 'Aman' ? 'badge-green' : b.status === 'Habis' ? 'badge-red' : 'badge-yellow'}">${b.status}</span></td>
    </tr>`).join('');
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Ringkasan Stok Saat Ini</div>
      <table>
        <thead><tr><th>No</th><th>Nama Bahan</th><th>Satuan</th><th>Stok Saat Ini</th><th>Stok Minimum</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Ringkasan</div>
      <div class="summary-box">
        <div class="summary-row"><span>Total Item</span><span>${d.summary.total}</span></div>
        <div class="summary-row"><span>Item Stok Kritis</span><span style="color:#dc2626;font-weight:700">${d.summary.critical}</span></div>
        <div class="summary-row"><span>Item Stok Habis</span><span style="color:#dc2626;font-weight:700">${d.summary.empty}</span></div>
      </div>
    </div>`);
}

function tplWaste(d) {
  const rows = d.items.length ? d.items.map((w, i) => `
    <tr><td>${i+1}</td><td>${w.bahanName||'-'}</td><td>${w.category||'Lainnya'}</td><td>${w.qty||1}</td><td>${w.unit||'-'}</td><td style="text-align:right">${fmt(w.amount)}</td></tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Tidak ada data waste</td></tr>';
  return buildHTML(d.meta, d.title, `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Total Waste</div><div class="kpi-value" style="color:#dc2626">${fmt(d.summary.totalWaste)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Waste Ratio</div><div class="kpi-value" style="color:${d.summary.wasteRatio>3?'#dc2626':'#16a34a'}">${d.summary.wasteRatio}%</div></div>
      <div class="kpi-card"><div class="kpi-label">Status</div><div class="kpi-value" style="font-size:12px;color:${d.summary.status==='Normal'?'#16a34a':'#dc2626'}">${d.summary.status}</div></div>
    </div>
    <div class="section">
      <div class="section-title">Detail Waste</div>
      <table>
        <thead><tr><th>No</th><th>Nama Bahan</th><th>Alasan</th><th>Jumlah</th><th>Satuan</th><th>Nilai (Rp)</th></tr></thead>
        <tbody>${rows}<tr class="highlight"><td colspan="5"><b>TOTAL</b></td><td style="text-align:right"><b>${fmt(d.summary.totalWaste)}</b></td></tr></tbody>
      </table>
    </div>`);
}

function tplHPP(d) {
  const rows = d.rows.map((r, i) => `
    <tr>
      <td>${r.name}</td><td>${r.unit}</td>
      <td style="text-align:right">${r.stokAwal||0}</td><td style="text-align:right">${r.pembelian||0}</td>
      <td style="text-align:right">${r.stokAkhir||0}</td><td style="text-align:right;font-weight:700">${r.terpakai}</td>
      <td style="text-align:right">${fmt(r.hargaSatuan)}</td>
      <td style="text-align:right;font-weight:700">${fmt(r.totalHPP)}</td>
    </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:#94a3b8">Belum ada data transaksi</td></tr>';
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Perhitungan HPP</div>
      <table>
        <thead><tr><th>Nama Bahan</th><th>Satuan</th><th>Stok Awal</th><th>Pembelian</th><th>Stok Akhir</th><th>Terpakai</th><th>Harga/Satuan</th><th>Total HPP</th></tr></thead>
        <tbody>${rows}<tr class="highlight"><td colspan="7"><b>TOTAL HPP</b></td><td style="text-align:right"><b>${fmt(d.summary.totalHPP)}</b></td></tr></tbody>
      </table>
    </div>
    <div class="section">
      <div class="summary-box">
        <div class="summary-row"><span>Total Penjualan Netto</span><span>${fmt(d.summary.totalRevenue)}</span></div>
        <div class="summary-row"><span>Total HPP</span><span>${fmt(d.summary.totalHPP)}</span></div>
        <div class="summary-row total"><span>Food Cost Percentage</span><span style="color:${d.summary.foodCostPct>35?'#dc2626':'#16a34a'}">${d.summary.foodCostPct}%</span></div>
      </div>
    </div>`);
}

function tplLabaRugi(d) {
  return buildHTML(d.meta, d.title, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="section">
        <div class="section-title">Pendapatan & HPP</div>
        <div class="summary-box">
          <div class="summary-row"><span>Penjualan Netto</span><span>${fmt(d.pendapatan.penjualanNetto)}</span></div>
          <div class="summary-row"><span>HPP (Bahan Terpakai)</span><span style="color:#dc2626">(${fmt(d.hpp)})</span></div>
          <div class="summary-row total"><span>LABA KOTOR</span><span style="color:#16a34a">${fmt(d.labaKotor)}</span></div>
        </div>
        <br/>
        <div class="section-title">Pengadaan & Belanja</div>
        <div class="summary-box" style="background:#f0f9ff;border-color:#bae6fd">
          <div class="summary-row"><span>Total Belanja Stok</span><span style="color:#dc2626">(${fmt(d.totalPurchasing)})</span></div>
          <div class="summary-row"><span>Hutang Supplier (Berjalan)</span><span style="color:#dc2626">${fmt(d.totalDebt)}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Biaya Operasional & Loss</div>
        <div class="summary-box">
          <div class="summary-row"><span>Gaji Karyawan</span><span>${fmt(d.opEx.gaji)}</span></div>
          <div class="summary-row"><span>Sewa & Utilitas</span><span>${fmt(d.opEx.sewa + d.opEx.utilitas)}</span></div>
          <div class="summary-row"><span>Lain-lain</span><span>${fmt(d.opEx.lainnya)}</span></div>
          <div class="summary-row total"><span>TOTAL BIAYA OPERASIONAL</span><span style="color:#dc2626">(${fmt(d.totalOpEx)})</span></div>
        </div>
        <br/>
        <div class="summary-box" style="background:#fff7ed;border-color:#fed7aa">
          <div class="summary-row"><span>Waste / Loss Barang</span><span style="color:#dc2626">(${fmt(d.waste)})</span></div>
        </div>
      </div>
    </div>
    <div class="laba-bersih">
      <div class="label">LABA BERSIH ESTIMASI</div>
      <div class="value">${fmt(d.labaBersih)}</div>
      <div class="label">Margin Bersih ${d.marginPct}%</div>
    </div>`);
}

function tplOwnerDashboard(d) {
  const best = d.bestSellers.map((p, i) => `
    <tr><td>${i+1}</td><td>${p.icon} ${p.name}</td><td style="text-align:center">${p.qty}</td><td style="text-align:right">${fmt(p.revenue)}</td>
    <td>${i===0?'<span class="badge badge-yellow">⭐ Best Seller</span>':''}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Belum ada data</td></tr>';
  return buildHTML(d.meta, d.title, `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Penjualan Netto</div><div class="kpi-value">${fmt(d.kpi.totalRevenue)}</div><div class="kpi-sub">${d.kpi.totalTrx} transaksi</div></div>
      <div class="kpi-card"><div class="kpi-label">HPP</div><div class="kpi-value" style="color:#dc2626">${fmt(d.kpi.totalHPP)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Waste</div><div class="kpi-value" style="color:#f59e0b">${fmt(d.kpi.totalWaste)}</div></div>
      <div class="kpi-card" style="background:#f0fdf4;border-color:#bbf7d0"><div class="kpi-label">Laba Kotor</div><div class="kpi-value" style="color:#16a34a">${fmt(d.kpi.labaKotor)}</div><div class="kpi-sub">Margin ${d.kpi.marginPct}%</div></div>
    </div>
    <div class="section">
      <div class="section-title">Best Seller (Top 5)</div>
      <table>
        <thead><tr><th>No</th><th>Menu</th><th>Qty Terjual</th><th>Pendapatan</th><th>Ket</th></tr></thead>
        <tbody>${best}</tbody>
      </table>
    </div>`);
}

function tplStokOpname(d) {
  const rows = d.items.map((b, i) => `
    <tr>
      <td>${i+1}</td><td>${b.name}</td><td>${b.unit}</td>
      <td style="text-align:right">${b.sistem}</td>
      <td style="text-align:right">${b.fisik}</td>
      <td style="text-align:right;color:${b.selisih<0?'#dc2626':b.selisih>0?'#16a34a':'#64748b'};font-weight:700">${b.selisih>0?'+':''}${b.selisih}</td>
      <td style="text-align:right">${b.selisihPct}%</td>
    </tr>`).join('');
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Perbandingan Stok Sistem vs Fisik</div>
      <table>
        <thead><tr><th>No</th><th>Nama Bahan</th><th>Satuan</th><th>Sistem</th><th>Fisik</th><th>Selisih</th><th>% Selisih</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="section">
      <div class="summary-box">
        <div class="summary-row"><span>Total Item</span><span>${d.summary.total}</span></div>
        <div class="summary-row"><span>Item Selisih</span><span>${d.summary.itemSelisih}</span></div>
        <div class="summary-row total"><span>Total Selisih Nilai (Rp)</span><span style="color:${d.summary.totalSelisih<0?'#dc2626':'#16a34a'}">${fmt(d.summary.totalSelisih)}</span></div>
      </div>
    </div>`);
}

function tplStockMutation(d) {
  const rows = d.items.map((log, i) => `
    <tr>
      <td>${new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
      <td><b>${log.bahan_name}</b></td>
      <td>${log.type}</td>
      <td style="text-align:right; font-weight:700; color:${log.change_qty < 0 ? '#dc2626' : '#16a34a'}">${log.change_qty > 0 ? '+' : ''}${log.change_qty}</td>
      <td style="text-align:right">${log.prev_stock} → ${log.next_stock}</td>
      <td>${log.user_name}</td>
      <td style="font-style:italic; font-size:9px">${log.reason}</td>
    </tr>`).join('');
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Log Mutasi & Penyesuaian Stok</div>
      <table>
        <thead><tr><th>Waktu</th><th>Nama Bahan</th><th>Tipe</th><th>Perubahan</th><th>Saldo</th><th>Pelaku</th><th>Alasan</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`);
}

function tplActivityLog(d) {
  const rows = d.items.map((log, i) => `
    <tr>
      <td>${new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
      <td><b>${log.user_name}</b> (${log.role})</td>
      <td>${log.activity_type}</td>
      <td>${log.description}</td>
      <td style="font-family:monospace; font-size:9px">${log.ip_address || '127.0.0.1'}</td>
    </tr>`).join('');
  return buildHTML(d.meta, d.title, `
    <div class="section">
      <div class="section-title">Log Aktivitas & Audit Sistem</div>
      <table>
        <thead><tr><th>Waktu</th><th>User</th><th>Aktivitas</th><th>Deskripsi</th><th>Alamat IP</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`);
}


const TEMPLATES = {
  'penjualan-harian': tplPenjualanHarian,
  'penjualan-periode': (d) => buildHTML(d.meta, d.title, `
    <div class="section"><div class="section-title">Ringkasan Penjualan</div>
      <div class="summary-box">
        <div class="summary-row"><span>Total Penjualan Bruto</span><span>${fmt(d.summary.grossSales)}</span></div>
        <div class="summary-row"><span>Total Diskon</span><span>(${fmt(d.summary.discount)})</span></div>
        <div class="summary-row total"><span>Total Penjualan Netto</span><span>${fmt(d.summary.netSales)}</span></div>
        <div class="summary-row"><span>Total Transaksi</span><span>${d.summary.totalTrx}</span></div>
      </div>
    </div>
    <div class="section"><div class="section-title">Penjualan Per Hari</div>
      <table><thead><tr><th>Tanggal</th><th>Penjualan (Rp)</th></tr></thead>
      <tbody>${Object.entries(d.byDay||{}).map(([date,val])=>`<tr><td>${date}</td><td style="text-align:right">${fmt(val)}</td></tr>`).join('') || '<tr><td colspan="2" style="text-align:center;color:#94a3b8">Tidak ada data</td></tr>'}
      </tbody></table>
    </div>`),
  'inventaris': tplInventaris,
  'waste': tplWaste,
  'hpp': tplHPP,
  'laba-rugi': tplLabaRugi,
  'owner-dashboard': tplOwnerDashboard,
  'stok-opname': tplStokOpname,
  'stock-mutation': tplStockMutation,
  'activity-log': tplActivityLog,
};

export async function downloadPDF(type, period, customStart, customEnd, printedBy = 'admin') {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  let qs = `period=${period}`;
  if (period === 'custom') qs += `&customStart=${customStart}&customEnd=${customEnd}`;
  const res = await fetch(`${API_URL}/laporan/report/${type}?${qs}`);
  const data = await res.json();
  data.meta.printedBy = printedBy;
  const tpl = TEMPLATES[type];
  if (!tpl) throw new Error('Template tidak ditemukan');

  // Render HTML ke elemen tersembunyi
  const html = tpl(data);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;';
  container.innerHTML = html;
  // Remove toolbar from the rendered div so it doesn't appear in PDF
  document.body.appendChild(container);
  const toolbar = container.querySelector('.toolbar');
  if (toolbar) toolbar.remove();
  const pageWrap = container.querySelector('.page-wrap') || container.querySelector('.page');

  await new Promise(r => setTimeout(r, 300)); // wait for fonts

  const canvas = await html2canvas(pageWrap || container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 794,
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pdfW) / canvas.width;

  let yPos = 0;
  let remaining = imgH;

  while (remaining > 0) {
    if (yPos > 0) pdf.addPage();
    const srcY = (yPos / imgH) * canvas.height;
    const pageH = Math.min(pdfH, remaining);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, imgH, undefined, 'FAST');
    if (remaining > pdfH) {
      // clip via moving origin
      pdf.setPage(pdf.internal.getNumberOfPages());
    }
    yPos += pdfH;
    remaining -= pdfH;
  }

  const filename = `${type}-${period}-${new Date().toISOString().slice(0,10)}.pdf`;
  pdf.save(filename);
}

// Keep printReport for browser print fallback
export async function printReport(type, period, customStart, customEnd, printedBy = 'admin') {
  let qs = `period=${period}`;
  if (period === 'custom') qs += `&customStart=${customStart}&customEnd=${customEnd}`;
  const res = await fetch(`${API_URL}/laporan/report/${type}?${qs}`);
  const data = await res.json();
  data.meta.printedBy = printedBy;
  const tpl = TEMPLATES[type];
  if (!tpl) return alert('Template laporan tidak ditemukan');
  const html = tpl(data);
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}

export async function downloadCSV(type, period, customStart, customEnd) {
  let qs = `period=${period}`;
  if (period === 'custom') qs += `&customStart=${customStart}&customEnd=${customEnd}`;
  const res = await fetch(`${API_URL}/laporan/report/${type}?${qs}`);
  const data = await res.json();

  let rows = [['Laporan', data.title], ['Periode', data.meta.periodLabel], ['']];

  if (type === 'penjualan-harian') {
    rows.push(['Keterangan', 'Member', 'Guest', 'Total']);
    rows.push(['Total Transaksi', data.summary.memberTrx, data.summary.guestTrx, data.summary.totalTrx]);
    rows.push(['Gross Sales', data.memberSales, data.guestSales, data.summary.grossSales]);
    rows.push(['Net Sales', data.memberSales, data.guestSales, data.summary.netSales]);
    rows.push([''], ['Metode Pembayaran', 'Jumlah']);
    data.byMethod.forEach(m => rows.push([m.name, m.amount]));
  } else if (type === 'inventaris') {
    rows.push(['No', 'Nama Bahan', 'Satuan', 'Stok', 'Min Stok', 'Status']);
    data.items.forEach((b, i) => rows.push([i+1, b.name, b.unit, b.stock, b.minStock, b.status]));
  } else if (type === 'hpp') {
    rows.push(['Nama', 'Satuan', 'Terpakai', 'Harga/Satuan', 'Total HPP']);
    data.rows.forEach(r => rows.push([r.name, r.unit, r.terpakai, r.hargaSatuan, r.totalHPP]));
    rows.push(['', '', '', 'TOTAL HPP', data.summary.totalHPP]);
    rows.push(['', '', '', 'Food Cost %', data.summary.foodCostPct + '%']);
  } else if (type === 'laba-rugi') {
    rows.push(['Keterangan', 'Nilai (Rp)']);
    rows.push(['Total Pendapatan', data.pendapatan.total]);
    rows.push(['HPP', -data.hpp]);
    rows.push(['Laba Kotor', data.labaKotor]);
    rows.push(['Total Biaya Operasional', -data.totalOpEx]);
    rows.push(['Waste/Loss', -data.waste]);
    rows.push(['LABA BERSIH', data.labaBersih]);
  } else if (type === 'stok-opname') {
    rows.push(['No', 'Nama Bahan', 'Satuan', 'Stok Sistem', 'Stok Fisik', 'Selisih', '% Selisih']);
    data.items.forEach((b, i) => rows.push([i+1, b.name, b.unit, b.sistem, b.fisik, b.selisih, b.selisihPct + '%']));
    data.items.forEach((b, i) => rows.push([i+1, b.name, b.unit, b.sistem, b.fisik, b.selisih, b.selisihPct + '%']));
  } else if (type === 'stock-mutation') {
    rows.push(['Waktu', 'Nama Bahan', 'Tipe', 'Perubahan', 'Saldo', 'Pelaku', 'Alasan']);
    data.items.forEach(l => rows.push([l.created_at, l.bahan_name, l.type, l.change_qty, `${l.prev_stock}->${l.next_stock}`, l.user_name, l.reason]));
  } else if (type === 'activity-log') {
    rows.push(['Waktu', 'User', 'Tipe', 'Deskripsi', 'IP Address']);
    data.items.forEach(l => rows.push([l.created_at, l.user_name, l.activity_type, l.description, l.ip_address]));
  } else {
    rows.push(['Data tidak tersedia untuk export CSV tipe ini']);
  }

  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-${period}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
