const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://kuliner-web-project.vercel.app/api';

export const api = API_URL; // Tambahkan ini agar cocok dengan KDSPage dll
export default API_URL;
