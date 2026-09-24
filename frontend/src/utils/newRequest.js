import axios from 'axios';

const newRequest = axios.create({
  baseURL: import.meta.env.VITE_API || 'http://localhost:8000',
  withCredentials: true,  // This keeps cookies in requests
});

newRequest.interceptors.request.use((config) => {
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
  const token = cookieToken || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default newRequest;
