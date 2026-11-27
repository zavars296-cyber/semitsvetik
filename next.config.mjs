/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // Static export: the site works on GitHub Pages, Vercel, Netlify or any static host.
  // All dynamic data comes from Supabase in the browser, protected by Row Level Security.
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
