import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
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

      branding: {
        logo: '/logo-ken.webp',
        storeName: 'BrewMaster Node',
      },
      setBranding: (branding) => set((state) => ({ 
        branding: { ...state.branding, ...branding } 
      })),

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
