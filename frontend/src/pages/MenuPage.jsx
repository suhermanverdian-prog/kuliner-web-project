import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';

const emptyForm = {
  name: '', category: 'Kopi', price: 0, cost: 0, icon: '☕', image: '', unit: 'Cup', bom: []
};

// Helper for image fallback
function ProductImage({ src, alt, icon }) {
  if (src) return <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return <div style={{ fontSize: '2.5rem' }}>{icon || '☕'}</div>;
}

function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: '' };
  if (bahan.storageType === 'Kemasan') {
    const itemsCount = Number(bahan.packageItemsCount) || 1;
    const vol = Number(bahan.packageItemVolume) || 1;
    const volUnit = (bahan.packageItemVolumeUnit || '').toLowerCase();
    
    if (volUnit === 'ml' || volUnit === 'gr' || volUnit === 'gram') {
      return { ratio: itemsCount * vol, unit: volUnit === 'gr' ? 'Gram' : 'ml' };
    } else {
      return { ratio: itemsCount, unit: bahan.packageItemUnit || 'Pcs' };
    }
  } else {
    const u = (bahan.unit || '').toLowerCase();
    if (u === 'kg' || u === 'kilogram') return { ratio: 1000, unit: 'Gram' };
    if (u === 'liter' || u === 'l') return { ratio: 1000, unit: 'ml' };
    return { ratio: 1, unit: bahan.unit };
  }
}


function BOMEditor({ bom, onChange, bahanList }) {
  const addRow = () => onChange([...bom, { bahanId: '', qty: 0 }]);
  const updateRow = (i, field, val) => {
    const next = bom.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(next);
  };
  const removeRow = (i) => onChange(bom.filter((_, idx) => idx !== i));

  const totalHPP = bom.reduce((sum, row) => {
    const bahan = bahanList?.find(b => b.id === Number(row.bahanId));
    if (!bahan) return sum;
    const conv = getConversion(bahan);
    const pricePerSmallestUnit = bahan.price / conv.ratio;
    return sum + (pricePerSmallestUnit * Number(row.qty));
  }, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="form-label" style={{ marginBottom: 0 }}>🧪 Resep / Bill of Materials</label>
        <button type="button" className="btn btn-outline btn-sm" onClick={addRow}>+ Tambah Bahan</button>
      </div>
      {bom.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Belum ada resep. Klik "+ Tambah Bahan" untuk mulai.
        </div>
      )}
      {bom.map((row, i) => {
        const bahan = bahanList?.find(b => b.id === Number(row.bahanId));
        return (
          <div key={i} className="flex gap-2 items-center mb-2">
            <select
              className="form-control"
              value={row.bahanId}
              onChange={e => updateRow(i, 'bahanId', e.target.value)}
              style={{ flex: 2 }}
            >
              <option value="">-- Pilih Bahan --</option>
              {bahanList?.map(b => {
                const conv = getConversion(b);
                return <option key={b.id} value={b.id}>{b.name} ({conv.unit})</option>;
              })}
            </select>
            <input
              type="number"
              className="form-control"
              placeholder="Jumlah"
              value={row.qty}
              onChange={e => updateRow(i, 'qty', e.target.value)}
              style={{ flex: 1 }}
            />
            <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', minWidth: '40px' }}>
              {bahan ? getConversion(bahan).unit : ''}
            </span>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>✕</button>
          </div>
        );
      })}
      {bom.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginTop: '8px', fontSize: '0.85rem' }}>
          <span className="text-muted">HPP Otomatis: </span>
          <strong style={{ color: 'var(--accent)' }}>{formatRupiah(totalHPP)}</strong>
          <span className="text-muted"> per porsi</span>
        </div>
      )}
    </div>
  );
}

function MenuFormModal({ item, onClose, onSave, bahanList }) {
  const [form, setForm] = useState(item || { ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const ICONS = ['☕', '🥛', '🍵', '🧊', '🍮', '🍫', '🥐', '🍳', '🥪', '🍩', '🍪', '🧃', '🍹', '🫖'];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      setForm({ ...form, image: res.url });
    } catch (err) {
      alert('Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const calcHPP = (bom) => bom.reduce((sum, row) => {
    const b = bahanList?.find(x => x.id === Number(row.bahanId));
    if (!b) return sum;
    const conv = getConversion(b);
    return sum + (b.price / conv.ratio) * Number(row.qty);
  }, 0);

  const hppOtomatis = calcHPP(form.bom || []);

  const handleSave = () => {
    if (!form.name.trim()) return alert('Nama menu wajib diisi!');
    const cost = hppOtomatis > 0 ? hppOtomatis : Number(form.cost) || 0;
    const dataToSave = { ...form, price: Number(form.price) || 0, cost };
    delete dataToSave.stock;
    if (item?.id) dataToSave.id = item.id;
    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{item ? '✏️ Edit Menu' : '➕ Tambah Menu Baru'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nama Menu</label>
            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth: Caramel Latte" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {MENU_CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Satuan</label>
              <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {['Cup', 'Pcs', 'Porsi', 'Botol', 'Mangkok'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Harga Jual (Rp)</label>
              <input type="number" className="form-control" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">HPP Otomatis (dari Resep)</label>
              <input type="text" className="form-control" readOnly value={hppOtomatis > 0 ? formatRupiah(hppOtomatis) : 'Belum ada resep'}
                style={{ background: 'var(--bg)', color: hppOtomatis > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Foto Produk (Opsional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden',
                background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--border)'
              }}>
                <ProductImage src={form.image} alt="Preview" icon={form.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} id="upload-image" />
                <label htmlFor="upload-image" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  {uploading ? '⏳ Mengunggah...' : '📁 Pilih File dari Komputer'}
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Disarankan rasio 1:1, maks 2MB</div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Atau Pilih Ikon (jika tidak ada foto)</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <button key={ic} type="button"
                  onClick={() => setForm({ ...form, icon: ic, image: '' })}
                  style={{
                    width: '40px', height: '40px', fontSize: '1.4rem', borderRadius: '8px',
                    border: form.icon === ic ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: form.icon === ic ? 'var(--bg)' : 'transparent',
                    cursor: 'pointer'
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <BOMEditor bom={form.bom || []} onChange={bom => setForm({ ...form, bom })} bahanList={bahanList} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Batal</button>
          <button id="btn-simpan-menu" className="btn btn-primary" onClick={handleSave}>💾 Simpan Menu</button>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [menus, setMenus] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuData, bahanData] = await Promise.all([
        api.getMenu().catch(() => []),
        api.getBahan().catch(() => [])
      ]);
      setMenus(Array.isArray(menuData) ? menuData : []);
      setBahanList(Array.isArray(bahanData) ? bahanData : []);
    } catch (e) {
      console.error(e);
      setMenus([]);
      setBahanList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = menus.filter(m => {
    const matchCat = category === 'Semua' || m.category === category;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setShowModal(true); };
  const handleDelete = async (id) => { 
    if (window.confirm('Hapus menu ini?')) {
      await api.deleteMenu(id);
      loadData();
    }
  };
  const handleSave = async (data) => {
    await api.saveMenu(data);
    loadData();
    setShowModal(false);
  };

  const margin = (item) => item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0;

  return (
    <div>
      <h1 className="page-title">☕ Menu & Produk</h1>
      <p className="page-subtitle">Kelola daftar menu, harga, dan resep Bill of Materials</p>

      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="flex gap-2 items-center" style={{ flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input className="form-control" style={{ paddingLeft: '36px' }} placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {MENU_CATEGORIES.map(c => (
            <button key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'var(--primary)' : '', color: viewMode === 'grid' ? '#fff' : '' }}>▦</button>
          <button className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--primary)' : '', color: viewMode === 'list' ? '#fff' : '' }}>☰</button>
          <button id="btn-tambah-menu" className="btn btn-primary" onClick={openAdd}>+ Tambah Menu</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ overflow: 'hidden', transition: 'var(--transition)' }}>
              <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--bg-card), var(--border-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative' }}>
                <ProductImage src={item.image} alt={item.name} icon={item.icon} />
              </div>
              <div style={{ padding: '14px' }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span className="badge badge-brown" style={{ marginRight: '4px' }}>{item.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatRupiah(item.price)}</span>
                  <span className={`badge ${margin(item) > 50 ? 'badge-success' : 'badge-warning'}`}>{margin(item)}% margin</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  HPP: <strong style={{color:'var(--success)'}}>{formatRupiah(item.cost)}</strong>
                </div>
                {item.bom?.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginBottom: '8px' }}>
                    🧪 {item.bom.length} bahan dalam resep
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(item)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          <div
            className="card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', border: '2px dashed var(--border)', cursor: 'pointer', background: 'transparent' }}
            onClick={openAdd}
          >
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>➕</div>
              <div style={{ fontWeight: 600 }}>Tambah Menu</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Menu</th>
                  <th>Kategori</th>
                  <th>Harga Jual</th>
                  <th>HPP (auto)</th>
                  <th>Margin</th>
                  <th>Resep BOM</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                          <ProductImage src={item.image} alt={item.name} icon={item.icon} />
                        </div>
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-brown">{item.category}</span></td>
                    <td><strong>{formatRupiah(item.price)}</strong></td>
                    <td><span style={{color:'var(--success)', fontWeight:600}}>{formatRupiah(item.cost)}</span></td>
                    <td>
                      <span className={`badge ${margin(item) > 50 ? 'badge-success' : 'badge-warning'}`}>
                        {margin(item)}%
                      </span>
                    </td>
                    <td>
                      {item.bom?.length > 0 ? (
                        <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                          <span className="badge badge-info" style={{marginBottom:'4px', alignSelf: 'flex-start'}}>🧪 {item.bom.length} bahan</span>
                          {item.bom.slice(0, 2).map((bRow, idx) => {
                            const b = bahanList.find(x => x.id === Number(bRow.bahanId));
                            const conv = getConversion(b);
                            return <div key={idx} className="text-xs text-muted" style={{whiteSpace:'nowrap'}}>• {b ? b.name : 'Data terhapus'} ({bRow.qty} {conv.unit})</div>;
                          })}
                          {item.bom.length > 2 && <div className="text-xs text-muted" style={{fontStyle:'italic'}}>+{item.bom.length - 2} lainnya</div>}
                        </div>
                      ) : (
                        <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>Belum ada</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <MenuFormModal
          key={editItem?.id || 'new'}
          item={editItem}
          bahanList={bahanList}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
