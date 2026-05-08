import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { formatRupiah } from '../data';

export default function PembelianPage() {
  const [activeTab, setActiveTab] = useState('PO'); // 'PO' or 'SUPPLIER'
  
  // Data State
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
  // Form States
  const [supplierForm, setSupplierForm] = useState({ id: null, name: '', contact: '', address: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', location: '', items: [] }); // items: { bahanId, qty, price }
  const [receiveForm, setReceiveForm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suppData, poData, bahanData, locData] = await Promise.all([
        api.getSuppliers(),
        api.getPO(),
        api.getBahan(),
        api.getLocations()
      ]);
      setSuppliers(suppData);
      setPos(poData.reverse());
      setBahanList(bahanData);
      setLocations(locData);
    } catch (err) {
      console.error(err);
    }
  };

  // --- SUPPLIER ACTIONS ---
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    await api.saveSupplier(supplierForm);
    setShowSupplierModal(false);
    fetchData();
  };

  const handleDeleteSupplier = async (id) => {
    if (confirm('Yakin ingin menghapus supplier ini?')) {
      await api.deleteSupplier(id);
      fetchData();
    }
  };

  const openEditSupplier = (supp) => {
    setSupplierForm(supp);
    setShowSupplierModal(true);
  };

  // --- PO ACTIONS ---
  const [showQuickBahan, setShowQuickBahan] = useState(false);
  const [quickBahanForm, setQuickBahanForm] = useState({ name: '', category: '', unit: '', minStock: 10, price: 0 });

  const handleQuickSaveBahan = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addBahan(quickBahanForm);
      setBahanList([...bahanList, res]);
      setShowQuickBahan(false);
      alert('Bahan baku baru berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal menambah bahan baku');
    }
  };

  const handleAddPoItem = () => {
    setPoForm({ ...poForm, items: [...poForm.items, { bahanId: '', qty: 1, price: 0 }] });
  };

  const updatePoItem = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;
    
    // Auto fill price if bahan is selected
    if (field === 'bahanId') {
      const bahan = bahanList.find(b => b.id === Number(value));
      if (bahan) newItems[index].price = bahan.price || 0;
    }
    
    setPoForm({ ...poForm, items: newItems });
  };

  const removePoItem = (index) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: newItems });
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId) return alert('Pilih supplier!');
    if (poForm.items.length === 0) return alert('Pilih minimal 1 bahan baku!');
    
    // Clean up empty items
    const validItems = poForm.items.filter(i => i.bahanId && i.qty > 0);
    if (validItems.length === 0) return alert('Data item tidak valid!');
    
    await api.savePO({ ...poForm, items: validItems });
    setShowPOModal(false);
    fetchData();
  };

  const openReceiveModal = (po) => {
    setReceiveForm({
      id: po.id,
      poNumber: po.poNumber,
      items: po.items.map(i => ({ ...i, receivedQty: i.qty })) // default received is ordered qty
    });
    setShowReceiveModal(true);
  };

  const handleReceiveUpdateQty = (index, value) => {
    const newItems = [...receiveForm.items];
    newItems[index].receivedQty = Number(value);
    setReceiveForm({ ...receiveForm, items: newItems });
  };

  const submitReceivePO = async (e) => {
    e.preventDefault();
    await api.updatePOStatus(receiveForm.id, 'Diterima', receiveForm.items);
    setShowReceiveModal(false);
    fetchData();
    alert('PO berhasil diterima dan stok bahan baku telah diupdate!');
  };

  const cancelPO = async (id) => {
    if (confirm('Yakin membatalkan PO ini?')) {
      await api.updatePOStatus(id, 'Dibatalkan', []);
      fetchData();
    }
  };

  // --- PRINT PO ---
  const printPO = (po) => {
    const supplier = suppliers.find(s => s.id === Number(po.supplierId));
    let printContent = `
      <html>
        <head>
          <title>Cetak PO - ${po.poNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .total { font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h2>PURCHASE ORDER</h2>
          <div class="header">
            <center><strong>BrewMaster Coffee Shop</strong></center>
            <center>Jl. Kopi Arabica No. 1, Jakarta</center>
          </div>
          <div class="info">
            <p><strong>No PO:</strong> ${po.poNumber}</p>
            <p><strong>Tanggal:</strong> ${new Date(po.createdAt).toLocaleDateString('id-ID')}</p>
            <p><strong>Kepada:</strong> ${supplier ? supplier.name : 'Unknown'}<br/>
            ${supplier ? supplier.address : ''} (${supplier ? supplier.contact : ''})</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bahan Baku</th>
                <th>Jumlah</th>
                <th>Satuan</th>
                <th>Harga Satuan</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => {
                const b = bahanList.find(x => x.id === Number(item.bahanId));
                return `
                <tr>
                  <td>${b ? b.name : '-'}</td>
                  <td>${item.qty}</td>
                  <td>${b ? b.unit : '-'}</td>
                  <td>${formatRupiah(item.price)}</td>
                  <td>${formatRupiah(item.price * item.qty)}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="total">Total Estimasi:</td>
                <td class="total">${formatRupiah(po.items.reduce((sum, i) => sum + (i.price * i.qty), 0))}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top:40px;">Tanda Tangan,</p>
          <br/><br/>
          <p>___________________</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    printWin.document.write(printContent);
    printWin.document.close();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark)', fontSize: '1.8rem', marginBottom: '8px' }}>
            🛒 Manajemen Pembelian & PO
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data supplier dan riwayat pesanan barang.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1.5px solid var(--border-light)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('PO')}
          style={{ padding: '10px 24px', borderRadius: '99px', border: 'none', fontWeight: 600, cursor: 'pointer',
            background: activeTab === 'PO' ? 'var(--primary)' : 'var(--bg)', 
            color: activeTab === 'PO' ? '#fff' : 'var(--text-secondary)'
          }}>
          📋 Data Purchase Order
        </button>
        <button 
          onClick={() => setActiveTab('SUPPLIER')}
          style={{ padding: '10px 24px', borderRadius: '99px', border: 'none', fontWeight: 600, cursor: 'pointer',
            background: activeTab === 'SUPPLIER' ? 'var(--primary)' : 'var(--bg)', 
            color: activeTab === 'SUPPLIER' ? '#fff' : 'var(--text-secondary)'
          }}>
          🏢 Data Supplier
        </button>
      </div>

      {activeTab === 'SUPPLIER' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>Daftar Supplier</h3>
            <button onClick={() => { setSupplierForm({ id: null, name: '', contact: '', address: '' }); setShowSupplierModal(true); }} className="btn-primary">
              + Tambah Supplier
            </button>
          </div>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nama Supplier</th>
                <th>Kontak</th>
                <th>Alamat</th>
                <th style={{ width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.contact}</td>
                  <td>{s.address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEditSupplier(s)} style={{ padding: '6px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => handleDeleteSupplier(s.id)} style={{ padding: '6px', background: '#ffe4e6', color: '#be123c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data supplier.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'PO' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>Riwayat Purchase Order</h3>
            <button onClick={() => { setPoForm({ supplierId: '', location: locations[0]?.name || '', items: [] }); setShowPOModal(true); }} className="btn-primary">
              + Buat PO Baru
            </button>
          </div>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>No PO</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Total Item</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => {
                const supp = suppliers.find(s => s.id === Number(po.supplierId));
                return (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 700 }}>{po.poNumber}</td>
                    <td>{new Date(po.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>{supp ? supp.name : 'Unknown'}</td>
                    <td>{po.items.length} Macam</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: po.status === 'Pending' ? '#fef9c3' : po.status === 'Diterima' ? '#dcfce7' : '#fee2e2',
                        color: po.status === 'Pending' ? '#854d0e' : po.status === 'Diterima' ? '#166534' : '#991b1b'
                      }}>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => printPO(po)} title="Cetak PO" style={{ padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>🖨️ Cetak</button>
                        {po.status === 'Pending' && (
                          <>
                            <button onClick={() => openReceiveModal(po)} title="Terima Barang" style={{ padding: '6px 12px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>📥 Terima</button>
                            <button onClick={() => cancelPO(po.id)} title="Batalkan PO" style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>❌ Batal</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pos.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Belum ada riwayat PO.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL SUPPLIER --- */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>{supplierForm.id ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
            <form onSubmit={handleSaveSupplier}>
              <div className="form-group">
                <label className="form-label">Nama Supplier</label>
                <input className="form-control" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Kontak (HP/Telp)</label>
                <input className="form-control" required value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat</label>
                <textarea className="form-control" rows="3" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSupplierModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BUAT PO --- */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Buat Purchase Order Baru</h3>
            <form onSubmit={handleSavePO}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pilih Supplier</label>
                  <select className="form-control" required value={poForm.supplierId} onChange={e => setPoForm({...poForm, supplierId: e.target.value})}>
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasi Penerimaan</label>
                  <select className="form-control" required value={poForm.location} onChange={e => setPoForm({...poForm, location: e.target.value})}>
                    <option value="">-- Pilih Gudang/Lokasi --</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Daftar Barang (Item)</label>
                  <button type="button" onClick={handleAddPoItem} style={{ padding: '4px 8px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Tambah Item</button>
                </div>
                
                {poForm.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 2 }}>
                      <select className="form-control" required value={item.bahanId} onChange={e => {
                        if (e.target.value === 'NEW') {
                          setShowQuickBahan(true);
                        } else {
                          updatePoItem(i, 'bahanId', e.target.value);
                        }
                      }}>
                        <option value="">- Bahan Baku -</option>
                        {bahanList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.unit})</option>)}
                        <option value="NEW" style={{ fontWeight: 800, color: 'var(--primary)' }}>✨ + Tambah Barang Baru</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" min="1" placeholder="Qty" className="form-control" required value={item.qty} onChange={e => updatePoItem(i, 'qty', e.target.value)} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <input type="number" min="0" placeholder="Harga Satuan" className="form-control" required value={item.price} onChange={e => updatePoItem(i, 'price', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removePoItem(i)} style={{ padding: '10px', background: '#ffe4e6', color: '#be123c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✖</button>
                  </div>
                ))}
                {poForm.items.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Belum ada item. Silakan tambah item.</p>}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPOModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Simpan PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TERIMA PO --- */}
      {showReceiveModal && receiveForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Terima Barang - {receiveForm.poNumber}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Sesuaikan kuantitas aktual yang diterima. Stok bahan baku akan otomatis bertambah sesuai jumlah di bawah ini.
            </p>
            <form onSubmit={submitReceivePO}>
              <table className="table" style={{ width: '100%', marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>Bahan Baku</th>
                    <th>Qty Pesan</th>
                    <th style={{ width: '120px' }}>Qty Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {receiveForm.items.map((item, i) => {
                    const b = bahanList.find(x => x.id === Number(item.bahanId));
                    return (
                      <tr key={i}>
                        <td>{b ? b.name : 'Unknown'} ({b ? b.unit : '-'})</td>
                        <td style={{ textAlign: 'center' }}>{item.qty}</td>
                        <td>
                          <input type="number" min="0" required className="form-control" value={item.receivedQty} onChange={e => handleReceiveUpdateQty(i, e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReceiveModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: '#166534' }}>✅ Konfirmasi Diterima</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QUICK ADD BAHAN --- */}
      {showQuickBahan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ marginBottom: '4px' }}>✨ Tambah Barang Baru</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Buat master data barang baru secara cepat.</p>
            <form onSubmit={handleQuickSaveBahan}>
              <div className="form-group">
                <label className="form-label">Nama Barang</label>
                <input className="form-control" required value={quickBahanForm.name} onChange={e => setQuickBahanForm({...quickBahanForm, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <input className="form-control" required placeholder="cth: Sirup" value={quickBahanForm.category} onChange={e => setQuickBahanForm({...quickBahanForm, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan</label>
                  <input className="form-control" required placeholder="cth: Liter" value={quickBahanForm.unit} onChange={e => setQuickBahanForm({...quickBahanForm, unit: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowQuickBahan(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Simpan Barang</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
