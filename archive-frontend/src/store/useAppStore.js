import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * KEN Enterprise - Global App Store (Zustand)
 * Single Source of Truth untuk state lintas halaman.
 * Menggunakan middleware 'persist' untuk sinkronisasi otomatis ke LocalStorage.
 */
export const useAppStore = create(
  persist(
    (set) => ({
      // --- AUTH STATE ---
      user: null,
      tenant: null,
      settings: null,
      currentOutletId: null,

      setUser: (data) => {
        if (data && data.token && data.user) {
          set({ 
            user: { ...data.user, token: data.token },
            tenant: data.tenant || null,
            settings: data.settings || null,
            currentOutletId: data.primaryOutlet?.id || null
          });
        } else {
          set({ user: data });
        }
      },

      logout: () => set({ 
        user: null, 
        tenant: null,
        settings: null,
        currentOutletId: null 
      }),

      // --- BRANDING & SETTINGS ---
      branding: {
        logo: '/logo-ken.webp',
        storeName: 'KEN Enterprise Node',
      },
      setBranding: (branding) => set((state) => ({ 
        branding: { ...state.branding, ...branding } 
      })),

      // --- OUTLET CONTEXT ---
      setOutlet: (id) => set({ currentOutletId: id }),
    }),
    {
      name: 'ken-enterprise-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tenant: state.tenant,
        settings: state.settings,
        currentOutletId: state.currentOutletId 
      }),
    }
  )
);
