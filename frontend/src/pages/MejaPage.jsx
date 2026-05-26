import React from 'react';
import { 
  Armchair, Users, Bookmark, Map, 
  ClipboardList, Plus, CheckCircle2, 
  Trash2, X, AlertCircle, Layout,
  Coffee, UserPlus, LogOut, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { useMejaPage } from '../hooks/useMejaPage';

const STATUS_STYLE = {
  available: { bg: 'bg-emerald-50 dark:bg-emerald-950/30 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-800', color: 'text-emerald-600 dark:text-emerald-400', label: 'Kosong', icon: Armchair },
  occupied:  { bg: 'bg-rose-50 dark:bg-rose-950/30 dark:bg-rose-500/20',  border: 'border-rose-200 dark:border-rose-800',  color: 'text-rose-600 dark:text-rose-400',  label: 'Terisi', icon: Users },
  reserved:  { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-500/20', color: 'text-amber-600 dark:text-amber-400', label: 'Reservasi', icon: Bookmark },
};

export default function MejaPage() {
  const {
    tables: safeTables,
    selected, setSelected,
    loading,
    showAddModal, setShowAddModal,
    newTableName, setNewTableName,
    newTableCapacity, setNewTableCapacity,
    handleAddTable,
    changeStatus,
    handleDeleteTable,
    counts
  } = useMejaPage();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 font-mono tabular-nums">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-lg animate-spin" />
      <p className="text-zinc-500 dark:text-zinc-100 animate-pulse font-medium">Memuat tata letak meja...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header - Sleek Premium Omnichannel Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-sm text-[9px] font-black text-amber-500 uppercase tracking-widest">Layout & Booking</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-tighter">Live Occupability</span>
              </div>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Manajemen <span className="text-amber-500 italic">Meja</span></h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">Pantau hunian, status ketersediaan meja, dan koordinasi reservasi secara real-time.</p>
        </div>
        <Button 
          size="lg" 
          className="h-14 px-8 font-black gap-2 " 
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} strokeWidth={3} /> Tambah Meja
        </Button>
      </div>
 
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key:'available', label:'Meja Kosong', count: counts.available, color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-950/30 dark:bg-emerald-500/20' },
          { key:'occupied',  label:'Meja Terisi',   count: counts.occupied,  color:'text-rose-600 dark:text-rose-400', bg:'bg-rose-50 dark:bg-rose-950/30 dark:bg-rose-500/20' },
          { key:'reserved',  label:'Reservasi',count: counts.reserved,  color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-950/30' },
        ].map(s => (
          <Card key={s.key} className="border border-border shadow-md bg-card rounded-lg group transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">{s.label}</p>
                <h3 className={cn("text-3xl font-black mt-1 font-mono tabular-nums", s.color)}>{s.count}</h3>
              </div>
              <div className={cn("w-12 h-12 rounded-md flex items-center justify-center border border-border shadow-inner", s.bg)}>
                {s.key === 'available' ? <Armchair className={s.color} /> : s.key === 'occupied' ? <Users className={s.color} /> : <Bookmark className={s.color} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Floor Map */}
        <Card className="flex-1 border border-border shadow-xl bg-card rounded-lg overflow-hidden">
          <CardHeader className="border-b bg-background pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Denah Meja (Floor Plan)</CardTitle>
                <CardDescription>Klik meja untuk melihat detail atau mengubah status.</CardDescription>
              </div>
              <Layout className="text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
              {safeTables.map(t => {
                const st = STATUS_STYLE[t.status];
                const Icon = st.icon;
                const isSelected = selected?.id === t.id;

                return (
                  <button 
                    key={t.id} 
                    onClick={() => setSelected(t)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-300 group",
                      isSelected ? cn(st.border, st.bg, "shadow-xl scale-105") : "bg-background border-border/40 hover:bg-background hover:scale-105 shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-md flex items-center justify-center mb-4 transition-all duration-500 border border-border/50",
                      isSelected ? "bg-card shadow-lg" : "bg-background group-hover:bg-card group-hover:shadow-md"
                    )}>
                      <Icon className={cn("transition-colors", isSelected ? st.color : "text-zinc-500 dark:text-zinc-100 group-hover:text-primary")} size={24} />
                    </div>
                    <p className="text-sm font-bold truncate max-w-full font-mono tabular-nums">{t.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-100 uppercase font-mono tabular-nums">
                      <Users size={10} /> {t.capacity}
                    </div>
                    <div className={cn(
                      "mt-4 px-4 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all",
                      isSelected ? "bg-primary text-zinc-900 font-black" : cn("bg-background", st.color)
                    )}>
                      {st.label}
                    </div>
                  </button>
                );
              })}
              <button 
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-border bg-transparent hover:bg-background hover:border-primary/40 transition-all group"
                onClick={() => setShowAddModal(true)}
              >
                <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4 bg-background text-zinc-900 dark:text-zinc-100 group-hover:">
                  <Plus size={24} />
                </div>
                <p className="text-xs font-black text-zinc-500 dark:text-zinc-100 group-hover:text-primary transition-colors">Tambah Meja</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className={cn(
          "w-full lg:w-[350px] border border-border shadow-xl bg-card rounded-lg shrink-0 transition-all duration-500",
          !selected && " grayscale"
        )}>
          {selected ? (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <CardHeader className="border-b bg-background">
                <div className="flex justify-between items-start">
                  <div className={cn("w-14 h-14 rounded-md flex items-center justify-center shadow-lg text-2xl border border-border/50", STATUS_STYLE[selected.status].bg, STATUS_STYLE[selected.status].color)}>
                    {selected.status === 'available' ? <Armchair size={32} /> : selected.status === 'occupied' ? <Users size={32} /> : <Bookmark size={32} />}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-md" onClick={() => handleDeleteTable(selected.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
                <CardTitle className="mt-6 text-2xl font-black font-mono tabular-nums">{selected.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs"><Users size={14} /> Maks. <span className="font-mono tabular-nums">{selected.capacity}</span> Tamu</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Status Meja</p>
                   <div className="grid grid-cols-1 gap-4">
                      {Object.keys(STATUS_STYLE).map(key => {
                        const s = STATUS_STYLE[key];
                        const isActive = selected.status === key;
                        const Icon = s.icon;
                        return (
                          <button 
                            key={key} 
                            onClick={() => changeStatus(selected.id, key)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                              isActive ? cn(s.bg, s.border, s.color) : "bg-background border-transparent  hover:"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-md flex items-center justify-center border", isActive ? "bg-card" : "bg-background")}>
                              <Icon size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black">{s.label}</p>
                               <p className="text-[10px] font-bold uppercase ">{key}</p>
                            </div>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {selected.order && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/10 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Coffee size={16} />
                      <p className="text-xs font-black uppercase tracking-widest">Pesanan Aktif</p>
                    </div>
                    <p className="text-lg font-black text-primary">{selected.order}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-background p-6">
                <Button 
                  variant="outline" 
                  className="w-full h-12 font-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:" 
                  onClick={() => setSelected(null)}
                >
                  Tutup Panel
                </Button>
              </CardFooter>
            </div>
          ) : (
            <div className="p-20 text-center space-y-6 ">
              <Map size={80} strokeWidth={1} />
              <div>
                <p className="text-lg font-black">Pilih Meja</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">Untuk Mengelola Status</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add Table Modal (Premium Design) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 ">
           <Card className="w-full max-w-md shadow-2xl border border-border rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 bg-card">
              <CardHeader className="bg-background border-b border-border p-8">
                 <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-foreground">
                       Tambah <span className="text-amber-500 italic">Meja Baru</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="rounded-md hover:bg-background text-zinc-500 dark:text-zinc-100" onClick={() => setShowAddModal(false)}><X size={20} /></Button>
                 </div>
                 <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-100 ">Kelola Denah dan Kapasitas Meja POS</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Nama / Nomor Meja</label>
                    <Input 
                      className="h-12 rounded-md bg-background border-border font-bold text-foreground focus-visible:ring-amber-500" 
                      value={newTableName} 
                      onChange={e => setNewTableName(e.target.value)} 
                      placeholder="cth: Meja 12 atau VIP 03" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1 font-sans">Kapasitas Tamu</label>
                    <Input 
                      type="number"
                      className="h-12 rounded-md bg-background border-border font-mono font-bold text-foreground focus-visible:ring-amber-500" 
                      value={newTableCapacity}
                      onChange={e => setNewTableCapacity(e.target.value)}
                      placeholder="cth: 4"
                    />
                 </div>
              </CardContent>
              <CardFooter className="p-8 bg-background border-t border-border flex flex-col gap-4">
                 <Button 
                   className="w-full h-14 font-black " 
                   onClick={handleAddTable}
                 >
                   SIMPAN DATA MEJA
                 </Button>
                 <Button variant="ghost" className="w-full h-10 font-black uppercase tracking-widest text-[9px] text-zinc-500 dark:text-zinc-100 rounded-md" onClick={() => setShowAddModal(false)}>BATALKAN</Button>
              </CardFooter>
           </Card>
        </div>
      )}
    </div>
  );
}
