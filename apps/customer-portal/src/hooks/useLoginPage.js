import { useState } from 'react';
import { api } from '../api';

export function useLoginPage(onLogin, memberOnly = false) {
  const [selectedRole, setSelectedRole] = useState(memberOnly ? 'customer' : 'staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const staffRoles = [
    { key: 'superadmin', label: 'SuperAdmin', icon: '🛡️' },
    { key: 'owner', label: 'Owner', icon: '👑' },
    { key: 'manager', label: 'Manager', icon: '⚙️' },
    { key: 'accounting', label: 'Accounting', icon: '📊' },
    { key: 'chef', label: 'Chef', icon: '👨‍🍳' },
    { key: 'staff', label: 'Staff', icon: '💰' },
    { key: 'hrd', label: 'HRD', icon: '👥' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Harap isi semua kolom');
    setLoading(true); setError('');
    try {
      // The API now returns { user, tenant, settings, primaryOutlet, token }
      const res = await api.login({ username, password, role: selectedRole });
      onLogin(res);
    } catch (err) {
      setError('Kredensial atau role tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (selectedRole === 'customer') { 
      setUsername('08123456789'); 
      setPassword('user123'); 
    } else { 
      if (selectedRole === 'superadmin') { setUsername('messi'); setPassword('goal10'); }
      else if (selectedRole === 'owner') { setUsername('beckham'); setPassword('owner7'); }
      else if (selectedRole === 'manager') { setUsername('ronaldo'); setPassword('siuuu7'); }
      else if (selectedRole === 'accounting') { setUsername('debruyne'); setPassword('assist17'); }
      else if (selectedRole === 'chef') { setUsername('lewandowski'); setPassword('finisher9'); }
      else if (selectedRole === 'staff') { setUsername('haaland'); setPassword('robot9'); }
      else if (selectedRole === 'hrd') { setUsername('vandijk'); setPassword('wall4'); }
    }
  };

  return {
    selectedRole, setSelectedRole,
    username, setUsername,
    password, setPassword,
    error, setError,
    loading,
    staffRoles,
    handleLogin,
    fillDemo
  };
}
