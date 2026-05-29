import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up to 50 VUs
    { duration: '30s', target: 50 }, // stay at 50 VUs
    { duration: '10s', target: 0 }, // ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3001/healthz');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
