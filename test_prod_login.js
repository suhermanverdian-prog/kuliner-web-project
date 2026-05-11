const https = require('https');

const data = JSON.stringify({
    username: 'superadmin',
    password: 'admin123',
    role: 'superadmin'
});

const options = {
    hostname: 'kuliner-web-project.vercel.app',
    port: 443,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
