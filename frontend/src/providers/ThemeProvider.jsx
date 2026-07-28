'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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

export function ThemeProvider({ children }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
