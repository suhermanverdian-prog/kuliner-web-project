import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, Wallet,
  ArrowUpRight, ArrowDownRight, Download, Printer, RefreshCw,
  ChevronDown, ChevronRight, Filter, Plus, CheckCircle2,
  AlertTriangle, FileText, Building2, Scale, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:3001/api' 
  : 'https://kuliner-web-project.vercel.app/api';
const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => n >= 1e9 ? `${(n/1e9).toFixed(1)}M` : n >= 1e6 ? `${(n/1e6).toFixed(1)}jt` : n >= 1e3 ? `${(n/1e3).toFixed(0)}rb` : String(Math.round(n||0));

const PERIODS = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'year',  label: 'Tahun Ini' },
];

const TABS = [
  { key: 'summary',  label: 'Ringkasan Keuangan', icon: TrendingUp },
  { key: 'ledger',   label: 'Buku Besar (Jurnal)', icon: BookOpen },
  { key: 'coa',      label: 'Chart of Accounts',  icon: Scale },
];

const COA_COLORS = {
  'Aset': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Liabilitas': 'bg-red-500/10 text-red-600 border-red-500/20',
  'Ekuitas': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Pendapatan': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Beban': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

function KPICard({ label, value, sub, icon: Icon, color, trend, trendVal }) {
  return (
    <Card className="border-none shadow-lg bg-card overflow-hidden group hover:shadow-xl transition-all">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
            <h3 className="text-xl font-black tracking-tight truncate">{value}</h3>
            {sub && <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>}
          </div>
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 ml-3', color)}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
        {trendVal !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black', trendVal >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive')}>
              {trendVal >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trendVal).toFixed(1)}%
            </div>
            <span className="text-[9px] text-muted-foreground font-bold">margin</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JournalRow({ journal, expanded, onToggle }) {
  const totalDebit = journal.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) || journal.totalDebit || 0;
  return (
    <>
      <tr className={cn('hover:bg-muted/20 transition-colors cursor-pointer group', expanded && 'bg-accent/5')} onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors', expanded ? 'bg-accent text-white' : 'bg-muted text-muted-foreground')}>
              <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-[10px] text-muted-foreground font-mono">{new Date(journal.date).toLocaleDateString('id-ID')}</td>
        <td className="px-4 py-3 text-xs font-black text-accent">{journal.reference}</td>
        <td className="px-4 py-3 text-xs font-medium text-foreground max-w-xs truncate">{journal.description}</td>
        <td className="px-4 py-3 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-3 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit ml-auto">
            <CheckCircle2 size={10} />
            <span className="text-[9px] font-black uppercase">Balance</span>
          </div>
        </td>
      </tr>
      {expanded && journal.lines?.map((l, i) => (
        <tr key={i} className="bg-accent/5 border-l-2 border-accent/30">
          <td className="px-4 py-2" />
          <td className="px-4 py-2 text-[10px] text-muted-foreground font-mono pl-8">{l.accountCode}</td>
          <td className="px-4 py-2 text-[10px] text-muted-foreground" colSpan={2}>{l.accountName}</td>
          <td className="px-4 py-2 text-[10px] font-black text-right text-primary">{l.debit > 0 ? fmt(l.debit) : '—'}</td>
          <td className="px-4 py-2 text-[10px] font-black text-right text-primary">{l.credit > 0 ? fmt(l.credit) : '—'}</td>
          <td />
        </tr>
      ))}
    </>
  );
}

function AddExpenseModal({ onClose, onSave, loading, accounts }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'Beban Operasional', paymentMethod: 'Tunai', date: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-none rounded-3xl">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl flex items-center gap-2"><CreditCard className="text-accent" /> Catat Pengeluaran Baru</CardTitle>
          <CardDescription>Input biaya operasional (listrik, gaji, sewa, dll)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Deskripsi Biaya</label>
            <input className="w-full h-12 bg-muted/20 border-none rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-accent" placeholder="Contoh: Bayar Listrik Bulan Mei" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jumlah (Rp)</label>
                <input type="number" className="w-full h-12 bg-muted/20 border-none rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-accent" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Metode Pembayaran</label>
                <select className="w-full h-12 bg-muted/20 border-none rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-accent" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                  <option>Tunai</option>
                  <option>BCA</option>
                  <option>Mandiri</option>
                </select>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kategori Akun</label>
            <select className="w-full h-12 bg-muted/20 border-none rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-accent" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="Beban Operasional">Beban Operasional Umum</option>
              <option value="Beban Gaji">Beban Gaji Pegawai</option>
              <option value="Beban Listrik & Air">Beban Listrik & Air</option>
              <option value="Beban Sewa">Beban Sewa Tempat</option>
              <option value="Beban Lainnya">Beban Lain-lain</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-muted/5 gap-3">
           <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>Batal</Button>
           <Button className="flex-[2] font-black bg-accent hover:bg-accent/90" onClick={() => onSave(form)} disabled={loading || !form.description || !form.amount}>
             {loading ? 'Menyimpan...' : 'SIMPAN PENGELUARAN'}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AkunPage({ user }) {
  const [tab, setTab] = useState('summary');
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournal, setExpandedJournal] = useState(null);
  const [search, setSearch] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);

  const getHeaders = useCallback(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return { 'Content-Type': 'application/json', 'x-user-role': u.role || 'guest', 'x-tenant-id': u.tenant?.id || '' };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, jRes, coaRes] = await Promise.all([
        fetch(`${API}/accounting/summary?period=${period}`, { headers: getHeaders() }),
        fetch(`${API}/journals`, { headers: getHeaders() }),
        fetch(`${API}/accounts`, { headers: getHeaders() }),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (jRes.ok) { const d = await jRes.json(); setJournals(Array.isArray(d) ? d : []); }
      if (coaRes.ok) { const d = await coaRes.json(); setAccounts(Array.isArray(d) ? d : []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period, getHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = () => {
    const content = document.getElementById('akun-print-area');
    if (!content) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Laporan Keuangan - KEN ERP</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:6px;text-align:left;} th{background:#6366f1;color:white;} .pos{color:#16a34a;} .neg{color:#dc2626;}</style>
    </head><body>${content.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  const handleExcelExport = () => {
    window.location.href = `${API}/accounting/export/excel?period=${period}`;
  };

  const is = summary?.incomeStatement || {};
  const bs = summary?.balanceSheet || {};
  const cf = summary?.cashFlow || {};
  const grossMargin = is.revenue > 0 ? ((is.grossProfit / is.revenue) * 100) : 0;
  const netMargin   = is.revenue > 0 ? ((is.netProfit  / is.revenue) * 100) : 0;

  const filteredJournals = journals.filter(j =>
    j.reference?.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center"><BookOpen className="text-white" size={20} /></div>
            Modul Akuntansi
          </h2>
          <p className="text-muted-foreground mt-1">Double-entry bookkeeping · Laporan Keuangan · Buku Besar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted/30 p-1 rounded-2xl border gap-1">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn('px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  period === p.key ? 'bg-accent text-white shadow' : 'text-muted-foreground hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleExcelExport}>
            <Download size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handlePrint}>
            <Printer size={14} /> Print
          </Button>
          <Button size="sm" className="gap-2 h-9 bg-accent hover:bg-accent/90" onClick={() => setShowExpenseModal(true)}>
            <Plus size={14} /> Tambah Biaya
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-2xl border w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                tab === t.key ? 'bg-background shadow text-accent' : 'text-muted-foreground hover:text-foreground')}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ====== TAB: SUMMARY ====== */}
          {tab === 'summary' && (
            <div id="akun-print-area" className="space-y-8">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Pendapatan" value={fmtShort(is.revenue)} sub="Penjualan bersih" icon={TrendingUp} color="bg-emerald-600" trendVal={grossMargin} />
                <KPICard label="Laba Kotor" value={fmtShort(is.grossProfit)} sub={`Margin ${grossMargin.toFixed(1)}%`} icon={DollarSign} color="bg-accent" />
                <KPICard label="Laba Bersih" value={fmtShort(is.netProfit)} sub={`Net ${netMargin.toFixed(1)}%`} icon={Wallet} color={is.netProfit >= 0 ? 'bg-blue-600' : 'bg-destructive'} trendVal={netMargin} />
                <KPICard label="Hutang Supplier" value={fmtShort(bs.liabilities?.hutangDagang)} sub={`${summary?.unpaidInvoices || 0} invoice belum lunas`} icon={CreditCard} color="bg-amber-500" />
              </div>

              {/* Laba Rugi + Neraca side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Statement */}
                <Card className="border-none shadow-xl bg-card">
                  <CardHeader className="border-b bg-muted/10 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-accent" /> Laporan Laba Rugi</CardTitle>
                    <CardDescription>Income Statement · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {[
                      { label: 'Pendapatan Penjualan', val: is.revenue, style: 'font-black text-primary text-base' },
                      { label: '(-) Harga Pokok Penjualan', val: is.hpp, style: 'text-destructive', minus: true },
                      { label: 'LABA KOTOR', val: is.grossProfit, style: 'font-black border-t pt-2' },
                      { label: '(-) Biaya Operasional', val: is.opex, style: 'text-destructive', minus: true },
                      { label: '(-) Waste & Susut', val: is.waste, style: 'text-destructive', minus: true },
                      { label: 'LABA BERSIH', val: is.netProfit, style: is.netProfit >= 0 ? 'font-black text-emerald-600 border-t-2 border-emerald-500/30 pt-2 text-base' : 'font-black text-destructive border-t-2 pt-2 text-base' },
                    ].map((row, i) => (
                      <div key={i} className={cn('flex justify-between items-center py-1', row.style)}>
                        <span className="text-sm">{row.label}</span>
                        <span className="text-sm tabular-nums">{fmt(row.val)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Balance Sheet */}
                <Card className="border-none shadow-xl bg-card">
                  <CardHeader className="border-b bg-muted/10 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Scale size={18} className="text-accent" /> Neraca (Balance Sheet)</CardTitle>
                    <CardDescription>Posisi Keuangan · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">ASET</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Kas & Bank</span><span className="font-black">{fmt(bs.assets?.kas)}</span></div>
                        <div className="flex justify-between text-sm"><span>Persediaan Bahan Baku</span><span className="font-black">{fmt(bs.assets?.persediaan)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL ASET</span><span className="text-accent">{fmt(bs.assets?.total)}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">LIABILITAS</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Hutang Dagang</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangDagang)}</span></div>
                        <div className="flex justify-between text-sm"><span>Hutang Pajak</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangPajak)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL LIABILITAS</span><span className="text-destructive">{fmt(bs.liabilities?.total)}</span></div>
                      </div>
                    </div>
                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-2xl flex justify-between font-black">
                      <span>EKUITAS (Aset - Liabilitas)</span>
                      <span className="text-accent">{fmt((bs.assets?.total || 0) - (bs.liabilities?.total || 0))}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow */}
              <Card className="border-none shadow-xl bg-card">
                <CardHeader className="border-b bg-muted/10 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Wallet size={18} className="text-accent" /> Arus Kas (Cash Flow)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Kas Masuk (Penjualan)', val: cf.operasional, color: 'text-emerald-600' },
                      { label: 'Kas Keluar (Pembelian/HPP)', val: cf.pembelian, color: 'text-destructive' },
                      { label: 'Net Cash Flow', val: cf.net, color: cf.net >= 0 ? 'text-accent font-black' : 'text-destructive font-black' },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-4 bg-muted/20 rounded-2xl border">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                        <p className={cn('text-2xl font-black', item.color)}>{fmt(item.val)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ====== TAB: LEDGER ====== */}
          {tab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <input
                  className="h-10 flex-1 max-w-sm rounded-xl border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Cari referensi atau deskripsi jurnal..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <p className="text-[10px] font-black text-muted-foreground uppercase">{filteredJournals.length} entri jurnal</p>
              </div>

              <Card className="border-none shadow-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b">
                        <th className="px-4 py-3 w-8" />
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-left">Referensi</th>
                        <th className="px-4 py-3 text-left">Deskripsi</th>
                        <th className="px-4 py-3 text-right">Debit</th>
                        <th className="px-4 py-3 text-right">Kredit</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {filteredJournals.length === 0 ? (
                        <tr><td colSpan={7} className="py-20 text-center text-muted-foreground text-sm">Belum ada entri jurnal untuk periode ini. Lakukan transaksi penjualan atau penerimaan barang untuk membuat jurnal otomatis.</td></tr>
                      ) : filteredJournals.map(j => (
                        <JournalRow key={j.id} journal={j} expanded={expandedJournal === j.id} onToggle={() => setExpandedJournal(expandedJournal === j.id ? null : j.id)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ====== TAB: COA ====== */}
          {tab === 'coa' && (
            <div className="space-y-4">
              <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Chart of Accounts</CardTitle>
                      <CardDescription>Daftar akun standar yang digunakan dalam sistem pembukuan</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b">
                        <th className="px-6 py-3 text-left">Kode</th>
                        <th className="px-6 py-3 text-left">Nama Akun</th>
                        <th className="px-6 py-3 text-left">Kategori</th>
                        <th className="px-6 py-3 text-left">Saldo Normal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {accounts.map((acc, i) => (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs font-black text-accent">{acc.code}</td>
                          <td className="px-6 py-3 text-sm font-bold">{acc.name}</td>
                          <td className="px-6 py-3">
                            <span className={cn('px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest', COA_COLORS[acc.category] || 'bg-muted/40 text-muted-foreground')}>
                              {acc.category}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs font-bold text-muted-foreground capitalize">{acc.normalBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
      {showExpenseModal && (
        <AddExpenseModal 
          onClose={() => setShowExpenseModal(false)} 
          loading={savingExpense}
          accounts={accounts}
          onSave={async (formData) => {
            setSavingExpense(true);
            try {
              const res = await fetch(`${API}/expenses`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({...formData, amount: Number(formData.amount), userName: user?.name})
              });
              if (!res.ok) throw new Error('Gagal simpan');
              setShowExpenseModal(false);
              loadData();
            } catch (err) { alert(err.message); }
            finally { setSavingExpense(false); }
          }}
        />
      )}
    </div>
  );
}
