const axios = require('axios');

async function testInventory() {
  try {
    console.log('Testing GET /api/inventory...');
    const res = await axios.get('http://localhost:3001/api/inventory');
    console.log('Success:', res.data.length, 'items found.');
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
}

testInventory();
