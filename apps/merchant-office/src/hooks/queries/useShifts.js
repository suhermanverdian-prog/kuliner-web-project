import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';

/**
 * Hook untuk mengambil daftar shift aktif (atau semua shift, tergantung backend).
 */
export const useShifts = () => {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const data = await api.getShifts();
      return data;
    },
  });
};

/**
 * Hook untuk membuka shift baru.
 */
export const useAddShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftData) => {
      return await api.addShift(shiftData);
    },
    onSuccess: () => {
      // Invalidate the 'shifts' query to refetch data automatically
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

/**
 * Hook untuk menutup shift yang sedang aktif.
 */
export const useCloseShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await api.closeShift(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
