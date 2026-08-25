import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization — add domains as needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
    ],
  },

  // Redirect /dashboard → /organizer for legacy URLs
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/organizer',
        permanent: false,
      },
    ];
  },

  // Prevent private routes from being indexed
  async headers() {
    return [
      {
        source: '/organizer/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/photographer/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/e/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/gallery/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  // Workspace package transpilation
  transpilePackages: ['@lensrecall/shared'],

  // External packages for server components
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
