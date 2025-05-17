
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

// CloudFlare Insights and all other analytics scripts have been removed
// to prevent CORS errors when accessing the application

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
