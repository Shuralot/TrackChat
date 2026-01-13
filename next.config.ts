import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // O Next.js não expande variáveis como ${DOMAIN} automaticamente no config
  // Por isso, usamos process.env diretamente.
  env: {
    // Garante que o frontend saiba onde se conectar
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.DOMAIN || 'aiatende.com',
        pathname: '/**',
      },
      // Caso o Chatwoot envie imagens de domínios externos (ex: avatares do Gravatar)
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        pathname: '/**',
      },
    ],
  },

  // Configuração de Headers para evitar problemas de CORS com o Socket
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;