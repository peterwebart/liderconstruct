import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Storefront images come from Payload media + brand logos.
  images: {
    remotePatterns: [],
  },
}

export default withPayload(nextConfig)
