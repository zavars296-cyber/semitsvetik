'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { staticContent as initial } from './snapshot';
import type { Content } from './types';
import { getSupabase } from './supabase';


interface Ctx { content: Content; preview: boolean; live: boolean }
const ContentContext = createContext<Ctx>({ content: initial, preview: false, live: false });

/** Fetches the newest content from Supabase. With `all = true` (staff preview) drafts are included — RLS decides. */
export async function fetchContent(all: boolean): Promise<Content | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const pub = <T,>(qb: T) => (all ? qb : (qb as any).eq('is_published', true)) as T;
  const [settings, programs, teachers, schedule, posts, albums, photos, testimonials] = await Promise.all([
    sb.from('site_settings').select('data').eq('id', 1).maybeSingle(),
    pub(sb.from('programs').select('*')).order('sort_order'),
    pub(sb.from('teachers').select('*')).order('sort_order'),
    pub(sb.from('schedule_items').select('*')).order('weekday').order('start_time'),
    pub(sb.from('posts').select('*')).order('published_at', { ascending: false, nullsFirst: false }).limit(60),
    pub(sb.from('gallery_albums').select('*')).order('sort_order'),
    pub(sb.from('gallery_photos').select('*')).order('sort_order').order('created_at', { ascending: false }).limit(300),
    pub(sb.from('testimonials').select('*')),
  ]);
  if (programs.error) throw programs.error;
  return {
    settings: { ...initial.settings, ...((settings.data?.data as object) || {}) },
    programs: programs.data || [],
    teachers: teachers.data || [],
    schedule: schedule.data || [],
    posts: posts.data || [],
    albums: albums.data || [],
    photos: photos.data || [],
    testimonials: testimonials.data || [],
  } as Content;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ content: initial, preview: false, live: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const wantsPreview = new URLSearchParams(window.location.search).get('preview') === '1';
      let preview = false;
      if (wantsPreview) {
        const { data } = await sb.auth.getSession();
        preview = Boolean(data.session);
      }
      try {
        const c = await fetchContent(preview);
        if (c && !cancelled) setState({ content: c, preview, live: true });
      } catch (e) {
        console.warn('Live content unavailable, showing saved version', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <ContentContext.Provider value={state}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
