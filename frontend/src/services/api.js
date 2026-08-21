import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Attach the operator PIN (stored after the PIN-entry screen) to every
// request. The backend's requirePin middleware checks this header.
api.interceptors.request.use((config) => {
  const pin = sessionStorage.getItem('cablesync_pin');
  if (pin) config.headers['x-operator-pin'] = pin;
  return config;
});

// If the PIN is wrong/missing, bounce back to the PIN screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('cablesync_pin');
      window.location.href = '/pin';
    }
    return Promise.reject(error);
  }
);

export default api;
