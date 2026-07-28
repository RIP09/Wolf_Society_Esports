'use client';

import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { StoreProvider } from './StoreProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }) {
  return (
    <StoreProvider>
      <QueryProvider>
        <ThemeProvider>
          {children}
          <ToastContainer position="bottom-right" theme="dark" />
        </ThemeProvider>
      </QueryProvider>
    </StoreProvider>
  );
}
