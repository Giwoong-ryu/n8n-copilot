/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/ai-helper',
  assetPrefix: '/ai-helper',
  trailingSlash: true,
};

export default nextConfig;
