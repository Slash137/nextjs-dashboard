import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Necesario para Docker
  experimental: {
    externalDir: true // Para monorepos o configuraciones complejas
  },
  eslint: {
    ignoreDuringBuilds: true // Opcional para desarrollo
  }
};

export default nextConfig;
