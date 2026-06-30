/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15+: moved out of experimental to the top level.
  serverExternalPackages: ['@anthropic-ai/sdk', 'twilio'],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // TypeScript and ESLint checks are now fully enforced during builds.
  // Run `npm run typecheck` and `npm run lint` locally before every push.
}

module.exports = nextConfig
