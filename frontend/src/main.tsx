import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initVisibilityTracking } from './lib/pageVisibility';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Initialize visibility tracking for notification suppression
        initVisibilityTracking();
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

