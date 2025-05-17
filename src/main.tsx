
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

// Remove any references to CloudFlare Insights or similar analytics that might be causing CORS issues
// This is handled in a cleaner way to prevent the CORS errors shown in the screenshot

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
        <Toaster position="bottom-right" richColors />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>,
);
