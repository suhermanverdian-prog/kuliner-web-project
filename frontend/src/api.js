const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://kuliner-web-project.vercel.app/api';

export default API_URL;
