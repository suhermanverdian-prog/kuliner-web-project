import { useState, useEffect } from 'react';
import { api } from '../api';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.getTenants();
      setTenants(res);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      await api.updateTenant({ id: tenant.id, is_active: !tenant.is_active });
      fetchTenants();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const changeTier = async (tenant, newTier) => {
    try {
      await api.updateTenant({ id: tenant.id, tier: newTier });
      fetchTenants();
    } catch (err) {
      alert('Gagal update tier');
    }
  };

  const toggleFeature = async (tenant, featureKey) => {
    try {
      const currentFeatures = tenant.features || {};
      const newFeatures = { ...currentFeatures, [featureKey]: !currentFeatures[featureKey] };
      await api.updateTenant({ id: tenant.id, features: newFeatures });
      fetchTenants();
    } catch (err) {
      alert('Gagal update fitur');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>🛡️ SuperAdmin Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manajemen Platform SaaS BrewMaster</p>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Daftar Client (Tenants)</h3>
        {loading ? (
          <p>Memuat data...</p>
        ) : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nama Bisnis</th>
                <th>Paket / Tier</th>
                <th>Fitur Metode Pembayaran</th>
                <th>Status</th>
                <th>Tgl Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700 }}>{t.name}</td>
                  <td>
                    <select 
                      value={t.tier} 
                      onChange={(e) => changeTier(t, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="lite">Lite</option>
                      <option value="pro">Pro</option>
                      <option value="franchise">Franchise</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {['QRIS', 'Debit', 'Transfer', 'Hutang', 'Points'].map(m => {
                        const key = `allow_${m.toLowerCase()}`;
                        return (
                          <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input 
                              type="checkbox" 
                              checked={t.features?.[key] === true} 
                              onChange={() => toggleFeature(t, key)} 
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            {m}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {t.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(t)}
                      className={t.is_active ? 'btn-danger' : 'btn-primary'}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {t.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '20px', background: '#F0F9FF', border: 'none' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🚀</div>
          <h4>Total Tenant</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tenants.length}</div>
        </div>
        <div className="card" style={{ padding: '20px', background: '#F0FDF4', border: 'none' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💰</div>
          <h4>Tenant Pro</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tenants.filter(t => t.tier === 'pro').length}</div>
        </div>
        <div className="card" style={{ padding: '20px', background: '#FEF2F2', border: 'none' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
          <h4>Expired</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>0</div>
        </div>
      </div>
    </div>
  );
}
