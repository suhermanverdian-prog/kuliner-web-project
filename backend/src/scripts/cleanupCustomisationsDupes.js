const { supabase } = require('../supabase');

(async () => {
  try {
    console.log('🔧 Starting duplicate customisation cleanup');
    // Find duplicates: same tenant_id, outlet_id, key, keep the latest (by updated_at)
    const { data: dupes, error: fetchErr } = await supabase
      .from('customisations')
      .select('id, tenant_id, outlet_id, key, updated_at')
      .order('updated_at', { ascending: false });
    if (fetchErr) throw fetchErr;
    // Group by tenant_id/outlet_id/key
    const groups = {};
    dupes.forEach(row => {
      const outlet = row.outlet_id || 'null';
      const key = `${row.tenant_id}|${outlet}|${row.key}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    let totalDeleted = 0;
    for (const groupKey in groups) {
      const rows = groups[groupKey];
      if (rows.length > 1) {
        // Keep first (most recent) and delete others
        const toDelete = rows.slice(1).map(r => r.id);
        const { error: delErr } = await supabase
          .from('customisations')
          .delete()
          .in('id', toDelete);
        if (delErr) throw delErr;
        totalDeleted += toDelete.length;
        console.log(`🗑️ Deleted ${toDelete.length} duplicate(s) for ${groupKey}`);
      }
    }
    console.log(`✅ Cleanup completed. Total duplicates removed: ${totalDeleted}`);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
})();
