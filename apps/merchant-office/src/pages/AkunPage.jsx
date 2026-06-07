import React, { useState } from 'react';
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, Wallet,
  ArrowUpRight, ArrowDownRight, Download, Printer, RefreshCw,
  ChevronDown, ChevronRight, Filter, Plus, CheckCircle2,
  AlertTriangle, FileText, Building2, Scale, CreditCard,
  Target, Save, Trash2, BarChart3, CalendarDays
} from 'lucide-react';
import { useBudgetPage } from '../hooks/useBudgetPage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/utils';
import { useAkunPage } from '../hooks/useAkunPage';


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
  { key: 'budget',   label: 'Anggaran',           icon: Target },
];

const COA_COLORS = {
  'Aset': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Kewajiban': 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'Ekuitas': 'bg-amber-500/10 text-primary border-zinc-800/20',
  'Pendapatan': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Beban': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-500/20',
};

function KPICard({ label, value, sub, icon: Icon, color, trend, trendVal }) {
  return (
    <Card className="border-none shadow-lg bg-card overflow-hidden group hover:shadow-xl transition-all font-mono tabular-nums">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{label}</p>
            <h3 className="text-xl font-black tracking-tight truncate">{value}</h3>
            {sub && <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-medium">{sub}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center shadow-md shrink-0 ml-4', color)}>
            <Icon size={22} className="text-zinc-900 dark:text-zinc-100" />
          </div>
        </div>
        {trendVal !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black', trendVal >= 0 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-destructive/10 text-destructive')}>
              {trendVal >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trendVal).toFixed(1)}%
            </div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-100 font-bold">margin</span>
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
      <tr className={cn('hover:bg-background transition-colors cursor-pointer group', expanded && 'bg-amber-50 dark:bg-amber-950/30')} onClick={onToggle}>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded flex items-center justify-center transition-colors', expanded ? 'bg-amber-500 dark:bg-amber-400 text-zinc-900 dark:text-zinc-100' : 'bg-background text-zinc-500 dark:text-zinc-100')}>
              <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-[10px] text-zinc-500 dark:text-zinc-100 font-mono">{new Date(journal.date).toLocaleDateString('id-ID')}</td>
        <td className="px-4 py-4 text-xs font-black text-amber-600 dark:text-amber-400">{journal.reference}</td>
        <td className="px-4 py-4 text-xs font-medium text-foreground max-w-xs truncate">{journal.description}</td>
        <td className="px-4 py-4 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-4 text-xs font-black text-right">{fmt(totalDebit)}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg w-fit ml-auto">
            <CheckCircle2 size={10} />
            <span className="text-[9px] font-black uppercase">Balance</span>
          </div>
        </td>
      </tr>
      {expanded && journal.lines?.map((l, i) => (
        <tr key={i} className="bg-amber-50 dark:bg-amber-950/30 border-l-2 border-accent/30">
          <td className="px-4 py-2" />
          <td className="px-4 py-2 text-[10px] text-zinc-500 dark:text-zinc-100 font-mono pl-8">{l.accountCode}</td>
          <td className="px-4 py-2 text-[10px] text-zinc-500 dark:text-zinc-100" colSpan={2}>{l.accountName}</td>
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
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-none rounded-lg">
        <CardHeader className="border-b bg-background">
          <CardTitle className="text-xl flex items-center gap-2"><CreditCard className="text-amber-600 dark:text-amber-400" /> Catat Pengeluaran Baru</CardTitle>
          <CardDescription>Input biaya operasional (listrik, gaji, sewa, dll)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Deskripsi Biaya</label>
            <Input placeholder="Contoh: Bayar Listrik Bulan Mei" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Jumlah (Rp)</label>
                <Input type="number" className="font-mono tabular-nums" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Metode Pembayaran</label>
                <Select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                  <option>Tunai</option>
                  <option>BCA</option>
                  <option>Mandiri</option>
                </Select>
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Kategori Akun</label>
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="Beban Operasional">Beban Operasional Umum</option>
              <option value="Beban Gaji">Beban Gaji Pegawai</option>
              <option value="Beban Listrik & Air">Beban Listrik & Air</option>
              <option value="Beban Sewa">Beban Sewa Tempat</option>
              <option value="Beban Lainnya">Beban Lain-lain</option>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-background gap-4">
           <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>Batal</Button>
           <Button variant="primary" className="flex-[2] font-black" onClick={() => onSave(form)} disabled={loading || !form.description || !form.amount}>
             {loading ? 'Menyimpan...' : 'SIMPAN PENGELUARAN'}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function AddTopupModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ description: '', amount: '', source: 'Modal', date: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-none rounded-lg">
        <CardHeader className="border-b bg-background">
          <CardTitle className="text-xl flex items-center gap-2"><Wallet className="text-emerald-600 dark:text-emerald-400" /> Pengisian Saldo Kas Kecil / Top-up</CardTitle>
          <CardDescription>Menambah saldo Kas Tunai toko dari sumber dana eksternal</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Deskripsi Pengisian</label>
            <Input placeholder="Contoh: Setoran Modal Awal Kas Kecil Toko" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Jumlah Top-up (Rp)</label>
                <Input type="number" className="font-mono tabular-nums" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-100 tracking-widest">Sumber Dana</label>
                <Select value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                  <option value="Modal">Modal Pemilik (Owner Equity)</option>
                  <option value="Bank">Transfer dari Rekening Bank Toko</option>
                </Select>
             </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t bg-background gap-4">
           <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>Batal</Button>
           <button 
             type="button" 
             className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-900 shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-xs font-black uppercase rounded-md flex items-center justify-center disabled:opacity-50"
             onClick={() => onSave(form)} 
             disabled={loading || !form.description || !form.amount}
           >
             {loading ? 'Menyimpan...' : 'SIMPAN TOP-UP KAS'}
           </button>
        </CardFooter>
      </Card>
    </div>
  );
}

const fmtBudget = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

function BudgetStatusBadge({ status, percent }) {
  const config = {
    under_budget: { label: 'Under Budget', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    on_budget: { label: 'On Track', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    over_budget: { label: 'Over Budget', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  };
  const c = config[status] || config.on_budget;
  return (
    <span className={cn('px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border', c.cls)}>
      {c.label} ({percent}%)
    </span>
  );
}

function VarianceProgressBar({ percent, status }) {
  const clampedPercent = Math.min(percent, 150);
  const barWidth = Math.min((clampedPercent / 100) * 100, 100);
  const barColor = status === 'over_budget'
    ? 'bg-rose-500 dark:bg-rose-400'
    : status === 'under_budget'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : 'bg-amber-500 dark:bg-amber-400';

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-md h-2 overflow-hidden">
      <div
        className={cn('h-full rounded-md transition-all duration-500', barColor)}
        style={{ width: `${barWidth}%` }}
      />
    </div>
  );
}

export default function AkunPage({ user }) {
  const {
    tab, setTab,
    period, setPeriod,
    summary,
    accounts,
    loading,
    expandedJournal, setExpandedJournal,
    search, setSearch,
    showExpenseModal, setShowExpenseModal,
    savingExpense,
    showTopupModal, setShowTopupModal,
    savingTopup,
    handleSaveTopup,
    loadData,
    handlePrint,
    handleExcelExport,
    handleSaveExpense,
    is, bs, cf,
    grossMargin, netMargin,
    filteredJournals
  } = useAkunPage({ user });

  const budgetHook = useBudgetPage({ accounts });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-4">
            <div className="w-10 h-10 "><BookOpen className="text-zinc-900 dark:text-zinc-100" size={20} /></div>
            Modul Akuntansi
          </h2>
          <p className="text-zinc-500 dark:text-zinc-100 mt-1">Double-entry bookkeeping · Laporan Keuangan · Buku Besar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-background p-1 rounded-lg border gap-1">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn('px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  period === p.key ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 shadow' : 'text-zinc-500 dark:text-zinc-100 hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExcelExport}>
            <Download size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handlePrint}>
            <Printer size={14} /> Print
          </Button>
          <Button variant="primary" size="sm" className="gap-2 h-8" onClick={() => setShowExpenseModal(true)}>
            <Plus size={14} /> Tambah Biaya
          </Button>
          <button 
            type="button"
            className="flex items-center gap-2 px-4 h-8 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-900 shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-xs font-black uppercase rounded-md" 
            onClick={() => setShowTopupModal(true)}
          >
            <Plus size={14} /> Top-up Kas
          </button>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-lg border w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-2 px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                tab === t.key ? 'bg-background shadow text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-100 hover:text-foreground')}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-amber-500 dark:border-amber-400 border-t-transparent rounded-lg animate-spin" />
        </div>
      ) : (
        <>
          {/* ====== TAB: SUMMARY ====== */}
          {tab === 'summary' && (
            <div id="akun-print-area" className="space-y-8">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Pendapatan" value={fmtShort(is.revenue)} sub="Penjualan bersih" icon={TrendingUp} color="bg-amber-500 dark:bg-amber-400" trendVal={grossMargin} />
                <KPICard label="Laba Kotor" value={fmtShort(is.grossProfit)} sub={`Margin ${grossMargin.toFixed(1)}%`} icon={DollarSign} color="bg-amber-500 dark:bg-amber-400" />
                <KPICard label="Laba Bersih" value={fmtShort(is.netProfit)} sub={`Net ${netMargin.toFixed(1)}%`} icon={Wallet} color={is.netProfit >= 0 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-destructive'} trendVal={netMargin} />
                <KPICard label="Hutang Supplier" value={fmtShort(bs.liabilities?.hutangDagang)} sub={`${summary?.unpaidInvoices || 0} invoice belum lunas`} icon={CreditCard} color="bg-amber-500" />
              </div>

              {/* Laba Rugi + Neraca side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Statement */}
                <Card className="border-none shadow-xl bg-card">
                  <CardHeader className="border-b bg-background pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-amber-600 dark:text-amber-400" /> Laporan Laba Rugi</CardTitle>
                    <CardDescription>Income Statement · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {[
                      { label: 'Pendapatan Penjualan', val: is.revenue, style: 'font-black text-primary text-base' },
                      { label: '(-) Harga Pokok Penjualan', val: is.hpp, style: 'text-destructive', minus: true },
                      { label: 'LABA KOTOR', val: is.grossProfit, style: 'font-black border-t pt-2' },
                      { label: '(-) Biaya Operasional', val: is.opex, style: 'text-destructive', minus: true },
                      { label: '(-) Waste & Susut', val: is.waste, style: 'text-destructive', minus: true },
                      { label: 'LABA BERSIH', val: is.netProfit, style: is.netProfit >= 0 ? 'font-black text-amber-600 dark:text-amber-400 border-t-2 border-accent/30 pt-2 text-base' : 'font-black text-destructive border-t-2 pt-2 text-base' },
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
                  <CardHeader className="border-b bg-background pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Scale size={18} className="text-amber-600 dark:text-amber-400" /> Neraca (Balance Sheet)</CardTitle>
                    <CardDescription>Posisi Keuangan · {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">ASET</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Kas & Bank</span><span className="font-black">{fmt(bs.assets?.kas)}</span></div>
                        <div className="flex justify-between text-sm"><span>Persediaan Bahan Baku</span><span className="font-black">{fmt(bs.assets?.persediaan)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL ASET</span><span className="text-amber-600 dark:text-amber-400">{fmt(bs.assets?.total)}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">LIABILITAS</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Hutang Dagang</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangDagang)}</span></div>
                        <div className="flex justify-between text-sm"><span>Hutang Pajak</span><span className="font-black text-destructive">{fmt(bs.liabilities?.hutangPajak)}</span></div>
                        <div className="flex justify-between font-black border-t pt-2"><span>TOTAL LIABILITAS</span><span className="text-destructive">{fmt(bs.liabilities?.total)}</span></div>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg flex justify-between font-black">
                      <span>EKUITAS (Aset - Liabilitas)</span>
                      <span className="text-amber-600 dark:text-amber-400">{fmt((bs.assets?.total || 0) - (bs.liabilities?.total || 0))}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow */}
              <Card className="border-none shadow-xl bg-card">
                <CardHeader className="border-b bg-background pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Wallet size={18} className="text-amber-600 dark:text-amber-400" /> Arus Kas (Cash Flow)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Kas Masuk (Penjualan)', val: cf.operasional, color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Kas Keluar (Pembelian/HPP)', val: cf.pembelian, color: 'text-destructive' },
                      { label: 'Net Cash Flow', val: cf.net, color: cf.net >= 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-destructive font-black' },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-4 bg-background rounded-lg border">
                        <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest mb-2">{item.label}</p>
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
              <div className="flex gap-4 items-center">
                <Input
                  className="flex-1 max-w-sm"
                  placeholder="Cari referensi atau deskripsi jurnal..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tabular-nums">{filteredJournals.length} entri jurnal</p>
              </div>

              <Card className="border-none shadow-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 border-b">
                        <th className="px-4 py-4 w-8" />
                        <th className="px-4 py-4 text-left">Tanggal</th>
                        <th className="px-4 py-4 text-left">Referensi</th>
                        <th className="px-4 py-4 text-left">Deskripsi</th>
                        <th className="px-4 py-4 text-right">Debit</th>
                        <th className="px-4 py-4 text-right">Kredit</th>
                        <th className="px-4 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {filteredJournals.length === 0 ? (
                        <tr><td colSpan={7} className="py-20 text-center text-zinc-500 dark:text-zinc-100 text-sm">Belum ada entri jurnal untuk periode ini. Lakukan transaksi penjualan atau penerimaan barang untuk membuat jurnal otomatis.</td></tr>
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
                <CardHeader className="border-b bg-background">
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
                      <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 border-b">
                        <th className="px-6 py-4 text-left">Kode</th>
                        <th className="px-6 py-4 text-left">Nama Akun</th>
                        <th className="px-6 py-4 text-left">Kategori</th>
                        <th className="px-6 py-4 text-left">Saldo Normal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {accounts.map((acc, i) => (
                        <tr key={i} className="hover:bg-background transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-black text-amber-600 dark:text-amber-400">{acc.code}</td>
                          <td className="px-6 py-4 text-sm font-bold">{acc.name}</td>
                          <td className="px-6 py-4">
                            <span className={cn('px-4 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest', COA_COLORS[acc.category] || 'bg-background text-zinc-500 dark:text-zinc-100')}>
                              {acc.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-100 capitalize">{acc.normalBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ====== TAB: BUDGET ====== */}
          {tab === 'budget' && (
            <div className="space-y-6">
              {/* Period Selector + Sub-view Toggle */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-background p-1 rounded-lg border">
                    <button
                      onClick={() => budgetHook.setSubView('input')}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                        budgetHook.subView === 'input'
                          ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 shadow'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100')}
                    >
                      <CalendarDays size={14} /> Input Anggaran
                    </button>
                    <button
                      onClick={() => budgetHook.setSubView('variance')}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                        budgetHook.subView === 'variance'
                          ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 shadow'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100')}
                    >
                      <BarChart3 size={14} /> Laporan Varians
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={budgetHook.selectedMonth}
                    onChange={e => budgetHook.setSelectedMonth(Number(e.target.value))}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500/20"
                  >
                    {budgetHook.MONTH_NAMES.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={budgetHook.selectedYear}
                    onChange={e => budgetHook.setSelectedYear(Number(e.target.value))}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-4 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500/20"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {budgetHook.loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-10 h-10 border-4 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* === SUB-VIEW: INPUT ANGGARAN === */}
                  {budgetHook.subView === 'input' && (
                    <Card className="border-none shadow-xl bg-card overflow-hidden">
                      <CardHeader className="border-b bg-background">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Target size={18} className="text-amber-600 dark:text-amber-400" />
                              Input Anggaran — {budgetHook.MONTH_NAMES[budgetHook.selectedMonth - 1]} {budgetHook.selectedYear}
                            </CardTitle>
                            <CardDescription>Tentukan batas anggaran untuk setiap akun beban dan aset</CardDescription>
                          </div>
                          <button
                            onClick={budgetHook.handleSaveAll}
                            disabled={budgetHook.saving}
                            className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 active:scale-95 transition-all text-xs font-black uppercase rounded-md disabled:opacity-50"
                          >
                            <Save size={14} />
                            {budgetHook.saving ? 'Menyimpan...' : 'Simpan Semua'}
                          </button>
                        </div>
                      </CardHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b">
                              <th className="px-6 py-4 text-left">Kode</th>
                              <th className="px-6 py-4 text-left">Nama Akun</th>
                              <th className="px-6 py-4 text-left">Kategori</th>
                              <th className="px-6 py-4 text-right w-48">Anggaran (Rp)</th>
                              <th className="px-6 py-4 text-left">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {budgetHook.budgetableAccounts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                                  Tidak ada akun Beban/Aset ditemukan. Pastikan Chart of Accounts sudah diisi.
                                </td>
                              </tr>
                            ) : budgetHook.budgetableAccounts.map(acc => {
                              const edit = budgetHook.editedBudgets[acc.id] || { amount: '', notes: '' };
                              return (
                                <tr key={acc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                                  <td className="px-6 py-4 font-mono text-xs font-black text-amber-600 dark:text-amber-400">{acc.code}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">{acc.name}</td>
                                  <td className="px-6 py-4">
                                    <span className={cn('px-2 py-1 rounded-md text-[9px] font-black border uppercase tracking-widest', COA_COLORS[acc.category] || 'bg-background text-zinc-500 dark:text-zinc-400')}>
                                      {acc.category}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <input
                                      type="number"
                                      min="0"
                                      step="10000"
                                      value={edit.amount || ''}
                                      onChange={e => budgetHook.updateBudgetField(acc.id, 'amount', e.target.value)}
                                      placeholder="0"
                                      className="w-full text-right font-mono tabular-nums text-sm font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 focus:border-amber-500 dark:focus:border-amber-400 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={edit.notes || ''}
                                      onChange={e => budgetHook.updateBudgetField(acc.id, 'notes', e.target.value)}
                                      placeholder="Catatan opsional..."
                                      className="w-full text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 focus:border-amber-500 dark:focus:border-amber-400 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* === SUB-VIEW: LAPORAN VARIANS === */}
                  {budgetHook.subView === 'variance' && (
                    <div className="space-y-6">
                      {/* Totals Summary Cards */}
                      {budgetHook.variance?.totals && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card className="border-none shadow-lg bg-card">
                            <CardContent className="p-6">
                              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Anggaran</p>
                              <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-1">{fmtBudget(budgetHook.variance.totals.total_budget)}</p>
                            </CardContent>
                          </Card>
                          <Card className="border-none shadow-lg bg-card">
                            <CardContent className="p-6">
                              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Aktual</p>
                              <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-1">{fmtBudget(budgetHook.variance.totals.total_actual)}</p>
                            </CardContent>
                          </Card>
                          <Card className="border-none shadow-lg bg-card">
                            <CardContent className="p-6">
                              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Selisih (Varians)</p>
                              <p className={cn('text-xl font-black font-mono tabular-nums mt-1',
                                budgetHook.variance.totals.total_variance >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              )}>
                                {budgetHook.variance.totals.total_variance >= 0 ? '+' : ''}{fmtBudget(budgetHook.variance.totals.total_variance)}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-none shadow-lg bg-card">
                            <CardContent className="p-6">
                              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Pemakaian</p>
                              <p className={cn('text-xl font-black font-mono tabular-nums mt-1',
                                budgetHook.variance.totals.total_percent_used > 100
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              )}>
                                {budgetHook.variance.totals.total_percent_used}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Variance Table */}
                      <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="border-b bg-background">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 size={18} className="text-amber-600 dark:text-amber-400" />
                            Laporan Varians — {budgetHook.MONTH_NAMES[budgetHook.selectedMonth - 1]} {budgetHook.selectedYear}
                          </CardTitle>
                          <CardDescription>Perbandingan anggaran vs pengeluaran aktual dari jurnal</CardDescription>
                        </CardHeader>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-background text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b">
                                <th className="px-6 py-4 text-left">Kode</th>
                                <th className="px-6 py-4 text-left">Nama Akun</th>
                                <th className="px-6 py-4 text-right">Anggaran</th>
                                <th className="px-6 py-4 text-right">Aktual</th>
                                <th className="px-6 py-4 text-right">Selisih</th>
                                <th className="px-6 py-4 text-center w-48">Progress</th>
                                <th className="px-6 py-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {(!budgetHook.variance?.items || budgetHook.variance.items.length === 0) ? (
                                <tr>
                                  <td colSpan={7} className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                                    Belum ada anggaran untuk periode ini. Silakan isi anggaran di tab "Input Anggaran" terlebih dahulu.
                                  </td>
                                </tr>
                              ) : budgetHook.variance.items.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                                  <td className="px-6 py-4 font-mono text-xs font-black text-amber-600 dark:text-amber-400">{item.account_code}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.account_name}</td>
                                  <td className="px-6 py-4 text-right font-mono tabular-nums text-sm font-bold text-zinc-900 dark:text-zinc-100">{fmtBudget(item.budget_amount)}</td>
                                  <td className="px-6 py-4 text-right font-mono tabular-nums text-sm font-bold text-zinc-900 dark:text-zinc-100">{fmtBudget(item.actual_amount)}</td>
                                  <td className={cn('px-6 py-4 text-right font-mono tabular-nums text-sm font-black',
                                    item.variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  )}>
                                    {item.variance >= 0 ? '+' : ''}{fmtBudget(item.variance)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <VarianceProgressBar percent={item.percent_used} status={item.status} />
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <BudgetStatusBadge status={item.status} percent={item.percent_used} />
                                  </td>
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
            </div>
          )}
        </>
      )}
      {showExpenseModal && (
        <AddExpenseModal 
          onClose={() => setShowExpenseModal(false)} 
          loading={savingExpense}
          accounts={accounts}
          onSave={handleSaveExpense}
        />
      )}
      {showTopupModal && (
        <AddTopupModal 
          onClose={() => setShowTopupModal(false)} 
          loading={savingTopup}
          onSave={handleSaveTopup}
        />
      )}
    </div>
  );
}
