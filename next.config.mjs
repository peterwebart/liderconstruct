import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for Docker images. Enabled only when
  // DOCKER_BUILD=1 so the default (Nixpacks/Coolify) build is unaffected.
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  // Storefront images come from Payload media + brand logos.
  images: {
    remotePatterns: [],
  },
}

export default withPayload(nextConfig)
