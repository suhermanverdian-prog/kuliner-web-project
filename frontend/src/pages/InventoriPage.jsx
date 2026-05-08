import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import { api } from '../api';
import InventoryFormModal from '../components/InventoryFormModal';

const TagInput = ({ label, tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !tags.includes(val)) onChange([...tags, val]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="form-group mb-4" style={{ padding: '12px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
      <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '12px' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {tags.length === 0 && <span className="text-muted text-sm">Belum ada data</span>}
        {tags.map((tag, index) => (
          <span key={index} className="badge" style={{ background: 'var(--primary-light)', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px' }}>
            {tag}
            <button onClick={() => removeTag(index)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'var(--transition)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}>✕</button>
          </span>
        ))}
      </div>
      <input 
        className="form-control" 
        value={inputValue} 
        onChange={e => setInputValue(e.target.value)} 
        onKeyDown={handleKeyDown} 
        placeholder="Ketik lalu tekan Enter untuk menambah..." 
        style={{ border: '1px dashed var(--border)', background: 'transparent' }}
      />
    </div>
  );
};

export default function InventoriPage() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bahan, setBahan] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inventoryMeta, setInventoryMeta] = useState({ categories: [], packageUnits: [], itemUnits: [] });
  const [transferForm, setTransferForm] = useState({ bahanName: '', fromLocation: '', toLocation: '', qty: 0 });
  const [locForm, setLocForm] = useState({ name: '', type: 'Warehouse' });
  const [metaForm, setMetaForm] = useState({ categories: [], packageUnits: [], itemUnits: [] });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bahanData, locData, metaData] = await Promise.all([api.getBahan(), api.getLocations(), api.getInventoryMeta()]);
      setBahan(bahanData);
      setLocations(locData);
      setInventoryMeta(metaData);
      setMetaForm({
        categories: metaData.categories || [],
        packageUnits: metaData.packageUnits || [],
        itemUnits: metaData.itemUnits || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = bahan.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchLoc = locationFilter === 'Semua' || b.location === locationFilter;
    return matchSearch && matchLoc;
  });

  const openAdd = () => { 
    setEditItem(null); 
    setShowModal(true); 
  };
  const openEdit = (item) => { 
    setEditItem(item); 
    setShowModal(true); 
  };

  const handleSave = async (formData) => {
    await api.saveBahan({ ...formData, id: editItem?.id });
    loadData();
    setShowModal(false);
  };

  const handleTransfer = async () => {
    // Find the actual bahanId based on name and fromLocation
    const sourceBahan = bahan.find(b => b.name === transferForm.bahanName && b.location === transferForm.fromLocation);
    if (!sourceBahan || !transferForm.toLocation || transferForm.qty <= 0) return alert('Data transfer tidak lengkap atau stok tidak ditemukan');
    
    await api.transferStock({ ...transferForm, bahanId: sourceBahan.id });
    loadData();
    setShowTransferModal(false);
    alert('Transfer stok berhasil');
  };

  const handleSaveMeta = async () => {
    await api.saveInventoryMeta(metaForm);
    loadData();
    setShowSettingsModal(false);
    alert('Pengaturan inventori berhasil disimpan');
  };

  const handleSaveLocation = async () => {
    if (!locForm.name) return alert('Nama lokasi wajib diisi');
    await api.saveLocation(locForm);
    loadData();
    setShowLocationModal(false);
    setLocForm({ name: '', type: 'Warehouse' });
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm('Hapus lokasi ini? Data bahan di lokasi ini tidak akan terhapus, tapi disarankan untuk memindahkan stok terlebih dahulu.')) {
      await api.deleteLocation(id);
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus bahan ini?')) {
      await api.deleteBahan(id);
      loadData();
    }
  };

  const getStockStatus = (item) => {
    const ratio = item.stock / item.minStock;
    if (item.stock === 0) return { label: 'Habis', cls: 'badge-danger', barCls: 'empty', pct: 0 };
    if (ratio < 1) return { label: 'Hampir Habis', cls: 'badge-warning', barCls: 'low', pct: Math.min((ratio * 100), 100) };
    return { label: 'Aman', cls: 'badge-success', barCls: 'ok', pct: Math.min((ratio / 3 * 100), 100) };
  };

  return (
    <div>
      <h1 className="page-title">📦 Inventori & Bahan Baku</h1>
      <p className="page-subtitle">Kelola stok bahan baku untuk semua produk</p>

      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="menu-search-bar" style={{position:'relative', flex:1, maxWidth:'300px', marginBottom:0}}>
          <span className="search-icon">🔍</span>
          <input className="form-control" style={{paddingLeft:'40px'}} placeholder="Cari bahan..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ maxWidth: '200px' }} value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="Semua">-- Semua Lokasi --</option>
          {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowSettingsModal(true)}>⚙️ Pengaturan</button>
          <button className="btn btn-outline" onClick={() => setShowLocationModal(true)}>📍 Lokasi</button>
          <button className="btn btn-accent" onClick={() => setShowTransferModal(true)}>🔄 Transfer</button>
          <button id="btn-tambah-bahan" className="btn btn-primary" onClick={openAdd}>+ Tambah</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div>
        ) : bahan.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data bahan baku di server.</div>
        ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Bahan</th>
                <th>Satuan</th>
                <th>Stok</th>
                <th>Min. Stok</th>
                <th>Harga Modal/Unit</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const st = getStockStatus(item);
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge badge-brown">{item.unit}</span></td>
                    <td>
                      <div style={{fontWeight:700}}>{item.stock.toLocaleString('id-ID')}</div>
                      <div className="stock-bar" style={{width:'80px'}}>
                        <div className={`stock-bar-fill ${st.barCls}`} style={{width: st.pct + '%'}}></div>
                      </div>
                    </td>
                    <td className="text-muted">{item.minStock.toLocaleString('id-ID')}</td>
                    <td>{formatRupiah(item.price)}</td>
                    <td className="text-sm">{item.location}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <InventoryFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleSave} 
        initialData={editItem} 
        locations={locations}
        inventoryMeta={inventoryMeta}
      />
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" style={{maxWidth:'450px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔄 Transfer Antar Lokasi</span>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Pilih Bahan</label>
                <select className="form-control" value={transferForm.bahanName} onChange={e => {
                  setTransferForm({...transferForm, bahanName: e.target.value, fromLocation: ''});
                }}>
                  <option value="">-- Pilih Bahan --</option>
                  {[...new Set(bahan.map(b => b.name))].map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              
              {transferForm.bahanName && (
                <div className="form-group">
                  <label className="form-label">Lokasi Asal</label>
                  <select className="form-control" value={transferForm.fromLocation} onChange={e => setTransferForm({...transferForm, fromLocation: e.target.value})}>
                    <option value="">-- Pilih Lokasi Asal --</option>
                    {bahan.filter(b => b.name === transferForm.bahanName && b.stock > 0).map(b => (
                      <option key={b.id} value={b.location}>{b.location} (Stok: {b.stock} {b.unit})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lokasi Tujuan</label>
                  <select className="form-control" value={transferForm.toLocation} onChange={e => setTransferForm({...transferForm, toLocation: e.target.value})}>
                    <option value="">-- Pilih Tujuan --</option>
                    {locations.filter(l => l.name !== transferForm.fromLocation).map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah</label>
                  <input type="number" className="form-control" value={transferForm.qty} onChange={e => setTransferForm({...transferForm, qty: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTransferModal(false)}>Batal</button>
              <button className="btn btn-accent" onClick={handleTransfer}>🚀 Jalankan Transfer</button>
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal" style={{maxWidth:'400px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📍 Kelola Lokasi Penyimpanan</span>
              <button className="modal-close" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <div className="text-xs font-bold text-muted mb-2">DAFTAR LOKASI</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                  {locations.map(l => (
                    <span key={l.id} className="badge badge-brown" style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      {l.name} ({l.type})
                      <button onClick={() => handleDeleteLocation(l.id)} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', marginLeft:'4px', padding:0}}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <hr className="mb-4" style={{border:'0', borderTop:'1px solid var(--border-light)'}} />
              <div className="form-group">
                <label className="form-label">Nama Lokasi Baru</label>
                <input className="form-control" value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="cth: Gudang Belakang" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-control" value={locForm.type} onChange={e => setLocForm({...locForm, type: e.target.value})}>
                  <option>Warehouse</option>
                  <option>Kitchen</option>
                  <option>Outlet</option>
                  <option>Fridge</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowLocationModal(false)}>Tutup</button>
              <button className="btn btn-primary" onClick={handleSaveLocation}>💾 Tambah Lokasi</button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal" style={{maxWidth:'500px', display:'flex', flexDirection:'column'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚙️ Pengaturan Master Data</span>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{overflowY:'auto', flex:1}}>
              <TagInput 
                label="Daftar Kategori Produk" 
                tags={metaForm.categories} 
                onChange={tags => setMetaForm({...metaForm, categories: tags})} 
              />
              <TagInput 
                label="Satuan Kemasan (Grosir)" 
                tags={metaForm.packageUnits} 
                onChange={tags => setMetaForm({...metaForm, packageUnits: tags})} 
              />
              <TagInput 
                label="Satuan Isi (Retail/Eceran)" 
                tags={metaForm.itemUnits} 
                onChange={tags => setMetaForm({...metaForm, itemUnits: tags})} 
              />
            </div>
            <div className="modal-footer" style={{boxShadow:'0 -4px 12px rgba(0,0,0,0.05)', marginTop: 'auto'}}>
              <button className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveMeta}>💾 Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
