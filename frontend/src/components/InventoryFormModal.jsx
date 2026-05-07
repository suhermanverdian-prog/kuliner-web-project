import { useState, useEffect } from 'react';
import { formatRupiah } from '../data';
import '../index.css'; // pastikan styles dimuat

export default function InventoryFormModal({ isOpen, onClose, onSave, initialData, locations, inventoryMeta }) {
  const categories = inventoryMeta?.categories?.length > 0 ? inventoryMeta.categories : ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'];
  const packageUnits = inventoryMeta?.packageUnits?.length > 0 ? inventoryMeta.packageUnits : ['Karton', 'Dus', 'Ball', 'Box'];
  const itemUnits = inventoryMeta?.itemUnits?.length > 0 ? inventoryMeta.itemUnits : ['Botol', 'Pcs', 'Gram', 'ML', 'Sachet', 'Kg', 'Liter'];

  const initialFormState = {
    name: '',
    category: categories[0],
    location: locations.length > 0 ? locations[0].name : '',
    storageType: 'Satuan Biasa',
    unit: itemUnits[0],
    stock: '',
    minStock: '',
    price: '',
    packageUnit: packageUnits[0],
    packageStock: '',
    packageItemsCount: '',
    packageItemUnit: itemUnits[0],
    packageItemVolume: '',
    packageItemVolumeUnit: 'ml',
    packagePrice: '',
    packageMinStock: '',
    brand: '',
    sku: '',
    expiryDate: '',
    notes: ''
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ ...initialFormState, ...initialData, storageType: initialData.storageType || 'Satuan Biasa' });
      } else {
        setForm({ ...initialFormState, category: categories[0], unit: itemUnits[0], packageUnit: packageUnits[0], packageItemUnit: itemUnits[0], location: locations[0]?.name || '' });
      }
    }
  }, [isOpen, initialData, inventoryMeta]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!form.name || !form.location) return alert('Nama dan Lokasi wajib diisi!');
    
    // Normalize data before saving
    let normalizedData = { ...form };
    
    // Convert string numbers to real numbers
    normalizedData.stock = Number(form.stock) || 0;
    normalizedData.minStock = Number(form.minStock) || 0;
    normalizedData.price = Number(form.price) || 0;
    
    if (form.storageType === 'Kemasan') {
      normalizedData.packageStock = Number(form.packageStock) || 0;
      normalizedData.packageItemsCount = Number(form.packageItemsCount) || 1;
      normalizedData.packagePrice = Number(form.packagePrice) || 0;
      normalizedData.packageMinStock = Number(form.packageMinStock) || 0;
      
      // Calculate unit price internally
      normalizedData.price = normalizedData.packageItemsCount > 0 ? normalizedData.packagePrice / normalizedData.packageItemsCount : 0;
      
      // Main stock field will track the package amount as requested in mockup
      normalizedData.stock = normalizedData.packageStock;
      normalizedData.minStock = normalizedData.packageMinStock;
      normalizedData.unit = form.packageUnit; // e.g. Karton
    }

    onSave(normalizedData);
  };

  const calculatedUnitPrice = form.packageItemsCount > 0 && form.packagePrice ? Number(form.packagePrice) / Number(form.packageItemsCount) : 0;
  const totalVolumeText = form.packageItemsCount && form.packageItemVolume ? `${form.packageItemsCount} ${form.packageItemUnit} (${Number(form.packageItemsCount) * Number(form.packageItemVolume)} ${form.packageItemVolumeUnit})` : '-';

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: '1000px', width: '95%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--accent-light)', color: 'var(--primary-dark)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', box_shadow: 'var(--shadow-sm)' }}>
              📦
            </div>
            <div>
              <h2 className="modal-title">{initialData ? 'Ubah Master Barang' : 'Tambah Barang Baru'}</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{initialData ? 'Perbarui informasi stok dan harga barang' : 'Masukkan data inventori ke dalam sistem'}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body (Scrollable Grid) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', padding: '32px', flex: 1, overflowY: 'auto', background: 'white' }}>
          
          {/* Left Column (Forms) */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Step 1: Info */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>1</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Informasi Dasar</h3>
              </div>
              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Nama Barang <span style={{color:'var(--danger)'}}>*</span></label>
                  <input className="form-control" placeholder="cth: Biji Kopi Arabica" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori <span style={{color:'var(--danger)'}}>*</span></label>
                  <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi Gudang <span style={{color:'var(--danger)'}}>*</span></label>
                <select className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                  {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
            </section>

            {/* Step 2: Jenis */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>2</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Model Penyimpanan</h3>
              </div>
              <div className="grid-2">
                <div onClick={() => setForm({...form, storageType: 'Satuan Biasa'})} style={{ padding: '20px', background: form.storageType === 'Satuan Biasa' ? 'rgba(74, 43, 29, 0.05)' : '#fff', border: form.storageType === 'Satuan Biasa' ? '2px solid var(--primary)' : '2px solid var(--border-light)', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ fontWeight: '800', marginBottom: '6px', color: 'var(--primary-dark)', fontSize: '1rem' }}>📦 Satuan Eceran</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Cocok untuk barang yang digunakan per satuan kecil (pcs, gr, ml).</div>
                </div>
                <div onClick={() => setForm({...form, storageType: 'Kemasan'})} style={{ padding: '20px', background: form.storageType === 'Kemasan' ? 'rgba(74, 43, 29, 0.05)' : '#fff', border: form.storageType === 'Kemasan' ? '2px solid var(--primary)' : '2px solid var(--border-light)', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ fontWeight: '800', marginBottom: '6px', color: 'var(--primary-dark)', fontSize: '1rem' }}>🍱 Model Kemasan</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Cocok untuk barang grosir (Karton/Dus) yang berisi banyak unit.</div>
                </div>
              </div>
            </section>

            {/* Step 3: Satuan & Stok */}
            {form.storageType === 'Satuan Biasa' ? (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>3</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Persediaan & Harga</h3>
                </div>
                <div style={{ background: '#FDFBF9', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div className="grid-3 mb-4">
                    <div className="form-group">
                      <label className="form-label">Satuan</label>
                      <select className="form-control" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                        {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stok Saat Ini</label>
                      <input type="number" className="form-control" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Batas Aman</label>
                      <input type="number" className="form-control" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Harga Beli per {form.unit}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>Rp</span>
                      <input type="number" className="form-control" style={{ paddingLeft: '48px' }} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>3</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Detail Kemasan Grosir</h3>
                </div>
                
                <div style={{ background: '#FDFBF9', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                  <div className="grid-2 mb-4">
                    <div className="form-group">
                      <label className="form-label">Satuan Kemasan</label>
                      <select className="form-control" value={form.packageUnit} onChange={e => setForm({...form, packageUnit: e.target.value})}>
                        {packageUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stok Kemasan</label>
                      <input type="number" className="form-control" value={form.packageStock} onChange={e => setForm({...form, packageStock: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Harga Beli per {form.packageUnit}</label>
                      <input type="number" className="form-control" value={form.packagePrice} onChange={e => setForm({...form, packagePrice: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Batas Aman</label>
                      <input type="number" className="form-control" value={form.packageMinStock} onChange={e => setForm({...form, packageMinStock: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(212, 154, 77, 0.03)', padding: '24px', borderRadius: '16px', border: '1px dashed var(--accent)' }}>
                  <div style={{ fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '16px', fontSize: '0.9rem' }}>📦 Konversi ke Satuan Eceran</div>
                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label">Isi per {form.packageUnit}</label>
                      <input type="number" className="form-control" value={form.packageItemsCount} onChange={e => setForm({...form, packageItemsCount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Satuan Isi</label>
                      <select className="form-control" value={form.packageItemUnit} onChange={e => setForm({...form, packageItemUnit: e.target.value})}>
                        {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Netto/Isi</label>
                      <div className="flex">
                        <input type="number" className="form-control" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} value={form.packageItemVolume} onChange={e => setForm({...form, packageItemVolume: e.target.value})} />
                        <select className="form-control" style={{ width: '80px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }} value={form.packageItemVolumeUnit} onChange={e => setForm({...form, packageItemVolumeUnit: e.target.value})}>
                          <option value="ml">ml</option>
                          <option value="gr">gr</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Step 4: Opsional */}
            <section style={{ paddingBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800' }}>4</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Data Tambahan (Opsional)</h3>
              </div>
              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Merek</label>
                  <input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Barcode</label>
                  <input className="form-control" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Kadaluarsa</label>
                <input type="date" className="form-control" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
              </div>
            </section>
          </div>

          {/* Right Column (Live Preview) */}
          <div style={{ flex: '0 0 320px' }}>
            <div className="card" style={{ position: 'sticky', top: 0, padding: '24px', border: '1px solid var(--accent-light)', background: 'linear-gradient(180deg, #fff, var(--bg))' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }}>
                  📦
                </div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 800 }}>{form.name || 'Nama Barang'}</h4>
                <div className="badge badge-brown mt-2">{form.category}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total Stok</span>
                  <span className="font-bold">
                    {form.storageType === 'Kemasan' ? `${form.packageStock || 0} ${form.packageUnit}` : `${form.stock || 0} ${form.unit}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Harga Satuan</span>
                  <span className="font-bold text-accent" style={{ color: 'var(--accent)' }}>
                    {formatRupiah(form.storageType === 'Kemasan' ? calculatedUnitPrice : form.price)}
                  </span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
                <div className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                  {form.storageType === 'Kemasan' 
                    ? `Barang disimpan dalam bentuk ${form.packageUnit.toLowerCase()} yang berisi ${form.packageItemsCount || 0} unit ${form.packageItemUnit.toLowerCase()}.`
                    : `Barang disimpan dalam satuan eceran ${form.unit.toLowerCase()}.`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '24px 32px' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ minWidth: '120px' }}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: '180px' }}>
            <span>💾</span> {initialData ? 'Simpan Perubahan' : 'Tambahkan Barang'}
          </button>
        </div>
      </div>
    </div>
  );
}
