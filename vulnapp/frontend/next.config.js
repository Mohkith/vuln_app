/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Server-side only (not NEXT_PUBLIC_*), read at request time, not baked
    // into the client bundle at build time. The browser only ever calls
    // this same origin's /api/*; the Next.js server forwards it to the
    // backend container over the internal Docker network.
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
