/** @type {import('next').NextConfig} */
const nextConfig = {
  /* SWC 비활성화 - 권한 문제 해결 */
  swcMinify: false,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;

