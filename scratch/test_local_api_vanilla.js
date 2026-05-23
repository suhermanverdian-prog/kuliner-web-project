const http = require('http');

function testRequest(path, method = 'GET', body = null) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`[${method}] ${path} -> Status: ${res.statusCode}`);
                console.log(`Body: ${data.substring(0, 100)}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`[${method}] ${path} -> Error: ${e.message}`);
            resolve();
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log('--- VANILLA API AUDIT ---');
    await testRequest('/api/health');
    await testRequest('/api/v1/system/settings', 'POST', { test: true });
}

run();
