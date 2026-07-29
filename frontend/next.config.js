/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Vercel
  images: {
    domains: ['your-supabase-project.supabase.co'], // Replace with your Supabase domain
  },
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material', 'lucide-react'],
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Reduce bundle size
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
};

module.exports = nextConfig;
