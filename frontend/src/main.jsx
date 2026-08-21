import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

// Belt-and-braces: also apply the saved theme here in case the inline
// bootstrap script in index.html didn't run in time (e.g. cached HTML).
try {
  if (localStorage.getItem('cablesync_theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
} catch (e) {}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
