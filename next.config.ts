import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

// Build/version identifier for cache versioning
const buildId = process.env.COMMIT_REF || process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`;
const isDev = process.env.NODE_ENV !== 'production';
const disablePWA = isDev || process.env.NEXT_DISABLE_PWA === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9002',
        '*.app.github.dev',
        '*.githubpreview.dev'
      ],
    },
  },
  // Provide a consistent build id for cache versioning
  generateBuildId: async () => buildId,
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, must-revalidate',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  register: false, // manual registration component
  skipWaiting: true,
  clientsClaim: true,
  // Disable in dev or via env kill-switch
  disable: disablePWA,
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
  runtimeCaching: [
    {
      // Next.js build assets
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static/'),
      handler: 'CacheFirst',
      options: {
        cacheName: `static-assets-${buildId}`,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // App icons (immutable)
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/icons/'),
      handler: 'CacheFirst',
      options: {
        cacheName: `app-icons-${buildId}`,
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      // External images used by the app
      urlPattern: ({ url }: { url: URL }) => ['images.unsplash.com', 'picsum.photos', 'placehold.co'].includes(url.hostname),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: `remote-images-${buildId}`,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
})(nextConfig);
