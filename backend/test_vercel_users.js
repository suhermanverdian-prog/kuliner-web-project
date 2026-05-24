const https = require('https');

async function testVercelUsers() {
  const loginData = JSON.stringify({ username: 'superadmin', password: 'admin123' });

  const loginReq = https.request({
    hostname: 'kuliner-web-project.vercel.app',
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const { token } = JSON.parse(body);
      if (!token) return console.log('Login failed:', body);

      const usersReq = https.request({
        hostname: 'kuliner-web-project.vercel.app',
        path: '/api/users',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res2) => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log('Users:', body2);
        });
      });
      usersReq.end();
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

testVercelUsers();
