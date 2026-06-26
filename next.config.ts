import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/proxy/**',
      },
      {
        pathname: '/uploads/**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/drive-direct/:id',
        destination: `https://www.googleapis.com/drive/v3/files/:id?alt=media&key=${process.env.GOOGLE_DRIVE_API_KEY}&acknowledgeAbuse=true`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
