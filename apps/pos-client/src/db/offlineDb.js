import Dexie from 'dexie';

export const db = new Dexie('pos_offline_db');

db.version(1).stores({
  offline_transactions: '++id, tenant_id, customer_name, total, payment_method, is_synced',
  cached_menu: 'id, name, base_price, category'
});
