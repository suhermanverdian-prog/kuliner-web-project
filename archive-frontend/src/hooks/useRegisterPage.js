import { useState } from 'react';
import { api } from '../api';

export function useRegisterPage(onSuccess) {
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
      onSuccess({ ...newCustomer, role: 'customer' });
    } catch (err) {
      setError('Gagal mendaftar. Data mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return {
    form, setForm,
    loading,
    error, setError,
    handleSubmit
  };
}
