import React, { useState, useEffect } from 'react';
import { 
  Truck, ArrowRightLeft, Package, 
  MapPin, Clock, CheckCircle2, 
  RefreshCw, Search, Filter, 
  TrendingUp, Box, Layers,
  Zap, BrainCircuit, ShieldCheck,
  ChevronRight, MoreVertical, Timer,
  ArrowUpRight, Landmark, X, FileText, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "@/lib/utils";
import { useLogisticsHubPage } from '../hooks/useLogisticsHubPage';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import StockTransferModal from '../components/StockTransferModal';

const printSuratJalan = (shipment) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  const htmlContent = `
    <html>
      <head>
        <title>Surat Jalan - ${shipment.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #18181b; line-height: 1.5; }
          .header { border-bottom: 2px dashed #18181b; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          .subtitle { font-size: 10px; color: #52525b; margin-top: 5px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; font-size: 12px; }
          .details div { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; font-size: 12px; }
          th, td { border: 1px solid #18181b; padding: 10px; text-align: left; }
          th { background-color: #f4f4f5; text-transform: uppercase; font-weight: bold; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; font-size: 12px; margin-top: 60px; }
          .sig-space { height: 70px; border-bottom: 1px dashed #18181b; margin-bottom: 10px; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; cursor: pointer; background-color: #f59e0b; border: none; color: white; border-radius: 4px;">CETAK SURAT JALAN</button>
        </div>
        <div class="header">
          <div class="title">KEN ENTERPRISE - LOGISTICS SYSTEM</div>
          <div style="font-size: 14px; font-weight: bold; text-transform: uppercase;">SURAT JALAN PENGIRIMAN STOK</div>
          <div class="subtitle">ID TRANSAKSI: ${shipment.id} | STATUS: ${shipment.status.toUpperCase()}</div>
        </div>
        <div class="details">
          <div><strong>Dari Node Asal:</strong> ${shipment.from}</div>
          <div><strong>Ke Node Tujuan:</strong> ${shipment.to}</div>
          <div><strong>Tanggal Kirim:</strong> ${new Date().toLocaleDateString('id-ID')}</div>
          <div><strong>Estimasi Tiba (ETA):</strong> ${shipment.eta}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Deskripsi Item / Bahan Baku</th>
              <th>Qty Kirim</th>
              <th>Qty Terima Fisik</th>
              <th>Kondisi Fisik</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${shipment.material}</td>
              <td>${shipment.qty}</td>
              <td style="width: 150px;"></td>
              <td style="width: 200px;"></td>
            </tr>
          </tbody>
        </table>
        <div style="font-size: 11px; font-style: italic; color: #52525b; margin-top: 20px;">
          * Catatan: Penerima wajib memeriksa kesesuaian jumlah fisik dengan Qty Kirim sebelum menandatangani dokumen ini.
        </div>
        <div class="signatures">
          <div>
            <p>Pengirim (Node Asal)</p>
            <div class="sig-space"></div>
            <p>(______________________)</p>
          </div>
          <div>
            <p>Kurir / Armada</p>
            <div class="sig-space"></div>
            <p>(______________________)</p>
          </div>
          <div>
            <p>Penerima (Node Tujuan)</p>
            <div class="sig-space"></div>
            <p>(______________________)</p>
          </div>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export default function LogisticsHubPage() {
  const navigate = useNavigate();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const {
    loading,
    activeShipments
  } = useLogisticsHubPage();

  const [activeTab, setActiveTab] = useState('operations'); // 'operations' or 'analytics'

  const [shipmentsList, setShipmentsList] = useState([]);
  const [receivingShipment, setReceivingShipment] = useState(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [conditionNote, setConditionNote] = useState('Diterima dalam kondisi baik');
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    if (activeShipments && activeShipments.length > 0) {
      setShipmentsList(activeShipments);
    }
  }, [activeShipments]);

  // Report state and hooks
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mutationClass, setMutationClass] = useState('all');
  const [direction, setDirection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const fetchedLogs = await api.getInventoryLogs({ limit: 1000 });
      const transferLogs = (fetchedLogs || []).filter(l => 
        l.type === 'Transfer In' || l.type === 'Transfer Out'
      );
      setLogs(transferLogs);
    } catch (err) {
      console.error("Gagal mengambil log mutasi:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = log.bahan_name?.toLowerCase().includes(query);
      const matchRef = log.reference_id?.toLowerCase().includes(query);
      const matchNotes = log.notes?.toLowerCase().includes(query);
      if (!matchName && !matchRef && !matchNotes) return false;
    }
    if (direction === 'in' && log.type !== 'Transfer In') return false;
    if (direction === 'out' && log.type !== 'Transfer Out') return false;

    const isInter = log.notes?.includes('[INTER-OUTLET]');
    const isIntra = log.notes?.includes('[INTRA-OUTLET]');
    if (mutationClass === 'inter' && !isInter) return false;
    if (mutationClass === 'intra' && !isIntra) return false;

    if (timeframe !== 'all') {
      const logDate = new Date(log.created_at);
      const today = new Date();
      if (timeframe === 'today') {
        if (logDate.toDateString() !== today.toDateString()) return false;
      } else if (timeframe === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        if (logDate < oneWeekAgo) return false;
      } else if (timeframe === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        if (logDate < oneMonthAgo) return false;
      } else if (timeframe === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }
    }
    return true;
  });

  const handleVerifyReceipt = async (e) => {
    e.preventDefault();
    if (!receivingShipment) return;

    setVerificationLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const originalQtyNum = parseFloat(receivingShipment.qty);
    const receivedQtyNum = parseFloat(receivedQty);
    const diff = originalQtyNum - receivedQtyNum;

    if (diff > 0) {
      alert(`⚠️ Terdeteksi selisih persediaan! Sebanyak ${diff} unit dari item "${receivingShipment.material}" tidak terkirim dan dicatat ke akun Kerugian Penyesuaian.`);
    }

    setShipmentsList(prev => prev.map(s => 
      s.id === receivingShipment.id 
        ? { ...s, status: 'Completed', eta: 'Selesai', qty: `${receivedQtyNum} dari ${receivingShipment.qty}` }
        : s
    ));
    setReceivingShipment(null);
    setVerificationLoading(false);
  };
  
  const logisticsStats = [
    { label: 'Active Shipments', val: `${activeShipments.length} Units`, trend: 'Real-time', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Network Health', val: '98.2%', trend: 'Optimal', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Stock Rebalance', val: 'Active', trend: 'AI Suggestion', icon: Timer, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Efficiency', val: '94%', trend: '+4%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Orchestrating Logistics Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Supply Chain Node</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Live Fleet Tracking</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Internal <span className="text-amber-500 italic">Logistics Hub</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Coordinate stock movement across multi-outlet nodes with real-time tracking.</p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => alert("Menampilkan logistik riwayat...")} variant="outline" className="h-14 px-8 font-black uppercase tracking-widest text-[10px] bg-card border-border rounded-lg">
              <Timer size={18} className="mr-2" /> Shipment Logs
           </Button>
           <Button onClick={() => setShowTransferModal(true)} className="h-14 px-10 font-black uppercase tracking-widest text-white ">
              <ArrowRightLeft size={18} className="mr-2" /> New Transfer
           </Button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={cn(
            "pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative top-[2px]",
            activeTab === 'operations'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          Operasional Pengiriman
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative top-[2px]",
            activeTab === 'analytics'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          Analitik & Fleet Intelligence
        </button>
      </div>

      {activeTab === 'operations' ? (
        <div className="grid grid-cols-1 gap-8">
          {/* Live Shipments */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
             <CardHeader className="p-8 border-b border-border bg-background flex flex-row items-center justify-between">
                <div className="space-y-1">
                   <CardTitle className="text-xl font-black tracking-tighter uppercase leading-none">Fleet Orchestration</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-100 ">Monitor active stock movements between physical nodes</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 border-b border-border">
                            <th className="px-12 py-6">Shipment ID</th>
                            <th className="px-12 py-6">Material Node</th>
                            <th className="px-12 py-6">Transit Path</th>
                            <th className="px-12 py-6 text-right">Status & Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                         {shipmentsList.map((s, i) => (
                           <tr key={i} className="hover:bg-background transition-all group">
                              <td className="px-12 py-8">
                                 <p className="text-sm font-black font-mono tabular-nums text-amber-500">{s.id}</p>
                                 <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">Internal Transfer</p>
                              </td>
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border group-hover:">
                                       <Package size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-foreground uppercase tracking-tight">{s.material}</p>
                                       <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">{s.qty}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-zinc-500 dark:text-zinc-100">{s.from}</span>
                                    <ArrowRightLeft size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{s.to}</span>
                                 </div>
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <div className="flex items-center justify-end gap-6">
                                    <div className="text-right">
                                       <p className={cn("text-[10px] font-black uppercase tracking-widest", s.status === 'In Transit' ? "text-amber-500" : s.status === 'Completed' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-100")}>{s.status}</p>
                                       <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase">ETA: {s.eta}</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-lg shrink-0", s.status === 'In Transit' ? "bg-amber-500 animate-pulse" : s.status === 'Completed' ? "bg-emerald-500" : "bg-background")} />
                                    
                                    <div className="flex items-center gap-2">
                                       {s.status === 'In Transit' && (
                                         <Button 
                                           size="sm" 
                                           variant="primary" 
                                           className="h-8 px-3 text-[9px] font-black uppercase tracking-wider text-white"
                                           onClick={() => {
                                             setReceivingShipment(s);
                                             setReceivedQty(parseFloat(s.qty) || '');
                                           }}
                                         >
                                           Terima
                                         </Button>
                                       )}
                                       <Button 
                                         size="sm" 
                                         variant="outline" 
                                         className="h-8 px-3 text-[9px] font-black uppercase tracking-wider bg-card hover:bg-background border-border text-foreground hover:text-amber-500 flex items-center gap-1"
                                         onClick={() => printSuratJalan(s)}
                                       >
                                         <FileText size={10} /> SJ
                                       </Button>
                                    </div>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
              </CardContent>
           </Card>

           {/* Laporan Mutasi Section */}
           <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden mt-6">
              <CardHeader className="p-8 border-b border-border bg-background flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tighter uppercase leading-none">Laporan Mutasi & Pergerakan Stok</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Audit trail mutasi keluar/masuk antar outlet dan gudang
                    </CardDescription>
                 </div>
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     onClick={() => {
                       const printContent = document.getElementById('print-mutation-report').innerHTML;
                       const printWindow = window.open('', '_blank', 'width=1000,height=800');
                       printWindow.document.write(`
                         <html>
                           <head>
                             <title>Laporan Mutasi Stok</title>
                             <style>
                               body { font-family: monospace; padding: 20px; font-size: 12px; }
                               table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                               th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                               th { background-color: #f5f5f5; }
                             </style>
                           </head>
                           <body>
                             <h2>LAPORAN MUTASI & PERGERAKAN STOK</h2>
                             <p>Dicetak pada: ${new Date().toLocaleString()}</p>
                             ${printContent}
                           </body>
                         </html>
                       `);
                       printWindow.document.close();
                     }}
                     className="h-10 px-4 font-black uppercase tracking-wider text-[10px] bg-card border-border text-foreground hover:bg-background"
                   >
                     Print Laporan
                   </Button>
                   <Button 
                     variant="outline" 
                     onClick={fetchLogs}
                     className="h-10 w-10 flex items-center justify-center bg-card border-border text-foreground hover:bg-background"
                     title="Refresh Data"
                   >
                     <RefreshCw size={16} className={cn(logsLoading && "animate-spin")} />
                   </Button>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 {/* Filters Bar */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-background p-4 rounded-lg border border-border">
                    {/* Search */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pencarian</label>
                       <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                          <Input 
                             type="text" 
                             placeholder="Cari bahan / ID..." 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="h-10 pl-9 pr-3 bg-card border-border rounded-md text-xs font-bold"
                          />
                       </div>
                    </div>
 
                    {/* Timeframe */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rentang Waktu</label>
                       <select 
                          value={timeframe} 
                          onChange={(e) => setTimeframe(e.target.value)}
                          className="w-full h-10 px-3 bg-card border border-border rounded-md text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                       >
                          <option value="all">Semua Waktu</option>
                          <option value="today">Hari Ini</option>
                          <option value="week">7 Hari Terakhir</option>
                          <option value="month">30 Hari Terakhir</option>
                          <option value="custom">Custom Tanggal</option>
                       </select>
                    </div>
 
                    {/* Class */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Jenis Mutasi</label>
                       <select 
                          value={mutationClass} 
                          onChange={(e) => setMutationClass(e.target.value)}
                          className="w-full h-10 px-3 bg-card border border-border rounded-md text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                       >
                          <option value="all">Semua Jenis</option>
                          <option value="inter">Inter Outlet (Antar Cabang)</option>
                          <option value="intra">Intra Outlet (Internal)</option>
                       </select>
                    </div>
 
                    {/* Direction */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Arah Stok</label>
                       <select 
                          value={direction} 
                          onChange={(e) => setDirection(e.target.value)}
                          className="w-full h-10 px-3 bg-card border border-border rounded-md text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                       >
                          <option value="all">Semua Arah</option>
                          <option value="in">Mutasi Masuk (Inbound)</option>
                          <option value="out">Mutasi Keluar (Outbound)</option>
                       </select>
                    </div>
 
                    {/* Custom Date Inputs */}
                    {timeframe === 'custom' && (
                       <div className="lg:col-span-4 grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-border">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Tanggal Mulai</label>
                             <Input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 bg-card border-border rounded-md text-xs font-bold"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Tanggal Selesai</label>
                             <Input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 bg-card border-border rounded-md text-xs font-bold"
                             />
                          </div>
                       </div>
                    )}
                 </div>
 
                 {/* Table */}
                 <div className="overflow-x-auto" id="print-mutation-report">
                    {logsLoading ? (
                       <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Loading Mutation Audit Trail...</span>
                       </div>
                    ) : filteredLogs.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-12 text-zinc-400 border border-dashed border-border rounded-lg bg-background">
                          <AlertCircle className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tidak ada riwayat mutasi yang cocok.</span>
                       </div>
                    ) : (
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-background text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-border">
                                <th className="px-4 py-4">ID / Ref</th>
                                <th className="px-4 py-4">Waktu</th>
                                <th className="px-4 py-4">Bahan Baku</th>
                                <th className="px-4 py-4">Alur Transit</th>
                                <th className="px-4 py-4">Jenis</th>
                                <th className="px-4 py-4">Arah</th>
                                <th className="px-4 py-4 text-right">Qty</th>
                                <th className="px-4 py-4 text-right">Saldo Stok</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-xs">
                             {filteredLogs.map((log, i) => {
                                const isInter = log.notes?.includes('[INTER-OUTLET]');
                                const cleanNotes = log.notes ? log.notes.replace('[INTER-OUTLET] ', '').replace('[INTRA-OUTLET] ', '') : '-';
                                return (
                                  <tr key={i} className="hover:bg-background transition-all">
                                     <td className="px-4 py-4 font-mono font-bold tabular-nums text-amber-500">{log.reference_id}</td>
                                     <td className="px-4 py-4 text-zinc-500 font-mono tabular-nums">{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                     <td className="px-4 py-4 font-bold text-foreground uppercase tracking-tight">{log.bahan_name}</td>
                                     <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400 uppercase font-black text-[9px] tracking-tight">{cleanNotes}</td>
                                     <td className="px-4 py-4">
                                        <span className={cn(
                                          "px-2 py-0.5 text-[8px] font-black uppercase rounded",
                                          isInter 
                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800" 
                                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                        )}>
                                           {isInter ? 'Inter Outlet' : 'Intra Outlet'}
                                        </span>
                                     </td>
                                     <td className="px-4 py-4">
                                        <span className={cn(
                                          "px-2 py-0.5 text-[8px] font-black uppercase rounded",
                                          log.type === 'Transfer In' 
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                        )}>
                                           {log.type === 'Transfer In' ? 'Masuk' : 'Keluar'}
                                        </span>
                                     </td>
                                     <td className="px-4 py-4 text-right font-mono font-bold tabular-nums text-foreground">
                                        {log.change_qty > 0 ? `+${log.change_qty}` : log.change_qty} {log.unit || ''}
                                     </td>
                                     <td className="px-4 py-4 text-right font-mono text-zinc-400 tabular-nums">
                                        {log.next_stock} {log.unit || ''}
                                     </td>
                                  </tr>
                                );
                             })}
                          </tbody>
                       </table>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {logisticsStats.map((s, i) => (
              <Card key={i} className="border-none bg-card shadow-sm rounded-lg overflow-hidden">
                <CardContent className="p-8 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                      <p className={cn("text-2xl font-black font-mono tabular-nums leading-none my-1", s.color)}>{s.val}</p>
                      <div className="flex items-center gap-1.5">
                         <ArrowUpRight size={12} className={cn(s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500")} />
                         <span className={cn("text-[10px] font-black uppercase", s.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500")}>{s.trend}</span>
                      </div>
                   </div>
                   <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border", s.bg)}>
                      <s.icon size={24} className={cn(s.color)} />
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
             {/* Left Column */}
             <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none bg-card shadow-xl p-8 rounded-lg overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-8 text-zinc-300 dark:text-zinc-700 opacity-20 group-hover:scale-110 transition-transform duration-1000">
                      <BrainCircuit size={120} />
                   </div>
                   <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Logistics Insight</div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Route <span className="text-amber-500 italic">Optimization</span></h4>
                      <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                         Sistem mendeteksi kemacetan tinggi di rute Sudirman-Menteng. Neural model menyarankan pengiriman stok dijadwalkan sebelum pukul 08:00 WIB untuk efisiensi bahan bakar 15%.
                      </p>
                   </div>
                   <Button onClick={() => alert("Menjalankan optimasi jadwal rute pengiriman...")} className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-border rounded-lg mt-6">OPTIMIZE SCHEDULE</Button>
                </Card>
                <Card className="border-none bg-card shadow-xl p-8 rounded-lg overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-8 text-zinc-300 dark:text-zinc-700 opacity-20 group-hover:rotate-12 transition-transform duration-1000">
                      <Truck size={120} />
                   </div>
                   <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Fleet Intelligence</div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Driver <span className="italic underline">Performance</span></h4>
                      <p className="text-zinc-900 dark:text-zinc-100 text-xs font-bold leading-relaxed uppercase">
                         Rata-rata waktu bongkar muat di PIK Hub meningkat. Sistem menyarankan peninjauan SOP penerimaan barang untuk mempercepat rotasi armada.
                      </p>
                   </div>
                   <Button onClick={() => alert("Membuka laporan kinerja armada logistik...")} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 rounded-lg mt-6">VIEW FLEET REPORT</Button>
                </Card>
             </div>

             {/* Right Column (Sidebar Maps/Status) */}
             <div className="xl:col-span-4 space-y-6">
                <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
                   <CardHeader className="p-8 border-b border-border bg-background">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                            <MapPin size={20} className="text-foreground" />
                         </div>
                         <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Node Proximity</CardTitle>
                            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Fleet Distribution</CardDescription>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-8">
                      <div className="aspect-square bg-background rounded-lg border border-dashed border-border flex flex-col items-center justify-center p-10 text-center relative overflow-hidden group cursor-crosshair">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--amber-500)_0%,transparent_70%)] group-hover:transition-opacity opacity-10" />
                         <MapPin size={48} className="text-amber-500 mb-4 animate-bounce relative z-10" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 relative z-10">Interactive Fleet Map</p>
                         <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-100/60 uppercase mt-2 relative z-10">Connecting 5 Active Nodes</p>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none bg-card shadow-xl p-8 rounded-lg overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
                   <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center">
                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Supply Balance</p>
                         <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Auto <span className="text-amber-500 italic">Balancing</span></h3>
                      <div className="space-y-4 pt-4">
                         {[
                           { label: 'Sudirman WH', val: 85, color: 'bg-emerald-500' },
                           { label: 'PIK Hub', val: 45, color: 'bg-amber-500' },
                           { label: 'Menteng Edge', val: 65, color: 'bg-blue-500' },
                         ].map(n => (
                           <div key={n.label} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-zinc-500">{n.label}</span>
                                 <span>{n.val}%</span>
                              </div>
                              <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                 <div className={cn("h-full rounded-lg transition-all duration-1000", n.color)} style={{ width: `${n.val}%` }} />
                              </div>
                           </div>
                         ))}
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 leading-relaxed pt-4 border-t border-border uppercase">
                         Sistem menyarankan penyeimbangan stok biji kopi dari Sudirman ke PIK dalam 24 jam ke depan.
                      </p>
                   </div>
                </Card>
             </div>
          </div>
        </div>
      )}

      <StockTransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />

      {/* Verification / Receipt Modal */}
      {receivingShipment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <CardHeader className="bg-background border-b border-border flex flex-row items-center justify-between p-5">
              <div className="space-y-0.5">
                <CardTitle className="text-lg font-black uppercase tracking-tighter">Verifikasi Mutasi Masuk</CardTitle>
                <CardDescription className="uppercase font-black tracking-[0.2em] text-[9px] text-amber-500">
                  Transaksi: {receivingShipment.id}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background" onClick={() => setReceivingShipment(null)}>
                <X size={18} />
              </Button>
            </CardHeader>

            <form onSubmit={handleVerifyReceipt}>
              <CardContent className="p-5 space-y-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-md space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rincian Pengiriman</p>
                  <p className="text-xs font-bold text-foreground">Bahan: <span className="uppercase text-amber-500">{receivingShipment.material}</span></p>
                  <p className="text-xs font-bold text-foreground">Dikirim dari: <span className="uppercase">{receivingShipment.from}</span></p>
                  <p className="text-xs font-bold text-foreground">Kuantitas Dikirim: <span className="font-mono tabular-nums text-amber-500">{receivingShipment.qty}</span></p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Kuantitas Diterima Fisik</label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="h-11 bg-background border-border rounded-md font-black font-mono tabular-nums px-4 text-sm"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                  />
                  <span className="text-[8px] text-zinc-400 italic block ml-1">* Sesuaikan jika ada barang rusak/hilang selama pengiriman.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Catatan Kondisi Barang</label>
                  <Input 
                    required
                    className="h-11 bg-background border-border rounded-md font-bold px-4 text-xs"
                    value={conditionNote}
                    onChange={(e) => setConditionNote(e.target.value)}
                  />
                </div>
              </CardContent>

              <CardFooter className="bg-background p-4 border-t border-border flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 h-11 font-black uppercase tracking-widest text-[9px] rounded-md" onClick={() => setReceivingShipment(null)}>
                  Batal
                </Button>
                <Button variant="primary" type="submit" className="flex-1 h-11 font-black uppercase tracking-widest text-[9px] rounded-md text-white dark:text-zinc-900" disabled={verificationLoading}>
                  {verificationLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Selesaikan Penerimaan'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
