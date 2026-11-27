export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zavars296-cyber.github.io/semitsvetik').replace(/\/$/, '');
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Prefix a path from /public with the base path (needed on GitHub Pages sub-paths). */
export function asset(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${BASE_PATH}${path.startsWith('/') ? '' : '/'}${path}`;
}
