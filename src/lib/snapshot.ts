import snapshot from '@/content/snapshot.json';
import type { Content } from './types';

/** Content baked in at build time (from Supabase if configured, otherwise the seed). Server-safe. */
export const staticContent = snapshot as unknown as Content;
