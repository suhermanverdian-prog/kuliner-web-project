import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  total: number;
  // other fields as needed
}

interface ShiftState {
  shifts: Shift[];
  activeShiftId?: string;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  closeShift: (id: string, total: number) => void;
  setActive: (id: string) => void;
}

export const useShiftStore = create<ShiftState>()(
  devtools(
    persist(
      (set, get) => ({
        shifts: [],
        activeShiftId: undefined,
        addShift: (shift) => {
          const id = crypto.randomUUID();
          set((state) => ({
            shifts: [...state.shifts, { ...shift, id }],
            activeShiftId: id,
          }));
        },
        closeShift: (id, total) => {
          set((state) => ({
            shifts: state.shifts.map((s) =>
              s.id === id ? { ...s, endTime: new Date().toISOString(), total } : s
            ),
            activeShiftId: undefined,
          }));
        },
        setActive: (id) => set(() => ({ activeShiftId: id })),
      }),
      {
        name: 'shift-store', // storage key
      }
    )
  )
);
