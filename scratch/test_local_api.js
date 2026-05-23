const fetch = require('node-fetch');

async function test() {
    console.log('--- LOCAL API AUDIT ---');
    console.log('Testing http://localhost:3001/api/health...');
    try {
        const res = await fetch('http://localhost:3001/api/health');
        const data = await res.json();
        console.log('Health:', data);
    } catch (e) { console.log('Health failed:', e.message); }

    console.log('\nTesting POST http://localhost:3001/api/v1/system/settings...');
    try {
        const res = await fetch('http://localhost:3001/api/v1/system/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        console.log('Status:', res.status);
        if (res.status === 404) {
            const text = await res.text();
            console.log('404 Body:', text);
        }
    } catch (e) { console.log('POST failed:', e.message); }
}

test();
