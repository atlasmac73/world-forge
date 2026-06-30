/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'twilio'],
    workerThreads: false,
    cpus: 1,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // TypeScript and ESLint checks are now fully enforced during builds.
  // Run `npm run typecheck` and `npm run lint` locally before every push.
  outputFileTracing: false,
}

module.exports = nextConfig
