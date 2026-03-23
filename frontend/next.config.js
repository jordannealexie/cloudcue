/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
  ...(isProduction ? { output: process.env.NEXT_OUTPUT || "standalone" } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com"
      }
    ]
  }
};

module.exports = nextConfig;
