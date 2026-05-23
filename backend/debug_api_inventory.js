const axios = require('axios');

async function debugInventory() {
  try {
    console.log('--- 🔍 DEBUG API: GET /api/inventory ---');
    // We simulate a request with no token to trigger the bypass in permissionGuard
    const res = await axios.get('http://localhost:3001/api/inventory');
    console.log('Status:', res.status);
    console.log('Data Length:', res.data.length);
    console.log('Data Sample:', JSON.stringify(res.data[0], null, 2));
  } catch (err) {
    console.error('❌ API Error:', err.response?.status, err.response?.data);
  }
}

debugInventory();
