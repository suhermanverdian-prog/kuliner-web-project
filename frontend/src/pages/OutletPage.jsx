import React, { useState, useEffect } from 'react';
import { 
  Store, Plus, MapPin, Phone, Edit2, Trash2, 
  ArrowRight, Globe, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import api from '../api';

const OutletPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const data = await api.getOutlets();
      setOutlets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await api.updateOutlet({ ...formData, id: editingOutlet.id });
      } else {
        await api.addOutlet(formData);
      }
      setShowModal(false);
      setEditingOutlet(null);
      setFormData({ name: '', address: '', phone: '', is_active: true });
      fetchOutlets();
    } catch (err) {
      alert('Gagal menyimpan data outlet');
    }
  };

  const handleEdit = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      address: outlet.address || '',
      phone: outlet.phone || '',
      is_active: outlet.is_active
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="w-8 h-8 text-indigo-600" />
            Manajemen Cabang (Multi-Outlet)
          </h1>
          <p className="text-gray-500">Kelola dan pantau performa seluruh outlet Anda dari satu dashboard pusat.</p>
        </div>
        <button 
          onClick={() => { setEditingOutlet(null); setFormData({ name: '', address: '', phone: '', is_active: true }); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Cabang Baru
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Store className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Cabang</p>
            <h3 className="text-xl font-bold text-gray-800">{outlets.length} Outlet</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Aktif</p>
            <h3 className="text-xl font-bold text-gray-800">{outlets.filter(o => o.is_active).length} Cabang</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Kapasitas SaaS</p>
            <h3 className="text-xl font-bold text-gray-800 text-blue-600">Enterprise Mode</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 text-gray-400">Memuat data cabang...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {outlets.map(outlet => (
            <div key={outlet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{outlet.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${outlet.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(outlet)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 border-t border-gray-50 pt-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{outlet.address || 'Alamat belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{outlet.phone || '-'}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-white border border-indigo-100 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Lihat Laporan
                  </button>
                  <button className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4" />
                    Kelola POS
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingOutlet ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-full"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Cabang</label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: BrewMaster Coffee - Sudirman"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea 
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap cabang..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon / WhatsApp</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812..."
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" id="is_active"
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Cabang Aktif / Beroperasi</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg"
                >
                  {editingOutlet ? 'Update Cabang' : 'Simpan Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletPage;
