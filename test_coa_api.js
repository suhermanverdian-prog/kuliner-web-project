async function testApi() {
  console.log("=== 🔍 TESTING COA API ENDPOINT (FETCH) ===");
  try {
    const res = await fetch('http://localhost:3001/api/accounting/accounts', {
      headers: {
        'x-tenant-id': 'fba884db-967a-4e9f-bad8-79211f6b2cc6'
      }
    });
    console.log("✅ API Status:", res.status);
    const data = await res.json();
    console.log("✅ Accounts Loaded:", data?.length);
    console.log("First Account:", data?.[0]);
  } catch (err) {
    console.error("❌ API Failed:", err.message);
  }
}

testApi();
