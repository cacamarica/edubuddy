
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { fixStudentProfilesMappings } from './utils/databaseMigration';

// Run database migrations early
try {
  // We'll run this asynchronously without blocking rendering
  fixStudentProfilesMappings().catch(error => {
    console.error("Failed to run database migrations:", error);
  });
} catch (error) {
  console.error("Error initializing database migrations:", error);
}

// Use a try-catch block to handle potential errors during initialization
try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  ReactDOM.createRoot(rootElement).render(
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
        <LanguageProvider>
          <AuthProvider>
            <App />
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Render a minimal error page if the main app fails to initialize
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; height: 100vh; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center;">
        <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold; color: #dc2626;">Critical Application Error</h2>
        <p style="margin-bottom: 1rem;">The application failed to initialize. Please try refreshing the page.</p>
        <button 
          style="background-color: #7e22ce; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem;"
          onclick="window.location.reload();"
        >
          Reload Page
        </button>
      </div>
    `;
  }
}
