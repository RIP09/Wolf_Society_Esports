'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00F0FF' },
    secondary: { main: '#FF0055' },
    background: { default: '#0B0F19', paper: '#111827' },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <ToastContainer position="bottom-right" theme="dark" />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
