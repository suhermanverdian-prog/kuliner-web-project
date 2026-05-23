import { useState } from 'react';

export function useCustomerPortalPage() {
  const [view, setView] = useState('menu'); // 'menu' | 'profile'

  return {
    view, setView
  };
}
