const http = require('http');

async function testInventory() {
    console.log('--- INVENTORY PREDICTION AUDIT ---');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/inventory/predictions',
        method: 'GET',
        headers: {
            'x-tenant-id': '52fbacf9-4028-4f03-9de5-5754e5842458' // Sample tenant
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                console.log('Body:', JSON.stringify(json, null, 2).slice(0, 500) + '...');
            } catch (e) {
                console.log('Raw Body:', data.slice(0, 200));
            }
        });
    });

    req.on('error', (e) => console.error('Error:', e.message));
    req.end();
}

testInventory();
