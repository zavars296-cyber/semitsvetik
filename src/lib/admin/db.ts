'use client';

// Data access for the admin panel.
// • With Supabase configured: real database, auth and storage (permissions enforced by RLS on the server).
// • Without Supabase: DEMO mode — data lives in this browser's localStorage, so the panel can be explored safely.

import seed from '@/content/seed.json';
import { getSupabase } from '../supabase';
import { isSupabaseConfigured } from '../config';

export const DEMO = !isSupabaseConfigured;

export type Table =
  | 'programs' | 'teachers' | 'schedule_items' | 'posts' | 'gallery_albums' | 'gallery_photos'
  | 'testimonials' | 'registrations' | 'change_requests' | 'profiles' | 'activity_log';

type Row = Record<string, any>;
export interface ListOpts { order?: [string, boolean?][]; eq?: Record<string, unknown>; limit?: number }

// ---------------- demo store ----------------
const DEMO_KEY = 'semitsvit-demo-v1';
const uid = () => (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);

function demoInitial(): Record<string, any> {
  const now = new Date().toISOString();
  return {
    site_settings: { ...seed.settings },
    programs: seed.programs.map((p) => ({ ...p, created_at: now, updated_at: now })),
    teachers: [], schedule_items: [],
    posts: seed.posts.map((p) => ({ ...p, created_at: now, updated_at: now })),
    gallery_albums: [], gallery_photos: [], testimonials: [],
    registrations: [
      { id: uid(), kind: 'registration', parent_name: 'Демо-заявка', phone: '+380 00 000 00 00', child_age: '4 роки', program: 'Підготовка до школи', contact_method: 'viber', message: 'Це приклад заявки в демо-режимі.', consent: true, status: 'new', admin_note: '', created_at: now },
    ],
    change_requests: [
      { id: uid(), author_id: 'demo-employee', author_name: 'Марія (працівник, демо)', title: 'Додати нову групу розвитку з грудня', message: 'Будь ласка, додайте нову групу раннього розвитку, старт у грудні.', target_table: null, target_id: null, payload: null, status: 'pending', reviewer_note: '', created_at: now },
    ],
    profiles: [
      { id: 'demo-owner', email: 'owner@demo', full_name: 'Власник (демо)', role: 'owner', permissions: {}, is_active: true, created_at: now },
      { id: 'demo-admin', email: 'admin@demo', full_name: 'Адміністратор (демо)', role: 'admin', permissions: {}, is_active: true, created_at: now },
      { id: 'demo-employee', email: 'employee@demo', full_name: 'Марія (працівник, демо)', role: 'employee', permissions: { gallery: true }, is_active: true, created_at: now },
      { id: 'demo-pending', email: 'new@demo', full_name: 'Новий працівник', role: 'pending', permissions: {}, is_active: true, created_at: now },
    ],
    activity_log: [],
  };
}

function demoLoad(): Record<string, any> {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const d = demoInitial();
  demoSave(d);
  return d;
}
function demoSave(d: Record<string, any>) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch {} }
export function demoReset() { try { localStorage.removeItem(DEMO_KEY); } catch {} }

let demoUser = 'demo-owner';
export function setDemoUser(id: string) { demoUser = id; try { sessionStorage.setItem('semitsvit-demo-user', id); } catch {} }
export function getDemoUser() { try { return sessionStorage.getItem('semitsvit-demo-user') || ''; } catch { return ''; } }

function demoLog(d: Record<string, any>, action: string, table: string, row: Row) {
  const actor = d.profiles.find((p: Row) => p.id === demoUser);
  d.activity_log.unshift({ id: Date.now(), actor_id: demoUser, actor_name: actor?.full_name || '', action, table_name: table, row_id: row.id, summary: row.title || row.full_name || row.caption || row.author || row.parent_name || '', created_at: new Date().toISOString() });
  d.activity_log = d.activity_log.slice(0, 100);
}

// ---------------- public API ----------------
export async function list<T = Row>(table: Table, opts: ListOpts = {}): Promise<T[]> {
  if (DEMO) {
    let rows: Row[] = [...(demoLoad()[table] || [])];
    if (opts.eq) rows = rows.filter((r) => Object.entries(opts.eq!).every(([k, v]) => r[k] === v));
    for (const [col, asc = true] of [...(opts.order || [])].reverse()) {
      rows.sort((a, b) => (a[col] ?? '') < (b[col] ?? '') ? (asc ? -1 : 1) : (a[col] ?? '') > (b[col] ?? '') ? (asc ? 1 : -1) : 0);
    }
    return (opts.limit ? rows.slice(0, opts.limit) : rows) as T[];
  }
  const sb = getSupabase()!;
  let q = sb.from(table).select('*');
  if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v as any);
  for (const [col, asc = true] of opts.order || []) q = q.order(col, { ascending: asc, nullsFirst: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(humanError(error.message));
  return (data || []) as T[];
}

export async function insert<T = Row>(table: Table, row: Row): Promise<T> {
  if (DEMO) {
    const d = demoLoad();
    const now = new Date().toISOString();
    const r: Row = { id: uid(), created_at: now, updated_at: now, ...row };
    if (table === 'change_requests') {
      const me = d.profiles.find((p: Row) => p.id === demoUser);
      Object.assign(r, { author_id: demoUser, author_name: me?.full_name || '', status: 'pending', reviewer_note: '' });
    }
    if (table === 'gallery_photos') r.uploaded_by = demoUser;
    d[table] = [r, ...(d[table] || [])];
    if (!['change_requests', 'registrations'].includes(table)) demoLog(d, 'insert', table, r);
    demoSave(d);
    return r as T;
  }
  const { data, error } = await getSupabase()!.from(table).insert(row).select().single();
  if (error) throw new Error(humanError(error.message));
  return data as T;
}

export async function update<T = Row>(table: Table, id: string, patch: Row): Promise<T> {
  if (DEMO) {
    const d = demoLoad();
    const rows: Row[] = d[table] || [];
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('Запис не знайдено');
    rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
    if (table === 'change_requests' && patch.status) Object.assign(rows[i], { reviewer_id: demoUser, reviewed_at: new Date().toISOString() });
    if (table !== 'change_requests') demoLog(d, 'update', table, rows[i]);
    demoSave(d);
    return rows[i] as T;
  }
  const { data, error } = await getSupabase()!.from(table).update(patch).eq('id', id).select().maybeSingle();
  if (error) throw new Error(humanError(error.message));
  if (!data) throw new Error('Немає прав на зміну цього запису');
  return data as T;
}

export async function remove(table: Table, id: string): Promise<void> {
  if (DEMO) {
    const d = demoLoad();
    const row = (d[table] || []).find((r: Row) => r.id === id);
    d[table] = (d[table] || []).filter((r: Row) => r.id !== id);
    if (row) demoLog(d, 'delete', table, row);
    demoSave(d);
    return;
  }
  const { error, count } = await getSupabase()!.from(table).delete({ count: 'exact' }).eq('id', id);
  if (error) throw new Error(humanError(error.message));
  if (count === 0) throw new Error('Немає прав на видалення цього запису');
}

export async function getSettings(): Promise<Row> {
  if (DEMO) return { ...seed.settings, ...demoLoad().site_settings };
  const { data, error } = await getSupabase()!.from('site_settings').select('data').eq('id', 1).maybeSingle();
  if (error) throw new Error(humanError(error.message));
  return { ...seed.settings, ...((data?.data as Row) || {}) };
}

export async function saveSettings(patch: Row): Promise<void> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  if (DEMO) {
    const d = demoLoad(); d.site_settings = next; demoLog(d, 'update', 'site_settings', { id: 1, title: 'Налаштування сайту' }); demoSave(d); return;
  }
  const { data, error } = await getSupabase()!.from('site_settings').update({ data: next }).eq('id', 1).select('id');
  if (error) throw new Error(humanError(error.message));
  if (!data?.length) throw new Error('Немає прав на зміну налаштувань');
}

export async function dashboardCounts(): Promise<Record<string, number | null>> {
  if (DEMO) {
    const d = demoLoad();
    return {
      registrations_new: d.registrations.filter((r: Row) => r.status === 'new').length,
      requests_pending: d.change_requests.filter((r: Row) => r.status === 'pending').length,
      programs: d.programs.length, teachers: d.teachers.length, posts: d.posts.length, photos: d.gallery_photos.length,
      staff_pending: d.profiles.filter((p: Row) => p.role === 'pending').length,
    };
  }
  const { data, error } = await getSupabase()!.rpc('dashboard_counts');
  if (error) throw new Error(humanError(error.message));
  return data || {};
}

// ---------------- images ----------------
const MAX_INPUT = 20 * 1024 * 1024;

/** Validates, downsizes (max 1600px) and re-encodes an image to WebP. Re-encoding also strips EXIF/GPS metadata. */
export async function prepareImage(file: File, maxSide = 1600): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error('Підтримуються лише фото JPG, PNG або WebP');
  }
  if (file.size > MAX_INPUT) throw new Error('Файл завеликий (максимум 20 МБ)');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Не вдалося прочитати зображення'); });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
  if (!blob) throw new Error('Не вдалося обробити зображення');
  return blob;
}

export async function uploadImage(file: File, folder: string): Promise<{ url: string; path: string }> {
  const blob = await prepareImage(file);
  if (DEMO) {
    const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
    return { url: dataUrl, path: '' };
  }
  const sb = getSupabase()!;
  const d = new Date();
  const path = `${folder}/${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}/${uid()}.webp`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (error) throw new Error(humanError(error.message));
  return { url: sb.storage.from('media').getPublicUrl(path).data.publicUrl, path };
}

export async function deleteStored(path?: string | null) {
  if (DEMO || !path) return;
  await getSupabase()!.storage.from('media').remove([path]);
}

export function humanError(msg: string): string {
  if (/row-level security|permission denied/i.test(msg)) return 'Недостатньо прав для цієї дії';
  if (/duplicate key.*slug/i.test(msg)) return 'Така адреса (slug) вже існує — змініть її';
  if (/children_need_consent/.test(msg)) return 'Фото з дітьми можна публікувати лише за згодою батьків';
  if (/testimonial_verified/.test(msg)) return 'Публікувати можна лише перевірені відгуки';
  if (/at least one active owner/i.test(msg)) return 'На сайті має залишитися хоча б один власник';
  if (/Only the owner/i.test(msg)) return 'Лише власник може змінювати ролі та права';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Немає з’єднання з сервером. Перевірте інтернет';
  return msg;
}
