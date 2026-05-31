const API = 'http://localhost:3001';

async function main() {
  // 1. Login
  const loginR = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'david', password: 'david'})
  });
  const loginData = await loginR.json();
  console.log('Login status:', loginR.status);
  if (!loginData.token) {
    console.log('Login failed:', JSON.stringify(loginData));
    return;
  }
  const token = loginData.token;
  const tenant = loginData.user?.tenant_id;
  console.log('Token: GOT TOKEN, tenant:', tenant, 'role:', loginData.user?.role);

  // 2. Get outlets 
  const outR = await fetch(`${API}/api/system/outlets`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const outlets = await outR.json();
  console.log('Outlets:', outR.status, Array.isArray(outlets) ? outlets.map(o => `${o.id} - ${o.name}`).join(', ') : JSON.stringify(outlets).substring(0,200));

  // 3. Get existing opname sessions
  const sessR = await fetch(`${API}/api/opname`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const sessions = await sessR.json();
  console.log('GET /api/opname:', sessR.status, Array.isArray(sessions) ? `${sessions.length} sessions` : JSON.stringify(sessions).substring(0,200));

  // 4. Try to create a new opname session
  const outletId = Array.isArray(outlets) && outlets.length > 0 ? outlets[0].id : '11111111-1111-1111-1111-111111111111';
  console.log('Using outletId:', outletId);

  const startR = await fetch(`${API}/api/opname`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
    body: JSON.stringify({outletId, type: 'blind'})
  });
  const startData = await startR.json();
  console.log('POST /api/opname:', startR.status, JSON.stringify(startData).substring(0,500));
}

main().catch(e => console.error('FATAL:', e.message));
