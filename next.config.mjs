/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
        // Add WASM support
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };

        // Handle .wasm files
        config.module.rules.push({
            test: /\.wasm$/,
            type: "asset/resource",
        });

        return config;
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https: *.public.blob.vercel-storage.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "connect-src 'self' https: *.public.blob.vercel-storage.com",
                            "frame-src 'self' https://*.public.blob.vercel-storage.com",
                            "worker-src 'self' blob:",
                            "child-src 'self' blob:",
                        ].join("; "),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;