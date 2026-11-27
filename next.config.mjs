/** @type {import('next').NextConfig} */
// On Vercel the site lives at the domain root; on GitHub Pages under /semitsvetik.
const onVercel = !!process.env.VERCEL;
const basePath = onVercel ? '' : process.env.NEXT_PUBLIC_BASE_PATH || '';
const siteUrl = onVercel
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'semitsvetik.vercel.app'}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://zavars296-cyber.github.io/semitsvetik';

const nextConfig = {
  // Static export: the site works on GitHub Pages, Vercel, Netlify or any static host.
  // All dynamic data comes from Supabase in the browser, protected by Row Level Security.
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: siteUrl },
};

export default nextConfig;
