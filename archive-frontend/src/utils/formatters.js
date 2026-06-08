/**
 * @file formatters.js
 * @description Utilitas pemformatan data terstandarisasi untuk BrewMaster ERP.
 */

/**
 * Memformat angka ke dalam format mata uang Rupiah
 * @param {number} amount - Jumlah angka yang akan diformat
 * @returns {string} - String terformat (contoh: Rp 15.000)
 */
export const formatRupiah = (amount) => {
  const value = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Memformat tanggal ke dalam format lokal Indonesia yang elegan
 * @param {string} dateString - ISO Date string
 * @returns {string} - Tanggal terformat
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
};

/**
 * Memformat angka besar menjadi singkatan (K, M, B)
 * @param {number} num - Angka
 * @returns {string} - Singkatan angka
 */
export const formatCompact = (num) => {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num || 0);
};
