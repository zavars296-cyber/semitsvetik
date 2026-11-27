// Build-time content snapshot. If Supabase is configured, the published content is
// downloaded and baked into the static HTML (good for SEO and first paint).
// The browser then refreshes it live, so admin edits appear immediately.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv('.env.local');
loadEnv('.env.production');

const seed = JSON.parse(readFileSync('src/content/seed.json', 'utf8'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const out = 'src/content/snapshot.json';

const publishedSeed = {
  settings: seed.settings,
  programs: seed.programs.filter((p) => p.is_published),
  teachers: seed.teachers.filter((p) => p.is_published),
  schedule: seed.schedule.filter((p) => p.is_published),
  posts: seed.posts.filter((p) => p.is_published),
  albums: seed.albums.filter((p) => p.is_published),
  photos: seed.photos.filter((p) => p.is_published),
  testimonials: seed.testimonials.filter((p) => p.is_published),
};

async function get(path) {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  if (!url || !key) {
    writeFileSync(out, JSON.stringify(publishedSeed, null, 1));
    console.log('[snapshot] Supabase not configured, using seed content');
    return;
  }
  try {
    const [settings, programs, teachers, schedule, posts, albums, photos, testimonials] = await Promise.all([
      get('site_settings?select=data&id=eq.1'),
      get('programs?select=*&is_published=eq.true&order=sort_order'),
      get('teachers?select=*&is_published=eq.true&order=sort_order'),
      get('schedule_items?select=*&is_published=eq.true&order=weekday,start_time'),
      get('posts?select=*&is_published=eq.true&order=published_at.desc.nullslast&limit=60'),
      get('gallery_albums?select=*&is_published=eq.true&order=sort_order'),
      get('gallery_photos?select=*&is_published=eq.true&order=sort_order,created_at.desc&limit=300'),
      get('testimonials?select=*&is_published=eq.true'),
    ]);
    const data = {
      settings: { ...seed.settings, ...(settings[0]?.data || {}) },
      programs, teachers, schedule, posts, albums, photos, testimonials,
    };
    writeFileSync(out, JSON.stringify(data, null, 1));
    console.log('[snapshot] content downloaded from Supabase');
  } catch (e) {
    console.warn('[snapshot] could not reach Supabase, using seed content:', e.message);
    writeFileSync(out, JSON.stringify(publishedSeed, null, 1));
  }
}
main();
