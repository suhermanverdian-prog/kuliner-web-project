import React from 'react';
import { 
  FileStack, Database, Settings, 
  Play, Download, Trash2, 
  Plus, Check, ChevronRight, 
  BarChart3, PieChart, LineChart, 
  Calendar, Layers, Filter, 
  ArrowUpRight, Info, Save, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { useReportBuilderPage } from '../hooks/useReportBuilderPage';

const DATA_NODES = [
  { id: 'sales', label: 'Sales & Transactions', icon: BarChart3, color: 'text-amber-500' },
  { id: 'inventory', label: 'Inventory & COGS', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'customers', label: 'Customer Behavior', icon: Database, color: 'text-blue-500' },
  { id: 'accounting', label: 'General Ledger', icon: FileStack, color: 'text-purple-500' },
];

const METRICS = {
  sales: ['Gross Revenue', 'Net Profit', 'Average Ticket', 'Tax Collected', 'Discount Impact'],
  inventory: ['Stock Value', 'Waste Rate', 'HPP (COGS)', 'Low Stock Alerts'],
  customers: ['New Members', 'Visits Count', 'Avg Lifetime Value', 'Churn Rate'],
  accounting: ['Total Expenses', 'Petty Cash Flow', 'Operational Margin'],
};

export default function ReportBuilderPage() {
  const {
    selectedNode, setSelectedNode,
    selectedMetrics, setSelectedMetrics,
    period, setPeriod,
    loading, setLoading,
    generated, setGenerated,
    toggleMetric,
    generateReport
  } = useReportBuilderPage();

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500 font-mono tabular-nums">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber- border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Enterprise Beta</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Report Engine v1.2</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">FlexReport <span className="text-amber-500 italic">Builder</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Custom multi-node data aggregation & export engine.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 px-6 font-black uppercase tracking-widest text-[9px] rounded-lg border-border bg-card" onClick={() => {
             setSelectedNode(null);
             setSelectedMetrics([]);
             setGenerated(false);
           }}>
              <Trash2 size={16} className="mr-2" /> RESET BUILDER
           </Button>
           <Button 
             className="h-12 px-10 font-black uppercase tracking-widest text-white "
             disabled={!selectedNode || selectedMetrics.length === 0 || loading}
             onClick={generateReport}
           >
              {loading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Play size={16} className="mr-2" />}
              COMPILE REPORT
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         {/* Configuration Node */}
         <div className="xl:col-span-8 space-y-8">
            {/* Step 1: Data Source */}
            <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
               <CardHeader className="p-10 bg-background border-b border-border">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 ">01</div>
                     <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Select Data Node</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">The primary source for your custom report</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {DATA_NODES.map(node => (
                        <button 
                          key={node.id}
                          onClick={() => {
                            setSelectedNode(node.id);
                            setSelectedMetrics([]);
                          }}
                          className={cn(
                            "p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4 text-center group",
                            selectedNode === node.id ? "bg-amber-500 border-amber-500 text-zinc-950 shadow-xl shadow-amber-500/20" : "bg-background border-transparent hover:border-border text-foreground"
                          )}
                        >
                           <div className={cn("p-4 rounded-lg transition-colors", selectedNode === node.id ? "bg-zinc-950 text-amber-500" : "bg-card text-zinc-500 dark:text-zinc-100")}>
                              <node.icon size={24} />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest">{node.label}</p>
                        </button>
                     ))}
                  </div>
               </CardContent>
            </Card>

            {/* Step 2: Metrics Selection */}
            <Card className={cn(
              "border-none bg-card shadow-xl rounded-lg overflow-hidden transition-all duration-500",
              !selectedNode && " grayscale pointer-events-none"
            )}>
               <CardHeader className="p-10 bg-background border-b border-border">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 ">02</div>
                     <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Aggregate Metrics</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Select specific data points to include in the compile</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-10">
                  {selectedNode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {METRICS[selectedNode].map(m => (
                         <button 
                           key={m}
                           onClick={() => toggleMetric(m)}
                           className={cn(
                             "p-4 rounded-lg border transition-all flex items-center justify-between text-left group",
                             selectedMetrics.includes(m) ? "bg-amber- border-amber-500 text-amber-600 dark:text-amber-500" : "bg-background border-border text-foreground  hover:"
                           )}
                         >
                            <span className="text-xs font-black uppercase tracking-widest">{m}</span>
                            {selectedMetrics.includes(m) ? <Check size={16} /> : <Plus size={16} className="" />}
                         </button>
                       ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center ">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Please select a data node first</p>
                    </div>
                  )}
               </CardContent>
            </Card>

            {/* Step 3: Global Filters */}
            <Card className={cn(
              "border-none bg-card shadow-xl rounded-lg overflow-hidden transition-all duration-500",
              selectedMetrics.length === 0 && " grayscale pointer-events-none"
            )}>
               <CardHeader className="p-10 bg-background border-b border-border">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 ">03</div>
                     <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Temporal Filtering</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Define the time-series scope for data collection</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-10">
                  <div className="flex flex-wrap gap-4">
                     {['Daily Pulse', 'Weekly Rollup', 'Monthly Consolidated', 'Annual Ledger'].map(p => (
                       <button 
                         key={p}
                         onClick={() => setPeriod(p.toLowerCase())}
                         className={cn(
                           "px-8 h-14 rounded-lg border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                           period === p.toLowerCase() ? "bg-zinc-950 text-zinc-900 dark:text-zinc-100 dark:bg-amber-500 dark:text-zinc-950 border-transparent shadow-xl" : "bg-background border-transparent text-zinc-500 dark:text-zinc-100 hover:border-border"
                         )}
                       >
                          {p}
                       </button>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Preview & Status */}
         <div className="xl:col-span-4 space-y-8 sticky top-24">
            <Card className="border-none ">
               <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Build Preview</p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">COMPILER <span className="text-amber-500">STATUS</span></h3>
                  </div>
                  <Settings className="animate-spin-slow text-zinc-800" size={32} />
               </CardHeader>
               <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-2">
                        <span className="text-zinc-500">Node</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{selectedNode || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between items-start text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-2">
                        <span className="text-zinc-500">Metrics</span>
                        <div className="text-right flex flex-col gap-1">
                           {selectedMetrics.length > 0 ? selectedMetrics.map(m => (
                             <span key={m} className="text-amber-500">{m}</span>
                           )) : <span className="text-zinc-800">EMPTY</span>}
                        </div>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-500">Aggregation</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{period}</span>
                     </div>
                  </div>

                  {generated ? (
                    <div className="animate-in zoom-in-95 duration-500 space-y-6">
                       <div className="p-6 bg-emerald-500 rounded-lg flex items-center gap-4 text-zinc-950">
                          <Check size={24} strokeWidth={3} />
                          <div>
                             <p className="text-xs font-black uppercase tracking-widest leading-none">Compilation Success</p>
                             <p className="text-[9px] font-black  mt-1 uppercase">Report ready for distribution</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <Button className="h-12 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                             <Download size={16} className="mr-2" /> PDF
                          </Button>
                          <Button className="h-12 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                             <Download size={16} className="mr-2" /> EXCEL
                          </Button>
                       </div>
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center text-center space-y-4 ">
                       <LineChart size={48} className="text-zinc-800" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Awaiting Build Command</p>
                    </div>
                  )}
               </CardContent>
            </Card>

            <div className="p-8 bg-background border border-border rounded-lg space-y-4">
               <div className="flex items-center gap-4">
                  <Info size={18} className="text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Usage Tip</p>
               </div>
               <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-100 leading-relaxed">
                  Laporan kustom ini mendukung integrasi multi-tenant. Anda dapat menggabungkan data dari outlet yang berbeda jika fitur *Multi-Outlet* aktif.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function RefreshCw({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-in spin-in duration-700", className)}
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
