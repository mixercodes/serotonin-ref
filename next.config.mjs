/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
  outputFileTracingIncludes: {
    "/api/mcp": ["./src/content/**"],
  },
};

export default nextConfig;
