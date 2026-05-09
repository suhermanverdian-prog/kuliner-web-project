import { useState, useEffect } from 'react';
import { api } from '../api';
import { Armchair, Users, Bookmark, Map, ClipboardList, Plus, CheckCircle2, Trash2, X } from 'lucide-react';

const STATUS_STYLE = {
  available: { bg: 'var(--success-light)', border: 'var(--success)', color: 'var(--success)', label: 'Kosong' },
  occupied:  { bg: 'var(--danger-light)',  border: 'var(--danger)',  color: 'var(--danger)',  label: 'Terisi' },
  reserved:  { bg: 'var(--warning-light)', border: 'var(--warning)', color: 'var(--warning)', label: 'Reservasi' },
};

export default function MejaPage() {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const data = await api.getTables();
    setTables(data);
    setLoading(false);
  };

  const handleAddTable = async () => {
    const name = prompt('Masukkan nama meja baru (misal: Meja 12):');
    if (name) {
      await api.saveTable({ name, capacity: 4 });
      fetchTables();
    }
  };

  const counts = {
    available: tables.filter(t=>t.status==='available').length,
    occupied: tables.filter(t=>t.status==='occupied').length,
    reserved: tables.filter(t=>t.status==='reserved').length,
  };

  const handleClick = (table) => setSelected(table);

  const changeStatus = async (id, newStatus) => {
    await api.saveTable({ id, status: newStatus });
    setSelected(prev => ({ ...prev, status: newStatus }));
    fetchTables();
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Memuat data meja...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4" style={{flexWrap:'wrap'}}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Armchair size={28} className="text-primary" /> Manajemen Meja
          </h1>
          <p className="page-subtitle">Pantau status semua meja secara real-time</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddTable}>
          <Plus size={16} /> Tambah Meja
        </button>
      </div>

      <div className="flex gap-3 mb-4" style={{flexWrap:'wrap'}}>
        {[
          { key:'available', label:'Kosong', count: counts.available, color:'var(--success)' },
          { key:'occupied',  label:'Terisi',   count: counts.occupied,  color:'var(--danger)' },
          { key:'reserved',  label:'Reservasi',count: counts.reserved,  color:'var(--warning)' },
        ].map(s => (
          <div key={s.key} className="stat-card" style={{flex:'1', minWidth:'120px', padding:'16px'}}>
            <div className="stat-value" style={{fontSize:'1.5rem', color: s.color}}>{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4" style={{alignItems:'flex-start', flexWrap:'wrap'}}>
        <div className="card" style={{flex:'1', minWidth:'300px'}}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={18} /> Peta Meja
            </span>
          </div>
          <div className="card-body">
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'12px'}}>
              {tables.map(t => {
                const st = STATUS_STYLE[t.status];
                return (
                  <div
                    key={t.id}
                    id={`table-${t.id}`}
                    onClick={() => handleClick(t)}
                    style={{
                      background: st.bg,
                      border: `2px solid ${st.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      outline: selected?.id === t.id ? `3px solid ${st.border}` : 'none',
                      outlineOffset: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom:'6px', color: st.color }}>
                      {t.status === 'available' ? <Armchair size={24} /> : t.status === 'occupied' ? <Users size={24} /> : <Bookmark size={24} />}
                    </div>
                    <div style={{fontWeight:800, fontSize:'0.9rem', color: 'var(--text-primary)'}}>{t.name}</div>
                    <div style={{fontSize:'0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px'}}>
                      <Users size={12} /> {t.capacity} kursi
                    </div>
                    <div style={{marginTop:'6px'}}>
                      <span style={{background: st.border, color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'2px 8px', borderRadius:'99px'}}>
                        {st.label}
                      </span>
                    </div>
                    {t.order && <div style={{fontSize:'0.65rem', marginTop:'4px', color: st.color, opacity:0.8}}>{t.order}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selected && (
          <div className="card" style={{width:'260px', flexShrink:0}}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} /> Detail Meja
              </span>
            </div>
            <div className="card-body">
              <div style={{textAlign:'center', marginBottom:'20px'}}>
                <div style={{ display: 'flex', justifyContent: 'center', color: STATUS_STYLE[selected.status].color }}>
                  {selected.status === 'available' ? <Armchair size={48} /> : selected.status === 'occupied' ? <Users size={48} /> : <Bookmark size={48} />}
                </div>
                <h3 style={{fontWeight:800, marginTop:'8px'}}>{selected.name}</h3>
                <span className={`badge ${selected.status === 'available' ? 'badge-success' : selected.status === 'occupied' ? 'badge-danger' : 'badge-warning'}`}>
                  {STATUS_STYLE[selected.status].label}
                </span>
              </div>
              <div className="text-sm" style={{lineHeight:'2'}}>
                <div className="flex justify-between"><span className="text-muted">Kapasitas</span><strong>{selected.capacity} kursi</strong></div>
                {selected.order && <div className="flex justify-between"><span className="text-muted">Order</span><strong>{selected.order}</strong></div>}
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'20px'}}>
                {selected.status === 'available' && (
                  <button className="btn btn-primary" onClick={() => changeStatus(selected.id, 'occupied')}>
                    <Armchair size={16} /> Buka Meja
                  </button>
                )}
                {selected.status === 'occupied' && (
                  <button className="btn btn-outline" style={{borderColor:'var(--success)', color:'var(--success)'}} onClick={() => changeStatus(selected.id, 'available')}>
                    <CheckCircle2 size={16} /> Tutup Meja
                  </button>
                )}
                <button className="btn btn-outline" style={{borderColor:'var(--danger)', color:'var(--danger)'}} onClick={async () => {
                  if(confirm('Yakin hapus meja ini?')) {
                    await api.deleteTable(selected.id);
                    setSelected(null);
                    fetchTables();
                  }
                }}>
                  <Trash2 size={16} /> Hapus Meja
                </button>
                <button className="btn btn-outline" onClick={() => setSelected(null)}>
                  <X size={16} /> Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
