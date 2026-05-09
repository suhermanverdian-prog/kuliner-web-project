import { useState } from 'react';
import { api } from '../api';

export default function RegisterPage({ onSuccess, onGoLogin }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.password)
      return setError('Nama, nomor HP, dan password wajib diisi!');
    if (form.password.length < 6)
      return setError('Password minimal 6 karakter!');
    if (form.password !== form.confirmPassword)
      return setError('Konfirmasi password tidak cocok!');

    setLoading(true);
    try {
      const newCustomer = await api.addCustomer({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: 'customer',
        avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });
      // Auto-login setelah registrasi
      onSuccess({ ...newCustomer, role: 'customer' });
    } catch (err) {
      setError('Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2C1810 0%, #4A3728 50%, #6F4E37 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(200,146,58,0.1)' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(200,146,58,0.08)' }} />

      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: '28px',
        padding: '44px 40px', width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)', position: 'relative',
        animation: 'slideUp 0.4s ease'
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6F4E37, #C8923A)',
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 8px 24px rgba(111,78,55,0.35)'
          }}>☕</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: '#4A3728', marginBottom: '6px' }}>
            Daftar Member
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Nikmati reward & keuntungan eksklusif member BrewMaster
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">👤 Nama Lengkap *</label>
            <input className="form-control" placeholder="cth: Rina Amelia"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">📱 Nomor WhatsApp *</label>
            <input className="form-control" placeholder="cth: 081234567890" type="tel"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Nomor ini digunakan untuk login dan notifikasi pesanan
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">📧 Email (opsional)</label>
            <input className="form-control" placeholder="cth: rina@gmail.com" type="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">🔒 Password *</label>
              <input className="form-control" type="password" placeholder="Min. 6 karakter"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Konfirmasi *</label>
              <input className="form-control" type="password" placeholder="Ulangi password"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px',
              borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg"
            style={{ justifyContent: 'center', marginBottom: '12px' }}>
            {loading ? '⏳ Mendaftar...' : '🎉 Daftar Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Sudah punya akun?{' '}
            <button onClick={onGoLogin} style={{
              background: 'none', border: 'none', color: 'var(--primary)',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline'
            }}>
              Login di sini
            </button>
          </p>
        </div>

        <div style={{
          marginTop: '20px', padding: '12px', background: 'var(--bg-card)',
          borderRadius: '10px', border: '1px solid var(--border-light)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
            ✨ Keuntungan Member:
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            ⭐ Kumpulkan poin reward setiap pembelian<br />
            🎁 Voucher diskon eksklusif member<br />
            📜 Riwayat pesanan lengkap<br />
            🔔 Notifikasi status pesanan real-time
          </div>
        </div>
      </div>
    </div>
  );
}
