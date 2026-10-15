import type { NextConfig } from "next";

// The API client uses relative /api/v1 paths when NEXT_PUBLIC_API_URL is unset.
// Vercel routes those itself (vercel.json); everywhere else this proxies them to the backend.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` }];
  },
};

export default nextConfig;
