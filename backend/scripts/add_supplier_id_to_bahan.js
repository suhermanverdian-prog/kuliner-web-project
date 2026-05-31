require('dotenv').config();
const { Pool } = require('pg');

/**
 * Adds a nullable integer `supplier_id` column to the `bahan` table.
 * The column references `suppliers(id)` if a foreign‑key constraint is desired.
 */
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Add column (if it does not already exist)
    await pool.query(`
      ALTER TABLE bahan
      ADD COLUMN IF NOT EXISTS supplier_id INTEGER;
    `);

    // 2. OPTIONAL: add foreign‑key constraint (uncomment if desired)
    // await pool.query(`
    //   ALTER TABLE bahan
    //   ADD CONSTRAINT fk_bahan_supplier
    //   FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    //   ON DELETE SET NULL;
    // `);

    console.log('✅ supplier_id column added to `bahan` table.');
  } catch (e) {
    console.error('❌ Error adding supplier_id column:', e);
  } finally {
    await pool.end();
  }
}

run();
