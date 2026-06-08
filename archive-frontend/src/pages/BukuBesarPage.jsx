import React from 'react';
import { 
  BookOpen, Search, Filter, Download, 
  ArrowUpRight, ArrowDownRight, RefreshCw, 
  Landmark, ShieldCheck, Wallet, ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "@/lib/utils";
import { formatRupiah } from '../utils/formatters';
import { useBukuBesarPage } from '../hooks/useBukuBesarPage';

export default function BukuBesarPage() {
  const {
    loading,
    accounts,
    selectedAccount, setSelectedAccount,
    period, setPeriod,
    search, setSearch,
    ledgerData
  } = useBukuBesarPage();

  const getAccountColor = (category) => {
    switch(category?.toLowerCase()) {
      case 'asset': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'liability': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'equity': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'revenue': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'expense': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Buku Besar</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">Real-time Node</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">General <span className="text-amber-500 italic">Ledger</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Buku besar terperinci (drill-down) per akun sesuai standar akuntansi.</p>
        </div>
        <div className="flex gap-4 p-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
           {[
             { id: 'today', label: 'Today' },
             { id: '7days', label: '7 Days' },
             { id: '30days', label: '30 Days' },
             { id: 'all', label: 'All Time' }
           ].map(p => (
             <button 
               key={p.id}
               className={cn("px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", period === p.id ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}
               onClick={() => setPeriod(p.id)}
             >
               {p.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         
         {/* Sidebar - Accounts List */}
         <div className="xl:col-span-4 space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden flex flex-col h-[700px]">
               <CardHeader className="p-6 border-b border-zinc-100 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <Input 
                      placeholder="Cari akun..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-sm"
                    />
                  </div>
               </CardHeader>
               <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                  {accounts.map(acc => (
                    <div 
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.code)}
                      className={cn(
                        "p-4 rounded-lg border transition-all cursor-pointer group flex items-center justify-between",
                        selectedAccount === acc.code 
                          ? "bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/30 shadow-inner" 
                          : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:border-amber-500/30 hover:shadow-sm"
                      )}
                    >
                      <div>
                        <p className={cn("text-xs font-black font-mono tracking-widest", selectedAccount === acc.code ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400 group-hover:text-amber-500")}>
                          {acc.code}
                        </p>
                        <p className={cn("text-sm font-bold uppercase tracking-tight mt-1", selectedAccount === acc.code ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300")}>
                          {acc.name}
                        </p>
                      </div>
                      <ChevronRight size={16} className={selectedAccount === acc.code ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"} />
                    </div>
                  ))}
               </div>
            </Card>
         </div>

         {/* Main View - Ledger Details */}
         <div className="xl:col-span-8 space-y-6">
            {!selectedAccount || !ledgerData ? (
               <Card className="border-none bg-white dark:bg-zinc-800 shadow-sm rounded-lg flex flex-col items-center justify-center h-[700px]">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Syncing Ledger Node...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-400">
                        <BookOpen size={32} />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Pilih akun untuk melihat mutasi</p>
                    </div>
                  )}
               </Card>
            ) : (
               <Card className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl rounded-lg overflow-hidden flex flex-col h-[700px]">
                  <CardHeader className="p-8 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-row items-start justify-between">
                     <div>
                        <div className="flex items-center gap-3 mb-3">
                           <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", getAccountColor(ledgerData.account.category))}>
                             {ledgerData.account.category}
                           </span>
                           <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-zinc-300 dark:border-zinc-600">
                             Normal: {ledgerData.account.normal_balance}
                           </span>
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white flex items-center gap-4">
                           {ledgerData.account.name} 
                           <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xl">{ledgerData.account.code}</span>
                        </CardTitle>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Ending Balance</p>
                        <p className={cn("text-3xl font-black font-mono tabular-nums leading-none", 
                          ledgerData.ending_balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                           {formatRupiah(ledgerData.ending_balance).replace(',00', '')}
                        </p>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                     <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900 shadow-sm border-b border-zinc-200 dark:border-zinc-700">
                              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                 <th className="px-6 py-4">Tanggal & Referensi</th>
                                 <th className="px-6 py-4">Keterangan</th>
                                 <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Debit (Rp)</th>
                                 <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Kredit (Rp)</th>
                                 <th className="px-6 py-4 text-right">Saldo (Rp)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                              {ledgerData.mutations.map((m, i) => (
                                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors group">
                                   <td className="px-6 py-4">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{new Date(m.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                                      <p className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">{m.journals.reference}</p>
                                   </td>
                                   <td className="px-6 py-4">
                                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate" title={m.journals.description}>
                                        {m.journals.description}
                                      </p>
                                      {m.journals.status !== 'APPROVED' && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[8px] font-black uppercase tracking-widest">
                                          {m.journals.status}
                                        </span>
                                      )}
                                   </td>
                                   <td className="px-6 py-4 text-right text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                                      {m.debit > 0 ? formatRupiah(m.debit).replace('Rp', '').trim() : '-'}
                                   </td>
                                   <td className="px-6 py-4 text-right text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                                      {m.credit > 0 ? formatRupiah(m.credit).replace('Rp', '').trim() : '-'}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <p className={cn("text-xs font-mono font-black tabular-nums", 
                                        m.running_balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                      )}>
                                        {formatRupiah(m.running_balance).replace('Rp', '').trim()}
                                      </p>
                                   </td>
                                </tr>
                              ))}
                              {ledgerData.mutations.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="py-20 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 mb-4 text-zinc-400">
                                      <RefreshCw size={24} />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Tidak ada mutasi di periode ini</p>
                                  </td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </CardContent>
               </Card>
            )}
         </div>
      </div>
    </div>
  );
}
