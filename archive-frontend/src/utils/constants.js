/**
 * @file constants.js
 * @description Konstanta global untuk BrewMaster ERP.
 */

export const MENU_CATEGORIES = [
  'Semua',
  'Coffee',
  'Non-Coffee',
  'Tea',
  'Main Course',
  'Snack',
  'Dessert'
];

export const PAYMENT_METHODS = [
  { id: 'tunai', label: 'Tunai', icon: 'Banknote' },
  { id: 'qris', label: 'QRIS / E-Wallet', icon: 'QrCode' },
  { id: 'transfer', label: 'Transfer Bank Manual', icon: 'Landmark' }
];

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
};
