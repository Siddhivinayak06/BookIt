import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'images.pexels.com', process.env.NEXT_PUBLIC_SUPABASE_BUCKET_HOST ?? ''],
  },
}

export default nextConfig
