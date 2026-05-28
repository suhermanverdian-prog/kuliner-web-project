async function testJournals() {
  console.log("=== 🔍 TESTING JOURNALS API ENDPOINT (FETCH) ===");
  try {
    const res = await fetch('http://localhost:3001/api/accounting/journals', {
      headers: {
        'x-tenant-id': 'fba884db-967a-4e9f-bad8-79211f6b2cc6'
      }
    });
    console.log("✅ API Status:", res.status);
    const data = await res.json();
    console.log("✅ Journals Loaded:", data?.length);
    if (data?.length > 0) {
      console.log("First Journal:", data[0]);
    } else {
      console.log("Response data:", data);
    }
  } catch (err) {
    console.error("❌ API Failed:", err.message);
  }
}

testJournals();
