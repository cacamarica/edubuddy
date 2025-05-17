
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
        <p className="mb-4">The application encountered an unexpected error.</p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Reload Page
        </button>
      </div>
    }>
      <AuthProvider>
        <LanguageProvider>
          <App />
          <Toaster position="bottom-right" richColors />
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
