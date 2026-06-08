import React, { useState } from 'react';
import { 
  Landmark, Plus, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, PiggyBank,
  ShoppingBag, Receipt, DollarSign, Trash2, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { cn } from "../lib/utils";
import { formatRupiah } from '../utils/formatters';

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

const INITIAL_BUDGETS = {
  '6': [ // Juni
    { id: '1', category: 'persediaan', name: 'Pembelian Biji Kopi', limit: 10000000, spent: 4500000 },
    { id: '2', category: 'persediaan', name: 'Matcha Powder Premium', limit: 300000, spent: 280000 },
    { id: '3', category: 'persediaan', name: 'Susu Fresh Milk', limit: 5000000, spent: 1200000 },
    { id: '4', category: 'beban', name: 'Tagihan Listrik Ruko', limit: 2500000, spent: 2450000 },
    { id: '5', category: 'beban', name: 'Gaji Barista & Staff', limit: 15000000, spent: 15000000 },
    { id: '6', category: 'beban', name: 'Internet & Marketing', limit: 1200000, spent: 400000 },
    { id: '7', category: 'hutang', name: 'Supplier Cup Custom', limit: 4000000, spent: 4000000 },
    { id: '8', category: 'hutang', name: 'Cicilan Mesin Espresso', limit: 3000000, spent: 0 }
  ]
};

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState('6');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState(INITIAL_BUDGETS['6'] || []);
  
  // Modal / Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLimit, setNewItemLimit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('persediaan');
  
  // Transaction Simulation State
  const [simulateItemId, setSimulateItemId] = useState(null);
  const [simulateAmount, setSimulateAmount] = useState('');

  // Calculations
  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  const totalLimit = items.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);
  const remaining = totalLimit - totalSpent;
  const overallRatio = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // Add new budget item handler
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemLimit) return;

    const newItem = {
      id: Date.now().toString(),
      category: newItemCategory,
      name: newItemName,
      limit: Number(newItemLimit),
      spent: 0
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemLimit('');
    setShowAddForm(false);
  };

  // Delete budget item
  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Simulate spending transaction
  const handleSimulateSpend = (e) => {
    e.preventDefault();
    if (!simulateAmount || !simulateItemId) return;

    setItems(items.map(item => {
      if (item.id === simulateItemId) {
        return {
          ...item,
          spent: item.spent + Number(simulateAmount)
        };
      }
      return item;
    }));

    setSimulateAmount('');
    setSimulateItemId(null);
  };

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
            Monthly Expense Planning & Leakage Control Panel
          </p>
        </div>

        {/* Date Selector Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setItems(INITIAL_BUDGETS[e.target.value] || []);
            }}
            className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 px-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <Button 
            onClick={() => setShowAddForm(true)}
            className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Anggaran Baru
          </Button>
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Anggaran</p>
              <h3 className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">{formatRupiah(totalLimit)}</h3>
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
              <h3 className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">{formatRupiah(totalSpent)}</h3>
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
              { key: 'all', label: 'Semua Anggaran' },
              { key: 'persediaan', label: 'Persediaan / Stock' },
              { key: 'beban', label: 'Beban Operasional' },
              { key: 'hutang', label: 'Pembayaran Hutang' }
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

        {/* Budget Items Table */}
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Nama Pos Anggaran</th>
                  <th className="px-6 py-4 text-right">Limit Anggaran</th>
                  <th className="px-6 py-4 text-right">Realisasi Pengeluaran</th>
                  <th className="px-6 py-4">Progress Alokasi & Penggunaan</th>
                  <th className="px-6 py-4 text-center">Aksi / Simulasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 mx-auto">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Belum ada alokasi anggaran bulan ini</p>
                    </td>
                  </tr>
                ) : filteredItems.map((item) => {
                  const ratio = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
                  return (
                    <tr key={item.id} className="text-xs font-medium hover:bg-zinc-55/10 dark:hover:bg-zinc-700/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                          item.category === 'persediaan' && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40",
                          item.category === 'beban' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/50",
                          item.category === 'hutang' && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
                        )}>
                          {item.category === 'persediaan' ? 'Persediaan' : item.category === 'beban' ? 'Beban OPEX' : 'Hutang'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">{item.name}</td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-bold">{formatRupiah(item.limit)}</td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-bold">{formatRupiah(item.spent)}</td>
                      
                      {/* Progress Bar Column */}
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase font-mono tabular-nums text-zinc-500">
                            <span>{ratio.toFixed(0)}% Terpakai</span>
                            <span className={cn(
                              ratio > 100 ? "text-rose-600 dark:text-rose-400 font-black" : ratio > 75 ? "text-amber-500" : "text-emerald-500"
                            )}>
                              {ratio > 100 ? 'OVER BUDGET' : formatRupiah(item.limit - item.spent) + ' sisa'}
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

                      {/* Simulation & Action Buttons */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setSimulateItemId(item.id)}
                            className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 text-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <ArrowUpRight size={10} /> Simulasi Belanja
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Anggaran Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 bg-card">
            <CardHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800/80">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Tambah Anggaran Pengeluaran</CardTitle>
              <CardDescription className="text-xs font-medium text-zinc-500">Tentukan batas dana bulanan untuk pos belanja tertentu.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddItem}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pilar Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="persediaan">Persediaan / Stock</option>
                    <option value="beban">Beban Operasional</option>
                    <option value="hutang">Pembayaran Hutang</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Pos Penganggaran</label>
                  <Input
                    required
                    placeholder="Contoh: Pembelian Biji Kopi Arabica"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Limit Anggaran Bulanan (Rp)</label>
                  <Input
                    required
                    type="number"
                    placeholder="Contoh: 10000000"
                    value={newItemLimit}
                    onChange={(e) => setNewItemLimit(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-55/5 dark:bg-zinc-950/10">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowAddForm(false)}
                  className="h-10 px-4 text-xs font-black uppercase tracking-widest text-zinc-500"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="h-10 px-6 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20"
                >
                  Simpan Anggaran
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Simulation Modal Form */}
      {simulateItemId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 bg-card">
            <CardHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800/80">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ArrowUpRight className="text-amber-500 animate-bounce" /> Simulasi Belanja Aktual
              </CardTitle>
              <CardDescription className="text-xs font-medium text-zinc-500">
                Uji langsung bagaimana realisasi belanja otomatis memotong kuota budget:
                <span className="block font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                  {items.find(item => item.id === simulateItemId)?.name}
                </span>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSimulateSpend}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nominal Belanja Aktual (Rp)</label>
                  <Input
                    required
                    type="number"
                    placeholder="Masukkan nominal belanja. Contoh: 300000"
                    value={simulateAmount}
                    onChange={(e) => setSimulateAmount(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-55/5 dark:bg-zinc-950/10">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setSimulateItemId(null)}
                  className="h-10 px-4 text-xs font-black uppercase tracking-widest text-zinc-500"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="h-10 px-6 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20"
                >
                  Simulasikan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
