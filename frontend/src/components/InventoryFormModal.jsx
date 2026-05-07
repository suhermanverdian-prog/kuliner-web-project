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
    <div className="modal-overlay" style={{ zIndex: 9999, overflowY: 'auto', padding: '20px 0' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', background: '#f8fafc', padding: 0, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#e0e7ff', color: '#4f46e5', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              📦
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{initialData ? 'Edit Barang' : 'Tambah Barang'}</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{initialData ? 'Ubah data barang inventori' : 'Tambahkan barang baru ke inventori'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Body (Scrollable Grid) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          {/* Left Column (Forms) */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Step 1: Info */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Informasi Barang</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Nama Barang <span style={{color:'red'}}>*</span></label>
                  <input className="form-control" placeholder="Contoh: Sirup ABC" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ background: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Kategori <span style={{color:'red'}}>*</span></label>
                  <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ background: '#fff' }}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Lokasi Penyimpanan <span style={{color:'red'}}>*</span></label>
                <select className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ background: '#fff' }}>
                  {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
            </section>

            {/* Step 2: Jenis */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Jenis Penyimpanan</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div onClick={() => setForm({...form, storageType: 'Satuan Biasa'})} style={{ flex: 1, minWidth: '250px', padding: '16px', background: form.storageType === 'Satuan Biasa' ? '#f0f5ff' : '#fff', border: form.storageType === 'Satuan Biasa' ? '2px solid #6366f1' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: form.storageType === 'Satuan Biasa' ? '6px solid #6366f1' : '2px solid #cbd5e1', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>Satuan Biasa</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Untuk barang yang dijual per pcs, gram, liter, dll.</div>
                  </div>
                </div>
                <div onClick={() => setForm({...form, storageType: 'Kemasan'})} style={{ flex: 1, minWidth: '250px', padding: '16px', background: form.storageType === 'Kemasan' ? '#f0f5ff' : '#fff', border: form.storageType === 'Kemasan' ? '2px solid #6366f1' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: form.storageType === 'Kemasan' ? '6px solid #6366f1' : '2px solid #cbd5e1', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}>Kemasan (Karton/Dus)</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Untuk barang yang dijual per karton/dus isi beberapa unit.</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Satuan & Stok */}
            {form.storageType === 'Satuan Biasa' ? (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Satuan & Stok</h3>
                </div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Satuan <span style={{color:'red'}}>*</span></label>
                      <select className="form-control" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                        {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Jumlah Stok <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <input type="number" className="form-control" style={{ borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                        <span style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0', color: '#64748b' }}>{form.unit}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Stok Minimum <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <input type="number" className="form-control" style={{ borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
                        <span style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0', color: '#64748b' }}>{form.unit}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#6366f1' }}>ℹ️</span> Stok akan dihitung dalam satuan: <strong>{form.unit}</strong>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Detail Kemasan</h3>
                </div>
                
                <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '8px', border: '1px solid #e9d5ff', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: '12px', fontSize: '0.9rem' }}>A. Kemasan (Satuan Besar)</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="form-label">Satuan Kemasan <span style={{color:'red'}}>*</span></label>
                      <select className="form-control" value={form.packageUnit} onChange={e => setForm({...form, packageUnit: e.target.value})} style={{ background: '#fff' }}>
                        {packageUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="form-label">Jumlah Kemasan (Stok) <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.packageStock} onChange={e => setForm({...form, packageStock: e.target.value})} />
                        <span style={{ padding: '8px 12px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '0 6px 6px 0', color: '#6b21a8' }}>{form.packageUnit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '12px', fontSize: '0.9rem' }}>B. Isi per Kemasan (Satuan Kecil)</div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label className="form-label">Isi per Kemasan <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.packageItemsCount} onChange={e => setForm({...form, packageItemsCount: e.target.value})} />
                        <span style={{ padding: '8px 12px', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '0 6px 6px 0', color: '#0369a1' }}>Unit</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label className="form-label">Satuan Isi <span style={{color:'red'}}>*</span></label>
                      <select className="form-control" value={form.packageItemUnit} onChange={e => setForm({...form, packageItemUnit: e.target.value})} style={{ background: '#fff' }}>
                        {itemUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="form-label">Volume per Isi <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.packageItemVolume} onChange={e => setForm({...form, packageItemVolume: e.target.value})} />
                        <select className="form-control" style={{ background: '#fff', borderRadius: '0 6px 6px 0', borderLeft: 'none', width: '70px', padding: '8px' }} value={form.packageItemVolumeUnit} onChange={e => setForm({...form, packageItemVolumeUnit: e.target.value})}>
                          <option value="ml">ml</option>
                          <option value="gr">gr</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#dcfce7', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✔️</span> Total per kemasan: <strong>{totalVolumeText}</strong>
                  </div>
                </div>
              </section>
            )}

            {/* Step 4: Harga */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>4</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Harga</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {form.storageType === 'Satuan Biasa' ? (
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label">Harga per Unit <span style={{color:'red'}}>*</span></label>
                    <div style={{ display: 'flex' }}>
                      <span style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', color: '#64748b' }}>Rp</span>
                      <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '0 6px 6px 0', borderLeft: 'none' }} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="form-label">Harga per Kemasan <span style={{color:'red'}}>*</span></label>
                      <div style={{ display: 'flex' }}>
                        <span style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', color: '#64748b' }}>Rp</span>
                        <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '0 6px 6px 0', borderLeft: 'none' }} value={form.packagePrice} onChange={e => setForm({...form, packagePrice: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px', background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#16a34a', marginBottom: '4px' }}>Harga per Unit (Otomatis)</div>
                      <div style={{ fontWeight: 'bold', color: '#15803d', fontSize: '1.1rem' }}>{formatRupiah(calculatedUnitPrice)} / {form.packageItemUnit}</div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Step 5: Info Tambahan */}
            <section style={{ paddingBottom: '20px' }}>
              {form.storageType === 'Kemasan' && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>5</span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Stok Minimum</h3>
                  </div>
                  <div style={{ maxWidth: '300px' }}>
                    <label className="form-label">Stok Minimum <span style={{color:'red'}}>*</span></label>
                    <div style={{ display: 'flex' }}>
                      <input type="number" className="form-control" style={{ background: '#fff', borderRadius: '6px 0 0 6px', borderRight: 'none' }} value={form.packageMinStock} onChange={e => setForm({...form, packageMinStock: e.target.value})} />
                      <span style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0', color: '#64748b' }}>{form.packageUnit}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Akan muncul peringatan jika stok kemasan ≤ minimum</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{form.storageType === 'Kemasan' ? '6' : '5'}</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Informasi Tambahan (Opsional)</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Merek / Brand</label>
                  <input className="form-control" placeholder="Contoh: Gulaku" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} style={{ background: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Barcode / SKU</label>
                  <input className="form-control" placeholder="Contoh: 8991234567890" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} style={{ background: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Tanggal Kadaluarsa</label>
                  <input type="date" className="form-control" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} style={{ background: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Catatan</label>
                  <input className="form-control" placeholder="Catatan tambahan" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ background: '#fff' }} />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (Summary Sidebar) */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', position: 'sticky', top: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Ringkasan Barang</h3>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#0f172a' }}>{form.name || 'Nama Barang'}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 12px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold' }}>{form.category}</span>
                  {form.storageType === 'Kemasan' && (
                    <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold' }}>Kemasan</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Jenis Penyimpanan</span>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.storageType}</span>
                </div>
                
                {form.storageType === 'Satuan Biasa' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Satuan</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.unit}</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Stok</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.stock || 0} {form.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Stok Minimum</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.minStock || 0} {form.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Harga per Unit</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatRupiah(form.price)} / {form.unit}</span>
                    </div>
                    
                    <div style={{ marginTop: '16px', background: '#f0fdf4', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', color: '#166534', alignItems: 'flex-start' }}>
                      <span>✔️</span>
                      <div style={{fontSize:'0.75rem'}}>Stok akan dihitung dalam satuan {form.unit.toLowerCase()}.</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Kemasan</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>1 {form.packageUnit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Isi per Kemasan</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.packageItemsCount || 0} {form.packageItemUnit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Volume per Isi</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{form.packageItemVolume || 0} {form.packageItemVolumeUnit}</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Total per Kemasan</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{totalVolumeText}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '8px' }}>
                      <span>Harga per Kemasan</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatRupiah(form.packagePrice)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Harga per Unit</span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{formatRupiah(calculatedUnitPrice)} / {form.packageItemUnit}</span>
                    </div>

                    <div style={{ marginTop: '16px', background: '#f0fdf4', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', color: '#166534', alignItems: 'flex-start' }}>
                      <span>✔️</span>
                      <div style={{fontSize:'0.75rem'}}>Stok akan dihitung dalam satuan kemasan ({form.packageUnit.toLowerCase()}).</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 12px 12px', position: 'sticky', bottom: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>✕ Batal</button>
          <button onClick={handleSave} style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>💾</span> Simpan Barang
          </button>
        </div>
      </div>
    </div>
  );
}
