/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // Enable modern JavaScript output
    esmExternals: true,
    // Optimize server components
    serverComponentsExternalPackages: [],
    // Enable optimized package imports
    optimizePackageImports: ["lucide-react"],
  },

  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
          // Separate UI library chunks
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@headlessui)[\\/]/,
            name: "ui-lib",
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common chunks
          common: {
            name: "common",
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Add bundle analyzer in development
      if (dev && process.env.ANALYZE === "true") {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "server",
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }

    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any necessary aliases for performance
    };

    return config;
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // Performance headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/((?!api/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      // Static assets caching
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects and rewrites for performance
  async rewrites() {
    return [
      // API proxy for development
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              source: "/api/:path*",
              destination: `${
                process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
              }/api/:path*`,
            },
          ]
        : []),
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: "my-value",
  },

  // Build optimization
  compiler: {
    // Remove console.log in production builds
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },

  // Output configuration
  output: "standalone",

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable strict mode
  reactStrictMode: true,

  // SWC minification (faster than Terser)
  swcMinify: true,

  // Trailing slash handling
  trailingSlash: false,

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by CI/CD
    ignoreBuildErrors: false,
  },
};

// Performance monitoring in development
if (process.env.NODE_ENV === "development") {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // Enable performance profiling
    profiling: true,
    // Enable React profiler
    reactProfiler: true,
  };
}

module.exports = nextConfig;
