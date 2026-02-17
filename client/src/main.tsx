import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Use the same base path as Vite so SW is found in production
      const base = import.meta.env.BASE_URL || '/';
      const reg = await navigator.serviceWorker.register(base + 'sw.js');
      console.log('SW registered, scope:', reg.scope);
    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}
