import { useState } from 'react';
import GuestMenuPage from './GuestMenuPage';

export default function CustomerPortalPage({ user, onLogout }) {
  const [view, setView] = useState('menu'); // 'menu' | 'profile'

  if (view === 'menu') {
    return (
      <div>
        {/* Member Info Bar */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          padding: '0 20px', position: 'sticky', top: 0, zIndex: 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--accent)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff',
                flexShrink: 0
              }}>{user.avatar || user.name[0]}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{user.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>⭐ {user.points || 0} Poin Member</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setView('profile')} style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
              }}>📜 Profil & Riwayat</button>
              <button onClick={onLogout} style={{
                background: 'transparent', color: 'rgba(255,255,255,0.6)',
                border: 'none', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
              }}>🚪 Keluar</button>
            </div>
          </div>
        </div>
        {/* Gunakan GuestMenuPage sebagai halaman pemesanan, dengan user sudah login */}
        <GuestMenuPage user={user} />
      </div>
    );
  }

  // ── Profile & Riwayat ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
        padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <button onClick={() => setView('menu')} style={{
            background: 'none', border: 'none', color: '#fff', fontWeight: 700,
            cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px'
          }}>← Kembali ke Menu</button>
          <button onClick={onLogout} style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontWeight: 600,
            fontSize: '0.8rem', cursor: 'pointer'
          }}>🚪 Keluar</button>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Profile Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '24px', color: '#fff',
          display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0
          }}>{user.avatar || user.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>{user.name}</div>
            <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '2px' }}>{user.phone || user.email}</div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{user.points || 0}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Poin</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>2</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Voucher</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>⭐</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Member</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pesan Sekarang */}
        <button onClick={() => setView('menu')} style={{
          width: '100%', padding: '14px',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(111,78,55,0.3)'
        }}>☕ Pesan Menu Sekarang</button>

        {/* Info Poin */}
        <div style={{
          background: '#fff', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', padding: '20px', marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '12px' }}>⭐ Program Reward</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>• Setiap Rp 10.000 pembelian = 1 poin</div>
            <div>• 100 poin = diskon Rp 10.000</div>
            <div>• Poin berlaku selama 1 tahun</div>
          </div>
          <div style={{ marginTop: '16px', background: 'var(--bg)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Poin dapat ditukar</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{user.points || 0} poin</span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: '99px', height: '6px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent)', height: '100%', width: `${Math.min(((user.points || 0) / 100) * 100, 100)}%`, borderRadius: '99px' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {Math.max(0, 100 - (user.points || 0))} poin lagi untuk voucher diskon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
