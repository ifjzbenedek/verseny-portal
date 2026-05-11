import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { Toaster } from './shared/components/ui/sonner';
import { queryClient } from './shared/api/queryClient';
import './i18n';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors closeButton position="top-right" />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);
