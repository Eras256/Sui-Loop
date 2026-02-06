/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
