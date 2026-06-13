import React, { useState, useEffect } from 'react';
import { 
  Landmark, Plus, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, PiggyBank,
  ShoppingBag, Receipt, DollarSign, Trash2, ArrowUpRight, Save, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { cn } from "../lib/utils";
import { formatRupiah } from '../utils/formatters';
import { useBudgetPage } from '../hooks/useBudgetPage';
import api from '../api';

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

export default function BudgetPage() {
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Load COA accounts for budgeting mapping
  useEffect(() => {
    api.request(`${api.url}/accounting/accounts`, 'GET')
      .then(res => setAccounts(res || []))
      .catch(err => console.error("Failed to fetch accounts:", err));
  }, []);

  const {
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    budgets, setBudgets,
    variance, setVariance,
    loading,
    saving,
    subView, setSubView,
    editedBudgets, setEditedBudgets,
    budgetableAccounts,
    updateBudgetField,
    handleSaveAll,
    handleDeleteBudget,
    loadBudgets,
    loadVariance,
    MONTH_NAMES
  } = useBudgetPage({ accounts });

  // Calculations
  const getCategoryFromAccount = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (['beban', 'expense'].includes(cat)) return 'beban';
    if (['aset', 'asset', 'persediaan'].includes(cat)) return 'persediaan';
    if (['kewajiban', 'liability', 'hutang'].includes(cat)) return 'hutang';
    return 'beban';
  };

  // Variance calculations
  const totals = variance?.totals || { total_budget: 0, total_actual: 0, total_variance: 0, total_percent_used: 0 };
  const items = variance?.items || [];
  const remaining = totals.total_budget - totals.total_actual;
  const overallRatio = totals.total_percent_used;

  // Filter items in Variance view
  const filteredVarianceItems = activeTab === 'all' 
    ? items 
    : items.filter(item => {
        // Map account category to UI tab categories
        const acc = accounts.find(a => a.id === item.account_id || a.code === item.account_code);
        const mappedCat = getCategoryFromAccount(acc?.category || 'beban');
        return mappedCat === activeTab;
      });

  // Filter items in Input view
  const filteredInputAccounts = activeTab === 'all'
    ? budgetableAccounts
    : budgetableAccounts.filter(acc => getCategoryFromAccount(acc.category) === activeTab);

  return (
    <div className="space-y-6 pb-20 min-h-screen w-full max-w-full overflow-x-hidden px-1">
      {/* Header - Enterprise Grade */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-10 bg-amber-500 rounded-sm" />
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase italic leading-none">
              Budget & Realization
            </h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] leading-loose">
            Monthly Expense Planning & Leakage Control Panel (Supabase Connected)
          </p>
        </div>

        {/* Date Selector & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setSubView('variance')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                subView === 'variance'
                  ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              Realisasi & Variance
            </button>
            <button
              onClick={() => setSubView('input')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                subView === 'input'
                  ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              Atur Limit Anggaran
            </button>
          </div>

          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          {subView === 'input' && (
            <Button 
              disabled={saving}
              onClick={handleSaveAll}
              className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Anggaran'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Anggaran</p>
              <h3 className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">{formatRupiah(totals.total_budget)}</h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-md flex items-center justify-center border border-amber-200/50 dark:border-amber-800/30">
              <PiggyBank size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Realisasi Aktual</p>
              <h3 className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">{formatRupiah(totals.total_actual)}</h3>
            </div>
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-700/50">
              <ShoppingBag size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Sisa Kuota Anggaran</p>
              <h3 className={cn(
                "text-xl font-mono font-black tabular-nums",
                remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {formatRupiah(remaining)}
              </h3>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center border",
              remaining >= 0 
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200/50 dark:border-emerald-800/30" 
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200/50 dark:border-rose-800/30"
            )}>
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Utilization Gauge */}
        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Rasio Terpakai</p>
              <h3 className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">{overallRatio.toFixed(1)}%</h3>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  className={cn(
                    "transition-all duration-1000",
                    overallRatio > 90 ? "text-rose-500" : overallRatio > 70 ? "text-amber-500" : "text-emerald-500"
                  )}
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * Math.min(overallRatio, 100)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-zinc-700 dark:text-zinc-300">
                {Math.round(overallRatio)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Grid & Tables */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'Semua Kategori' },
              { key: 'persediaan', label: 'Persediaan / Stock' },
              { key: 'beban', label: 'Beban OPEX' },
              { key: 'hutang', label: 'Pembayaran Hutang / Kewajiban' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeTab === tab.key 
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/10" 
                    : "text-zinc-500 hover:bg-background/80 dark:hover:bg-zinc-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
            Memuat data anggaran dari Supabase...
          </div>
        ) : subView === 'variance' ? (
          /* Variance Report View */
          <Card className="border-none shadow-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Kode Akun</th>
                    <th className="px-6 py-4">Nama Pos Anggaran</th>
                    <th className="px-6 py-4 text-right">Limit Anggaran</th>
                    <th className="px-6 py-4 text-right">Realisasi Aktual</th>
                    <th className="px-6 py-4">Progress Alokasi & Penggunaan</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredVarianceItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 mx-auto">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Belum ada alokasi anggaran bulan ini</p>
                      </td>
                    </tr>
                  ) : filteredVarianceItems.map((item) => {
                    const ratio = item.percent_used;
                    const acc = accounts.find(a => a.id === item.account_id || a.code === item.account_code);
                    const cat = getCategoryFromAccount(acc?.category || 'beban');

                    return (
                      <tr key={item.id} className="text-xs font-medium hover:bg-zinc-55/10 dark:hover:bg-zinc-700/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                            cat === 'persediaan' && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40",
                            cat === 'beban' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/50",
                            cat === 'hutang' && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
                          )}>
                            {cat === 'persediaan' ? 'Persediaan' : cat === 'beban' ? 'Beban OPEX' : 'Hutang'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-zinc-500">{item.account_code}</td>
                        <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{item.account_name}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-bold">{formatRupiah(item.budget_amount)}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-bold">{formatRupiah(item.actual_amount)}</td>
                        
                        {/* Progress Bar Column */}
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black uppercase font-mono tabular-nums text-zinc-500">
                              <span>{ratio.toFixed(0)}% Terpakai</span>
                              <span className={cn(
                                ratio > 100 ? "text-rose-600 dark:text-rose-400 font-black" : ratio > 75 ? "text-amber-500" : "text-emerald-500"
                              )}>
                                {ratio > 100 ? 'OVER BUDGET' : formatRupiah(item.budget_amount - item.actual_amount) + ' sisa'}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded bg-zinc-100 dark:bg-zinc-850 overflow-hidden relative border border-zinc-200 dark:border-zinc-800/60">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  ratio > 100 ? "bg-rose-500" : ratio > 75 ? "bg-amber-500" : "bg-emerald-500"
                                )} 
                                style={{ width: `${Math.min(ratio, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBudget(item.id)}
                            className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Edit/Input View */
          <Card className="border-none shadow-xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Kode Akun</th>
                    <th className="px-6 py-4">Nama Akun</th>
                    <th className="px-6 py-4 text-right" style={{ width: '250px' }}>Batas Limit Anggaran (Rp)</th>
                    <th className="px-6 py-4" style={{ width: '300px' }}>Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredInputAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Tidak ada akun perkiraan untuk dianggarkan</p>
                      </td>
                    </tr>
                  ) : filteredInputAccounts.map((acc) => {
                    const edit = editedBudgets[acc.id] || { amount: '', notes: '' };
                    const cat = getCategoryFromAccount(acc.category);

                    return (
                      <tr key={acc.id} className="text-xs font-medium hover:bg-zinc-55/10 dark:hover:bg-zinc-700/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                            cat === 'persediaan' && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40",
                            cat === 'beban' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/50",
                            cat === 'hutang' && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
                          )}>
                            {cat === 'persediaan' ? 'Persediaan' : cat === 'beban' ? 'Beban OPEX' : 'Hutang'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-zinc-500">{acc.code}</td>
                        <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{acc.name}</td>
                        <td className="px-6 py-4 text-right">
                          <Input
                            type="number"
                            placeholder="Limit Anggaran"
                            value={edit.amount}
                            onChange={(e) => updateBudgetField(acc.id, 'amount', e.target.value)}
                            className="text-right font-mono font-bold"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            placeholder="Catatan..."
                            value={edit.notes}
                            onChange={(e) => updateBudgetField(acc.id, 'notes', e.target.value)}
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
      </div>
    </div>
  );
}
