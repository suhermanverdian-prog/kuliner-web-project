import React from 'react';
import { useProcurement } from '../hooks/useProcurement';
import { 
  ShoppingCart, Plus, Trash2, Truck, Wallet, Boxes, Settings, Loader2, ShieldCheck, Printer, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/Table";
import { cn } from "../lib/utils";
import { api } from '../api';

const formatCurrency = (n) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
}).format(n || 0);

export default function ProcurementPage() {
  const {
    activeTab, setActiveTab,
    bahanList,
    suppliers,
    conversions,
    invoices,
    pendingPOs,
    loading,
    actionLoading,
    selectedSupplier, setSelectedSupplier,
    poItems, setPoItems,
    notes, setNotes,
    showSupplierModal, setShowSupplierModal,
    newSupplier, setNewSupplier,
    receivingPo, setReceivingPo,
    receivingItems, setReceivingItems,
    handlePrintPO,
    addItemToPo,
    updateItem,
    handleAutoReplenish,
    handleSavePO,
    handleReceivePO,
    confirmReceipt,
    handlePayInvoice,
    handleCancelPO,
    handleSaveSupplier,
    handleSimplePurchase,
    cancelConfirmPO, setCancelConfirmPO,
    doConfirmCancel,
    payConfirmInvoice, setPayConfirmInvoice,
    doConfirmPay
  } = useProcurement();
  const [searchInvoiceSupplier, setSearchInvoiceSupplier] = React.useState('');

  // 💡 Dynamic Supplier-Material Mapping & Grouping (STRICT SAFE VERSION)
  const getBahanOptions = () => {
    if (!selectedSupplier) {
      return <option value="">Pilih Supplier Terlebih Dahulu...</option>;
    }

    // Filter ketat: Hanya tampilkan bahan yang netral (tanpa supplier) ATAU yang supplier-nya cocok!
    const eligibleBahan = bahanList.filter(b => 
      !b.supplier || String(b.supplier.id) === String(selectedSupplier)
    );

    return (
      <>
        <option value="">Select Material...</option>
        {eligibleBahan.map(b => (
          <option key={b.id} value={b.id}>
            {b.name} (Stok: {b.stock} {b.unit})
          </option>
        ))}
      </>
    );
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse font-mono tabular-nums">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-100">Auditing Supply Chain...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 animate-in fade-in zoom-in-95 duration-500 max-w-[1600px] mx-auto text-foreground">
      {/* EXECUTIVE COCKPIT HEADER */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-card border border-border p-4 rounded-lg shadow-xl relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ShoppingCart size={28} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Procurement <span className="text-primary">Cockpit</span></h1>
              <span className="px-2 py-0.5 rounded bg-background border border-border text-[8px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">v5.2-Transparent</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-100 font-bold tracking-wide">Enterprise Resource Planning & SCM</p>
          </div>
        </div>
        
        <nav className="flex bg-background p-1.5 rounded-lg border border-border/50 backdrop-blur-md overflow-x-auto no-scrollbar">
          {[
            { id: 'create', label: 'Order', icon: Plus },
            { id: 'grn', label: 'Receive', icon: Truck },
            { id: 'finance', label: 'Payables', icon: Wallet },
            { id: 'supplier', label: 'Vendors', icon: Boxes },
            { id: 'master', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-zinc-500 dark:text-zinc-100 hover:text-foreground hover:bg-background"
              )}
            >
              <tab.icon size={14} strokeWidth={3} /> {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="grid grid-cols-1 gap-6">
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            <Card className="xl:col-span-3 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                   <CardTitle className="text-2xl">Material Requisition</CardTitle>
                   <CardDescription>Master level supply chain oversight</CardDescription>
                   <Button variant="outline" size="sm" onClick={handleAutoReplenish} className="h-6 px-2 rounded-lg border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-[0.98] transition-all">
                       <Plus size={10} className="mr-1" /> AUTO-SCAN LOW STOCK
                    </Button>
                </div>
                <div className="w-72">
                  <Select 
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">-- AUTHORIZED VENDOR --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Material Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Unit</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item, index) => (
                      <TableRow key={index} className="group">
                        <TableCell>
                          <Select 
                            className="h-10 text-xs text-zinc-900 dark:text-zinc-100"
                            value={item.bahanId} 
                            onChange={(e) => updateItem(index, 'bahanId', e.target.value)}
                            disabled={!selectedSupplier}
                          >
                            {getBahanOptions()}
                          </Select>
                          {item.bahanId && conversions.find(c => c.bahan_id === item.bahanId) && (
                            <div className="mt-2 flex items-center gap-2 px-4 py-1 bg-primary/5 border border-primary/10 rounded-lg w-fit">
                              <span className="text-[8px] font-black text-primary uppercase tracking-widest">Conversion Found:</span>
                              <span className="text-[9px] font-bold text-foreground">
                                1 {conversions.find(c => c.bahan_id === item.bahanId).from_unit} = {conversions.find(c => c.bahan_id === item.bahanId).multiplier} {conversions.find(c => c.bahan_id === item.bahanId).to_unit}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input 
                            type="number" 
                            className="w-20 text-center h-10 font-black" 
                            value={item.purchaseQty || 0} 
                            onChange={(e) => updateItem(index, 'purchaseQty', parseFloat(e.target.value) || 0)} 
                            disabled={!selectedSupplier}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                           <Select 
                              className="w-24 h-10 text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100"
                              value={item.purchaseUnit} 
                              onChange={(e) => updateItem(index, 'purchaseUnit', e.target.value)}
                              disabled={!selectedSupplier}
                           >
                              {/* 1. Base Unit of Material */}
                              {bahanList.find(b => b.id === item.bahanId) && (
                                <option value={bahanList.find(b => b.id === item.bahanId).unit}>
                                  {bahanList.find(b => b.id === item.bahanId).unit}
                                </option>
                              )}
                              
                              {/* 2. Conversion Units for this Material */}
                              {conversions
                                .filter(c => c.bahan_id === item.bahanId)
                                .map(c => (
                                  <option key={c.id} value={c.from_unit}>{c.from_unit}</option>
                                ))
                              }
                           </Select>
                        </TableCell>
                        <TableCell className="text-right">
                           <Input 
                              type="number" 
                              className="w-40 text-right h-10 font-mono tabular-nums text-primary font-bold bg-primary/5 border-primary/20" 
                              value={item.unitPrice || 0} 
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} 
                              disabled={!selectedSupplier}
                           />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/30 rounded-lg" onClick={() => setPoItems(poItems.filter((_, i) => i !== index))}>
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-border bg-background">
                  <Button disabled={!selectedSupplier} variant="outline" className="w-full h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={addItemToPo}>
                    <Plus size={16} className="mr-2" /> Add New Requisition Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
               <Card variant="premium" className="p-8 border border-zinc-200 dark:border-zinc-800 shadow-amber-500/10">
                  <p className="text-primary-foreground/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Total Estimated Settlement</p>
                  <div className="text-4xl font-black text-primary-foreground font-mono tabular-nums tracking-tighter mb-8 tabular-nums">
                    {formatCurrency(poItems.reduce((acc, item) => acc + (item.purchaseQty * item.unitPrice), 0))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      type="button"
                      className="w-full h-12 bg-white hover:bg-zinc-50 border border-zinc-200 text-amber-500 dark:bg-zinc-900 dark:text-amber-400 dark:hover:bg-zinc-800 dark:border-zinc-800 shadow-sm active:scale-95 transition-all font-black text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100" 
                      onClick={handleSavePO} 
                      disabled={actionLoading || poItems.filter(i => i.bahanId).length === 0}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "GENERATE PURCHASE ORDER"}
                    </button>
                    <button 
                      type="button"
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-900 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all font-black text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100" 
                      onClick={handleSimplePurchase} 
                      disabled={actionLoading || poItems.filter(i => i.bahanId).length === 0}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={15} /> DIRECT CASH PURCHASE</>}
                    </button>
                  </div>
               </Card>

               <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-lg" />
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-[0.2em]">Logistics Notes</label>
                  </div>
                  <textarea 
                    className="w-full h-28 bg-background border border-border rounded-lg p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all resize-none placeholder:italic"
                    placeholder="Provide specific instructions for logistics team..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'grn' && (
          <>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {pendingPOs.filter(p => p.status === 'pending' || p.status === 'partially_received').length === 0 && (
                <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg ">
                   <Truck size={48} className="text-zinc-500 dark:text-zinc-100 mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">No Pending Receipts Found</p>
                </div>
              )}
              {pendingPOs.filter(p => p.status === 'pending' || p.status === 'partially_received').map(po => (
                <Card key={po.id} className="p-6 space-y-6 hover:translate-y-[-4px] transition-transform duration-300 cursor-pointer group active:scale-[0.98]">
                   <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <Truck size={24} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-inner border",
                          po.status === 'partially_received'                             ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" 
                            : "bg-background text-zinc-500 dark:text-zinc-100 border-border"
                        )}>
                          {po.status === 'partially_received' ? 'Partial Receipt' : 'Awaiting Audit'}
                        </span>
                        {po.status === 'partially_received' && (
                          <span className="text-[7px] font-black text-amber-600 uppercase">Backorder Active</span>
                        )}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{po.po_number || 'PO-REQ-X'}</p>
                      <h3 className="text-xl font-black truncate text-foreground">{po.supplier?.name}</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold flex items-center gap-1">
                        <Loader2 size={10} /> CREATED {new Date(po.created_at).toLocaleDateString()}
                      </p>
                   </div>
                   <div className="pt-4 border-t border-border flex items-center justify-between">
                       <div className="font-mono tabular-nums font-black text-lg text-foreground tabular-nums tracking-tighter">{formatCurrency(po.total_amount)}</div>
                       <div className="flex gap-2">
                         <Button 
                           type="button" 
                           variant="outline" 
                           size="sm"                               
                           className="h-8 px-4 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"
                           onClick={() => handlePrintPO(po)}
                         >
                           <Printer size={14} />
                         </Button>
                         <Button size="sm" onClick={() => handleReceivePO(po)} disabled={actionLoading}>
                           {actionLoading ? <Loader2 className="animate-spin" /> : "RECEIVE"}
                         </Button>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           className="h-8 px-3 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                           onClick={() => handleCancelPO(po)}
                           disabled={actionLoading}
                           title="Batalkan PO ini"
                         >
                           <X size={13} />
                         </Button>
                       </div>
                    </div>
                </Card>
              ))}
           </div>

            {/* 💡 Historical Orders Ledger (Printable PDF Archive) */}
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground text-zinc-900 dark:text-zinc-100">Purchase Order History</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-100 font-bold">Historical archive of all requisitions and procurement logs</p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={10} /> Audit Trial Intact
                </div>
              </div>

              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Reference</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-center">Order Date</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Control</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPOs.filter(p => p.status !== 'pending' && p.status !== 'partially_received').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-zinc-500 dark:text-zinc-100 italic">No historical orders found.</TableCell>
                        </TableRow>
                      )}
                      {pendingPOs.filter(p => p.status !== 'pending' && p.status !== 'partially_received').map(po => (
                        <TableRow key={po.id} className="h-16">
                          <TableCell className="font-mono tabular-nums text-zinc-500 dark:text-zinc-100 font-bold">
                            {po.po_number || `PO-${po.id.toString().slice(0,6).toUpperCase()}`}
                          </TableCell>
                          <TableCell className="font-black text-sm">{po.supplier?.name}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-100">
                            {new Date(po.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums font-black text-foreground tabular-nums text-sm">
                            {formatCurrency(po.total_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border",
                              po.status === 'completed' || po.status === 'Diterima'
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            )}>
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-4 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"
                              onClick={() => handlePrintPO(po)}
                            >
                              <Printer size={12} className="mr-1.5" /> PDF / Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'finance' && (() => {
          const filteredInvoices = invoices.filter(inv => {
            if (!searchInvoiceSupplier) return true;
            return inv.supplier?.name?.toLowerCase().includes(searchInvoiceSupplier.toLowerCase());
          });
          const totalUnpaidAll = invoices.reduce((acc, inv) => acc + (inv.status === 'unpaid' ? inv.total : 0), 0);
          const totalUnpaidFiltered = filteredInvoices.reduce((acc, inv) => acc + (inv.status === 'unpaid' ? inv.total : 0), 0);

          return (
            <div className="space-y-6">
              {/* Financial Dashboard Summary Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">Total Hutang Dagang (Semua)</p>
                    <p className="text-3xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-50">{formatCurrency(totalUnpaidAll)}</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">
                    {invoices.filter(inv => inv.status === 'unpaid').length} Invoice Belum Lunas
                  </div>
                </Card>

                <Card className="p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Hutang Supplier Terfilter</p>
                    <p className="text-3xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(totalUnpaidFiltered)}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    {filteredInvoices.filter(inv => inv.status === 'unpaid').length} Terfilter
                  </div>
                </Card>
              </div>

              {/* Main Ledger Card */}
              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-8 border-b border-border bg-background">
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Accounts Payable Ledger</CardTitle>
                    <CardDescription className="text-xs font-bold text-zinc-500">Financial settlement & liability management</CardDescription>
                  </div>
                  <div className="w-full md:w-80">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Cari Supplier..."
                        value={searchInvoiceSupplier}
                        onChange={(e) => setSearchInvoiceSupplier(e.target.value)}
                        className="w-full h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-amber-500/20 text-sm font-bold placeholder:italic rounded-lg"
                      />
                      {searchInvoiceSupplier && (
                        <button 
                          onClick={() => setSearchInvoiceSupplier('')} 
                          className="absolute right-3 top-3.5 text-xs text-zinc-400 hover:text-zinc-600 font-bold"
                        >
                          RESET
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Vendor Entity</TableHead>
                        <TableHead className="text-center">Jatuh Tempo (Due)</TableHead>
                        <TableHead className="text-right">Settlement Amount</TableHead>
                        <TableHead className="text-center">State</TableHead>
                        <TableHead className="text-right">Control</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-zinc-500 dark:text-zinc-100 italic">No settlement liabilities recorded.</TableCell>
                        </TableRow>
                      )}
                      {filteredInvoices.map(inv => (
                        <TableRow key={inv.id} className="h-16">
                          <TableCell className="font-mono tabular-nums text-zinc-500 dark:text-zinc-100 font-bold">#{inv.id.slice(0,8).toUpperCase()}</TableCell>
                          <TableCell className="font-black text-sm">{inv.supplier?.name}</TableCell>
                          <TableCell className="text-center font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Instant Cash'}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums font-black text-foreground tabular-nums text-sm">{formatCurrency(inv.total)}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-sm",
                              inv.status === 'paid' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-primary/10 text-primary border border-primary/20"
                            )}>{inv.status}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {inv.status === 'unpaid' && (
                              <Button size="sm" variant="outline" onClick={() => handlePayInvoice(inv)} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="animate-spin" size={12} /> : "SETTLE"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {activeTab === 'supplier' && (
           <div className="space-y-6">
              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                 <CardHeader className="flex flex-row items-center justify-between p-8">
                    <div>
                       <CardTitle className="text-2xl">Authorized Vendor Registry</CardTitle>
                       <CardDescription>Verified supply chain partners and entities</CardDescription>
                    </div>
                     <Button 
                        onClick={() => setShowSupplierModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 rounded-lg h-12 px-8 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 active:scale-[0.98] transition-all font-black"
                     >
                        <Plus size={18} className="mr-2" /> Add New Vendor
                     </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow>
                             <TableHead>Vendor Entity</TableHead>
                             <TableHead>Contact Lead</TableHead>
                             <TableHead>Headquarters</TableHead>
                             <TableHead className="text-center">Trust Status</TableHead>
                             <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {suppliers.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-zinc-500 dark:text-zinc-100 italic font-medium">No verified vendors registered in the cockpit.</TableCell>
                             </TableRow>
                          )}
                          {suppliers.map(s => (
                             <TableRow key={s.id} className="h-20 group">
                                <TableCell>
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black">{s.name[0]}</div>
                                      <span className="font-black text-sm">{s.name}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-zinc-500 dark:text-zinc-100">{s.contact || 'N/A'}</TableCell>
                                <TableCell className="text-xs font-bold text-zinc-500 dark:text-zinc-100">{s.address || 'N/A'}</TableCell>
                                <TableCell className="text-center">
                                   <span className="px-4 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">VERIFIED</span>
                                </TableCell>
                                <TableCell className="text-right">
                                   <Button variant="ghost" size="icon" className="rounded-lg text-zinc-500 dark:text-zinc-100 group-hover:text-primary"><Settings size={14} /></Button>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>
           </div>
        )}

        {activeTab === 'master' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary rounded-lg" />
                    Unit Conversion Logic
                 </h3>
                 <div className="space-y-4">
                    {conversions.length === 0 && <p className="text-xs text-zinc-500 dark:text-zinc-100 italic">No conversion rules defined.</p>}
                    {conversions.map(c => (
                       <div key={c.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">{c.bahan?.name}</p>
                             <p className="text-sm font-bold">1 {c.from_unit} = {c.multiplier} {c.to_unit}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-rose-600 dark:text-rose-400"><Trash2 size={14} /></Button>
                       </div>
                    ))}
                    <Button variant="outline" className="w-full h-14 border-dashed rounded-lg border-2">Add New Conversion Rule</Button>
                 </div>
              </Card>

              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary rounded-lg" />
                    Procurement Policy
                 </h3>
                 <div className="space-y-6">
                    <div className="p-6 bg-background rounded-lg border border-border/50">
                       <p className="text-sm font-bold mb-1">Auto-Generate Invoices</p>
                       <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-medium mb-4">Automatically generate accounts payable entry when PO is received.</p>
                       <div className="w-12 h-6 bg-primary rounded-lg relative"><div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-lg shadow-md" /></div>
                    </div>
                    <div className="p-6 bg-background rounded-lg border border-border/50">
                       <p className="text-sm font-bold mb-1">Strict Material Audit</p>
                       <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-medium mb-4">Require manager approval for price discrepancies {'>'} 5%.</p>
                       <div className="w-12 h-6 bg-background rounded-lg relative"><div className="absolute left-1 top-1 w-4 h-4 bg-background rounded-lg shadow-md" /></div>
                    </div>
                 </div>
              </Card>
           </div>
        )}
      </main>
      
      {/* 📦 AUDIT RECEIPT MODAL (GRN VERIFICATION) */}
      {receivingPo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 ">
           <Card className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-card rounded-lg overflow-hidden">
             <CardHeader className="p-8 border-b border-border bg-background">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/20 mb-4">Physical Audit in Progress</div>
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter">Receive Goods</CardTitle>
                  <CardDescription className="text-xs font-bold">{receivingPo.po_number} &bull; {receivingPo.supplier?.name}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReceivingPo(null)} className="rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                   <X size={20} />
                 </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[50vh] overflow-y-auto no-scrollbar">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-8 py-6">Material Item</TableHead>
                    <TableHead className="text-center">Ordered</TableHead>
                    <TableHead className="text-center">Received So Far</TableHead>
                    <TableHead className="text-center text-primary">Now Audited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingItems.map((item, idx) => {
                    const ordered = Number(item.purchase_qty) || 0;
                    const receivedSoFar = Number(item.received_qty) || 0;
                    const remaining = Math.max(0, ordered - receivedSoFar);
                    
                    return (
                      <TableRow key={idx} className="group hover:bg-primary/5 transition-all">
                        <TableCell className="px-8 py-6">
                          <p className="font-black text-sm uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{item.bahan_name || 'Material Item'}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-100 font-bold">{item.purchase_unit}</p>
                        </TableCell>
                        <TableCell className="text-center font-black text-zinc-500 dark:text-zinc-100 tabular-nums ">
                          {ordered} {item.purchase_unit}
                        </TableCell>
                        <TableCell className="text-center font-black text-amber-600 tabular-nums">
                          {receivedSoFar} {item.purchase_unit}
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center justify-center gap-4">
                             <Input 
                               type="number"
                               className={cn(
                                 "w-24 h-12 text-center font-black text-lg rounded-lg transition-all",
                                  Number(item.qtyReceived) < remaining ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "border-emerald-200 dark:border-emerald-800 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                               )}
                               value={item.qtyReceived}
                               onChange={(e) => {
                                 const newItems = [...receivingItems];
                                 newItems[idx].qtyReceived = parseFloat(e.target.value) || 0;
                                 setReceivingItems(newItems);
                               }}
                             />
                             {Number(item.qtyReceived) < remaining && (
                               <div className="px-2 py-1 ">Partial</div>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="p-8 bg-background border-t border-border flex flex-col gap-4">
               <div className="flex justify-between items-center w-full px-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Verification Requirement</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <ShieldCheck size={12} /> Physical Verification Complete
                  </div>
               </div>
               <Button 
                className="w-full h-16 bg-primary text-primary-foreground rounded-lg font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={confirmReceipt}
                disabled={actionLoading}
               >
                 {actionLoading ? <Loader2 className="animate-spin" /> : "FINALIZE GRN & UPDATE STOCK"}
               </Button>
               <p className="text-center text-[9px] text-zinc-500 dark:text-zinc-100 font-bold uppercase tracking-widest">Digital Audit Trail will be generated for this session</p>
            </CardFooter>
          </Card>
        </div>
      )}
      {/* 📦 ADD VENDOR MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 ">
           <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-card rounded-lg overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-background">
              <div className="flex justify-between items-center">
                <div>
                   <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 mb-2">Vendor Registry</div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Add New Vendor</CardTitle>
                </div>
                <button 
                  onClick={() => setShowSupplierModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-background flex items-center justify-center text-zinc-500 dark:text-zinc-100 hover:text-foreground transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Vendor Name</label>
                <Input 
                  placeholder="e.g. GLOBAL SUPPLY HQ" 
                  className="h-12 bg-background border-border/80 focus:bg-background rounded-lg font-bold text-sm"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Contact Lead / Phone</label>
                <Input 
                  placeholder="e.g. +62 812-3456-789" 
                  className="h-12 bg-background border-border/80 focus:bg-background rounded-lg font-bold text-sm"
                  value={newSupplier.contact}
                  onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Headquarters Address</label>
                <Input 
                  placeholder="e.g. Jakarta, Indonesia" 
                  className="h-12 bg-background border-border/80 focus:bg-background rounded-lg font-bold text-sm"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Term of Payment (Hari)</label>
                <Input 
                  type="number"
                  placeholder="e.g. 14" 
                  className="h-12 bg-background border-border/80 focus:bg-background rounded-lg font-bold text-sm"
                  value={newSupplier.payment_terms_days || ''}
                  onChange={e => setNewSupplier({ ...newSupplier, payment_terms_days: parseInt(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-background border-t border-border">
               <Button 
                 className="w-full h-14 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 active:scale-[0.98] transition-all font-black uppercase tracking-widest rounded-lg"
                onClick={handleSaveSupplier}
                disabled={actionLoading || !newSupplier.name}
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : "Save Vendor Partner"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {/* 🚫 CANCEL PO CONFIRMATION MODAL */}
      {cancelConfirmPO && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setCancelConfirmPO(null)} />
          <div className="relative w-full max-w-md bg-card border border-rose-200 dark:border-rose-800 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />

            <div className="p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-6">
                <AlertTriangle size={28} className="text-rose-600 dark:text-rose-400" />
              </div>

              {/* Heading */}
              <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                Batalkan Purchase Order?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-1">
                Anda akan membatalkan:
              </p>
              <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg mb-6">
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                  {cancelConfirmPO.po_number || `PO-${cancelConfirmPO.id?.toString().slice(0,8).toUpperCase()}`}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                  {cancelConfirmPO.supplier?.name} &bull; {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cancelConfirmPO.total_amount || 0)}
                </p>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wide mb-6">
                ⚠ Tindakan ini tidak dapat dibatalkan. PO akan dikunci permanen.
              </p>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCancelConfirmPO(null)}
                  disabled={actionLoading}
                  className="flex-1 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={doConfirmCancel}
                  disabled={actionLoading}
                  className="flex-1 h-12 rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><X size={14} /> Ya, Batalkan PO</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💳 PAY INVOICE CONFIRMATION MODAL */}
      {payConfirmInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setPayConfirmInvoice(null)} />
          <div className="relative w-full max-w-md bg-card border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

            <div className="p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-6">
                <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Heading */}
              <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                Konfirmasi Pembayaran
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-1">
                Anda akan menyelesaikan pembayaran untuk invoice:
              </p>
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg mb-6">
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                  #{payConfirmInvoice.id?.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                  {payConfirmInvoice.supplier?.name} &bull; {formatCurrency(payConfirmInvoice.total || 0)}
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide mb-6">
                ✓ Invoice ini akan ditandai lunas dan jurnal akuntansi otomatis diperbarui.
              </p>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setPayConfirmInvoice(null)}
                  disabled={actionLoading}
                  className="flex-1 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={doConfirmPay}
                  disabled={actionLoading}
                  className="flex-1 h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><CheckCircle2 size={14} /> Settle Sekarang</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
