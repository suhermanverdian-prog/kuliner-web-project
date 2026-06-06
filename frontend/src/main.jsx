import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import './styles/designSystem.css';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://d12d810e0ed1be3ceeb39ce32badf469@o4511436228067328.ingest.us.sentry.io/4511436240650240",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ⚡ [PWA] Register Service Worker for Offline GUI Resilience
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('⚡ [PWA] Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('🚨 [PWA] Service Worker registration failed:', err);
      });
  });
}
