import { useState, useEffect } from 'react';
import api from '../api';
import { supabase } from '../supabaseClient';

export function useCustomerPortalPage(user) {
  // UI navigation view
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'menu' | 'profile' | 'history' | 'promo'

  // Loyalty data
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(user?.points || 0);
  const [visits, setVisits] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [tier, setTier] = useState('Guest');
  const [nextTier, setNextTier] = useState('Member');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [history, setHistory] = useState([]);
  const [promos, setPromos] = useState([]);
  const [error, setError] = useState(null);

  // Profile state (editable fields)
  const [profileState, setProfileState] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    newPhone: '', // for OTP change
    otpCode: '',
    isOtpSent: false,
    avatarUrl: user?.avatar || '',
  });

  // ----- Helper: fetch loyalty data & promos -----
  useEffect(() => {
    if (!user) return;
    const fetchPortalData = async () => {
      setLoading(true);
      try {
        const identifier = user.phone || user.username || user.email;
        // Fetch loyalty data
        const res = await api.request(
          `${api.url}/loyalty/me?phone=${encodeURIComponent(identifier)}`,
          'GET'
        );
        if (res) {
          setPoints(res.points ?? user.points ?? 0);
          setVisits(res.total_visits ?? 0);
          setTotalSpend(res.total_spend ?? 0);
          setTier(res.tier ?? 'Guest');
          setNextTier(res.next_tier ?? 'Member');
          setProgressPercent(res.progress_percent ?? 0);
          setProgressLabel(res.progress_label ?? '');
          setHistory(res.history ?? []);
        }

        // Fetch active promos
        const promoRes = await api.request(`${api.url}/promo-codes`, 'GET');
        if (Array.isArray(promoRes)) {
          // Get used promos from localStorage
          const usedKey = `used_promos_${user.id || 'default'}`;
          const usedPromos = JSON.parse(localStorage.getItem(usedKey) || '[]');
          
          // Filter out used/expired promos
          const activeAndUnused = promoRes.filter(p => {
            const isUnused = !usedPromos.includes(p.code);
            const isNotExpired = p.expires_at ? new Date(p.expires_at) > new Date() : true;
            return p.is_active && isUnused && isNotExpired;
          });
          setPromos(activeAndUnused);
        }
      } catch (err) {
        console.error('Failed to fetch loyalty or promo data:', err);
        setError('Gagal memuat data. Menggunakan data lokal.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [user]);

  // ----- Claim/Use Promo -----
  const handleClaimPromo = async (promoCode) => {
    try {
      // Add to used list in localStorage
      const usedKey = `used_promos_${user.id || 'default'}`;
      const usedPromos = JSON.parse(localStorage.getItem(usedKey) || '[]');
      if (!usedPromos.includes(promoCode)) {
        usedPromos.push(promoCode);
        localStorage.setItem(usedKey, JSON.stringify(usedPromos));
      }
      
      // Update local state to hide the claimed promo
      setPromos(prev => prev.filter(p => p.code !== promoCode));
    } catch (e) {
      console.error('Failed to claim promo:', e);
      setError('Gagal menukarkan promo');
    }
  };

  // ----- Avatar upload via Supabase Storage -----
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      setError('Gagal mengunggah foto profil');
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicURL = urlData?.publicUrl;
    setProfileState((prev) => ({ ...prev, avatarUrl: publicURL }));

    // Persist avatar URL to backend
    try {
      await api.request(`${api.url}/users/${user.id}/avatar`, 'PUT', { avatar: publicURL });
    } catch (e) {
      console.error('Failed to persist avatar URL:', e);
    }
  };

  // ----- OTP flow -----
  const handleSendOtp = async () => {
    const targetPhone = profileState.newPhone || profileState.phone;
    if (!targetPhone) {
      setError('Nomor HP diperlukan untuk mengirim OTP');
      return;
    }
    try {
      await api.request(`${api.url}/auth/otp/send`, 'POST', { phone: targetPhone });
      setProfileState((prev) => ({ ...prev, isOtpSent: true }));
    } catch (e) {
      console.error('Send OTP failed:', e);
      setError('Gagal mengirim OTP');
    }
  };

  const handleVerifyOtp = async () => {
    const { otpCode, newPhone } = profileState;
    if (!otpCode) {
      setError('Masukkan kode OTP');
      return;
    }
    try {
      const res = await api.request(`${api.url}/auth/otp/verify`, 'POST', {
        phone: newPhone,
        code: otpCode,
      });
      if (res?.verified) {
        setProfileState((prev) => ({ ...prev, phone: newPhone, isOtpSent: false, otpCode: '' }));
        await api.request(`${api.url}/users/${user.id}`, 'PUT', { phone: newPhone });
      } else {
        setError('Kode OTP tidak valid');
      }
    } catch (e) {
      console.error('Verify OTP error:', e);
      setError('Verifikasi OTP gagal');
    }
  };

  // ----- Save profile (name, avatar) -----
  const handleSaveProfile = async () => {
    const { name, avatarUrl } = profileState;
    try {
      await api.request(`${api.url}/users/${user.id}`, 'PUT', { name, avatar: avatarUrl });
    } catch (e) {
      console.error('Save profile error:', e);
      setError('Gagal menyimpan profil');
    }
  };

  // ----- Reorder -----
  const handleReorder = async (orderId) => {
    try {
      const order = await api.request(`${api.url}/orders/${orderId}`, 'GET');
      if (order && order.items) {
        await api.request(`${api.url}/cart/add-multiple`, 'POST', { items: order.items });
      }
    } catch (e) {
      console.error('Reorder failed:', e);
      setError('Gagal melakukan reorder');
    }
  };

  return {
    view,
    setView,
    loading,
    points,
    visits,
    totalSpend,
    tier,
    nextTier,
    progressPercent,
    progressLabel,
    history,
    promos,
    error,
    profileState,
    setProfileState,
    handleAvatarUpload,
    handleSendOtp,
    handleVerifyOtp,
    handleSaveProfile,
    handleReorder,
    handleClaimPromo,
  };
}
