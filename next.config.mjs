/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We disable linting and type checking during the production build step
  // to prevent compilation errors from legacy Vite configurations or warning lints.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
    cpus: 1,
  },
  async redirects() {
    return [
      {
        source: '/tools/currency-calculator',
        destination: '/tools/currency-converter',
        permanent: true,
      },
      {
        source: '/tools/experience',
        destination: '/experience',
        permanent: true,
      },
      {
        source: '/docs/widgets-integration',
        destination: '/docs',
        permanent: true,
      },
      {
        source: '/developers/currency',
        destination: '/developers',
        permanent: true,
      },
      {
        source: '/legal/privacy',
        destination: '/legal/privacy-policy',
        permanent: true,
      },
      {
        source: '/legal/terms',
        destination: '/legal/terms-and-conditions',
        permanent: true,
      },
      {
        source: '/legal/cookies',
        destination: '/legal/cookies-policy',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://bishal-mishra-3c559.firebaseapp.com/__/auth/:path*',
      },
      {
        // Redirect /sitemap.xml to the API route which dynamically generates it
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply cache headers to blog post pages so Google can crawl them
        source: '/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400',
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

