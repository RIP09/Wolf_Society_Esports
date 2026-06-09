import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      port: 3000,
      host: '0.0.0.0'
    },
  };
});
