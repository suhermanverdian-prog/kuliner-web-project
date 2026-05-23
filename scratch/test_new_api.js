async function test() {
  console.log("Testing POST /api/system-logs...");
  try {
    const res = await fetch('http://localhost:3001/api/system-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Test Agent',
        role: 'superadmin',
        activityType: 'TEST',
        description: 'Verifying backend logs integration'
      })
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response body:", data);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
