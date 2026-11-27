'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabase } from '../supabase';
import type { Profile, StaffRole } from '../types';
import { DEMO, getDemoUser, list, setDemoUser } from './db';

export const SECTIONS = [
  { key: 'programs', label: 'Програми' },
  { key: 'teachers', label: 'Педагоги' },
  { key: 'schedule', label: 'Розклад' },
  { key: 'gallery', label: 'Фотогалерея' },
  { key: 'news', label: 'Новини та події' },
  { key: 'testimonials', label: 'Відгуки' },
  { key: 'registrations', label: 'Заявки батьків' },
  { key: 'settings', label: 'Контакти, графік, тексти сайту' },
  { key: 'requests_review', label: 'Розгляд пропозицій працівників' },
] as const;

const ADMIN_DEFAULT = ['programs', 'teachers', 'schedule', 'gallery', 'news', 'testimonials', 'registrations'];

export function hasPerm(p: Profile | null, section: string): boolean {
  if (!p || !p.is_active) return false;
  if (p.role === 'owner') return true;
  if (p.role === 'pending') return false;
  const v = p.permissions?.[section];
  if (typeof v === 'boolean') return v;
  return p.role === 'admin' && ADMIN_DEFAULT.includes(section);
}

export const roleLabel: Record<StaffRole, string> = { owner: 'Власник', admin: 'Адміністратор', employee: 'Працівник', pending: 'Очікує доступу' };

interface AuthCtx {
  loading: boolean;
  email: string | null;
  profile: Profile | null;
  isOwner: boolean;
  isEditor: boolean;
  can: (section: string) => boolean;        // may view / use a section
  canEdit: (section: string) => boolean;    // may write directly (admin/owner)
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  demoSwitch: (id: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (DEMO) {
      const id = getDemoUser();
      if (!id) { setProfile(null); setEmail(null); setLoading(false); return; }
      setDemoUser(id);
      const all = await list<Profile>('profiles');
      const p = all.find((x) => x.id === id) || null;
      setProfile(p); setEmail(p?.email || null); setLoading(false);
      return;
    }
    const sb = getSupabase()!;
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) { setProfile(null); setEmail(null); setLoading(false); return; }
    setEmail(user.email || null);
    const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile((prof as Profile) || { id: user.id, email: user.email || '', full_name: '', role: 'pending', permissions: {}, is_active: true, created_at: '' });
    setLoading(false);
  }, []);

  useEffect(() => {
    // Links from invitation / password-reset emails: remember that the user must set a password.
    if (!DEMO && /type=(invite|recovery)/.test(window.location.hash)) {
      try { sessionStorage.setItem('semitsvit-set-password', '1'); } catch {}
    }
    load();
    if (DEMO) return;
    const { data } = getSupabase()!.auth.onAuthStateChange((evt) => {
      if (evt === 'PASSWORD_RECOVERY') { try { sessionStorage.setItem('semitsvit-set-password', '1'); } catch {} }
      if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT' || evt === 'USER_UPDATED') load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const value: AuthCtx = {
    loading, email, profile,
    isOwner: profile?.role === 'owner' && !!profile.is_active,
    isEditor: (profile?.role === 'owner' || profile?.role === 'admin') && !!profile?.is_active,
    can: (s) => hasPerm(profile, s),
    canEdit: (s) => (profile?.role === 'owner' || profile?.role === 'admin') && hasPerm(profile, s),
    refresh: load,
    signOut: async () => {
      if (DEMO) { setDemoUser(''); } else { await getSupabase()!.auth.signOut(); }
      await load();
    },
    demoSwitch: (id) => { setDemoUser(id); setLoading(true); load(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
