const axios = require('axios');

async function debugSuppliers() {
  try {
    console.log('--- 🔍 DEBUG API: GET /api/p/suppliers ---');
    const res = await axios.get('http://localhost:3001/api/p/suppliers');
    console.log('Status:', res.status);
    console.log('Data Length:', res.data.length);
    if (res.data.length > 0) console.log('First Supplier:', res.data[0].name);
  } catch (err) {
    console.error('❌ API Error:', err.response?.status, err.response?.data);
  }
}

debugSuppliers();
