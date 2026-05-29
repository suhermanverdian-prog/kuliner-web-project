const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function checkSchema() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL; 
  // Let's check typical env names or fall back to parsing SUPABASE_URL if possible. Wait, Supabase projects usually provide connection strings in env.
  // Actually, let's just log process.env to find the DB url first, but let's assume DATABASE_URL exists.
  
  if (!connectionString) {
    console.log("No DATABASE_URL found. Will try to query via Supabase RPC if we can't connect.");
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const res = await client.query(tablesQuery);
    console.log("=== TABLES IN PUBLIC SCHEMA ===");
    
    for (const row of res.rows) {
      const tableName = row.table_name;
      console.log(`\nTable: ${tableName}`);
      
      const colsQuery = `
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const colsRes = await client.query(colsQuery, [tableName]);
      colsRes.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) [Nullable: ${col.is_nullable}, Default: ${col.column_default}]`);
      });
    }
  } catch (err) {
    console.error("Error connecting to DB:", err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
