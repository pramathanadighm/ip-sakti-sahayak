/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Treat canvas as external for server-side pdfjs-dist
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tapioca-baton-stereo.ngrok-free.dev/api/:path*',
      },
    ];
  },
};

export default nextConfig;
