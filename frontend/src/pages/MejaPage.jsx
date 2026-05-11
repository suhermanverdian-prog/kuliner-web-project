import { useState, useEffect } from 'react';
import { api } from '../api';
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

const STATUS_STYLE = {
  available: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', color: 'text-emerald-600', label: 'Kosong', icon: Armchair },
  occupied:  { bg: 'bg-destructive/10',  border: 'border-destructive/20',  color: 'text-destructive',  label: 'Terisi', icon: Users },
  reserved:  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', color: 'text-amber-600', label: 'Reservasi', icon: Bookmark },
};

export default function MejaPage() {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    const name = prompt('Masukkan nama meja baru (misal: Meja 12):');
    if (name) {
      await api.saveTable({ name, capacity: 4 });
      fetchTables();
    }
  };

  const changeStatus = async (id, newStatus) => {
    await api.saveTable({ id, status: newStatus });
    if (selected?.id === id) setSelected({ ...selected, status: newStatus });
    fetchTables();
  };

  const safeTables = Array.isArray(tables) ? tables : [];

  const counts = {
    available: safeTables.filter(t=>t.status==='available').length,
    occupied: safeTables.filter(t=>t.status==='occupied').length,
    reserved: safeTables.filter(t=>t.status==='reserved').length,
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Memuat tata letak meja...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Meja</h2>
          <p className="text-muted-foreground mt-1">Pantau hunian dan status ketersediaan meja secara real-time.</p>
        </div>
        <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-xl shadow-accent/20" onClick={handleAddTable}>
          <Plus size={20} strokeWidth={3} /> Tambah Meja
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key:'available', label:'Meja Kosong', count: counts.available, color:'text-emerald-500', bg:'bg-emerald-500/10' },
          { key:'occupied',  label:'Meja Terisi',   count: counts.occupied,  color:'text-destructive', bg:'bg-destructive/10' },
          { key:'reserved',  label:'Reservasi',count: counts.reserved,  color:'text-amber-500', bg:'bg-amber-500/10' },
        ].map(s => (
          <Card key={s.key} className="border-none shadow-md bg-card group transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <h3 className={cn("text-3xl font-black mt-1", s.color)}>{s.count}</h3>
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", s.bg)}>
                {s.key === 'available' ? <Armchair className={s.color} /> : s.key === 'occupied' ? <Users className={s.color} /> : <Bookmark className={s.color} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Floor Map */}
        <Card className="flex-1 border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/10 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Denah Meja (Floor Plan)</CardTitle>
                <CardDescription>Klik meja untuk melihat detail atau mengubah status.</CardDescription>
              </div>
              <Layout className="text-accent" />
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
                      "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 group",
                      isSelected ? cn(st.border, st.bg, "shadow-xl scale-105") : "bg-muted/10 border-transparent hover:bg-muted/20 hover:scale-105 shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                      isSelected ? "bg-background shadow-lg" : "bg-muted/50 group-hover:bg-background group-hover:shadow-md"
                    )}>
                      <Icon className={cn("transition-colors", isSelected ? st.color : "text-muted-foreground group-hover:text-primary")} size={24} />
                    </div>
                    <p className="text-sm font-black truncate max-w-full">{t.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground uppercase">
                      <Users size={10} /> {t.capacity}
                    </div>
                    <div className={cn(
                      "mt-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                      isSelected ? "bg-white text-primary" : cn("bg-muted/40", st.color)
                    )}>
                      {st.label}
                    </div>
                  </button>
                );
              })}
              <button 
                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-transparent hover:bg-muted/10 hover:border-accent/40 transition-all group"
                onClick={handleAddTable}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-muted/20 text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                  <Plus size={24} />
                </div>
                <p className="text-xs font-black text-muted-foreground group-hover:text-primary transition-colors">Tambah Meja</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className={cn(
          "w-full lg:w-[350px] border-none shadow-xl bg-card shrink-0 transition-all duration-500",
          !selected && "opacity-50 grayscale"
        )}>
          {selected ? (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <CardHeader className="border-b bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-2xl", STATUS_STYLE[selected.status].bg, STATUS_STYLE[selected.status].color)}>
                    {selected.status === 'available' ? <Armchair size={32} /> : selected.status === 'occupied' ? <Users size={32} /> : <Bookmark size={32} />}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                    if(confirm('Hapus meja ini?')) {
                      await api.deleteTable(selected.id);
                      setSelected(null);
                      fetchTables();
                    }
                  }}>
                    <Trash2 size={18} />
                  </Button>
                </div>
                <CardTitle className="mt-6 text-2xl font-black">{selected.name}</CardTitle>
                <CardDescription className="flex items-center gap-1"><Users size={14} /> Maks. {selected.capacity} Tamu</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Meja</p>
                   <div className="grid grid-cols-1 gap-3">
                      {Object.keys(STATUS_STYLE).map(key => {
                        const s = STATUS_STYLE[key];
                        const isActive = selected.status === key;
                        const Icon = s.icon;
                        return (
                          <button 
                            key={key} 
                            onClick={() => changeStatus(selected.id, key)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                              isActive ? cn(s.bg, s.border, s.color) : "bg-muted/10 border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isActive ? "bg-white/50" : "bg-muted")}>
                              <Icon size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black">{s.label}</p>
                               <p className="text-[10px] font-bold uppercase opacity-60">{key}</p>
                            </div>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {selected.order && (
                  <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-accent">
                      <Coffee size={16} />
                      <p className="text-xs font-black uppercase tracking-widest">Pesanan Aktif</p>
                    </div>
                    <p className="text-lg font-black text-primary">{selected.order}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/5 p-6">
                <Button variant="outline" className="w-full h-12 font-bold" onClick={() => setSelected(null)}>
                  Tutup Panel
                </Button>
              </CardFooter>
            </div>
          ) : (
            <div className="p-20 text-center space-y-6 opacity-30">
              <Map size={80} strokeWidth={1} />
              <div>
                <p className="text-lg font-black">Pilih Meja</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">Untuk Mengelola Status</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
