'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteStored, insert, list, remove, update, uploadImage } from '@/lib/admin/db';
import { useAuth } from '@/lib/admin/auth';
import { Icon } from '@/components/site/Icon';
import { EntityManager } from '../EntityManager';
import { albumsConfig } from '../configs';
import { Badge, Empty, PageTitle, Spinner, Toggle, useUi } from '../ui';

export function Gallery() {
  const auth = useAuth();
  const { toast, confirm } = useUi();
  const editor = auth.canEdit('gallery');
  const uploader = editor || (auth.profile?.role === 'employee' && auth.can('gallery'));
  const [albums, setAlbums] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[] | null>(null);
  const [album, setAlbum] = useState('');
  const [children, setChildren] = useState(false);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [tab, setTab] = useState<'photos' | 'albums'>('photos');
  const ref = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([list('gallery_albums', { order: [['sort_order']] }), list('gallery_photos', { order: [['created_at', false]], limit: 500 })]);
      setAlbums(a); setPhotos(p);
    } catch (e: any) { toast(e.message, 'error'); setPhotos([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load, tab]);

  async function upload(files: File[]) {
    if (children && !consent && editor) {
      if (!(await confirm('На фото є діти, але згоду батьків не позначено. Фото буде збережено як неопубліковане. Продовжити?'))) return;
    }
    let ok = 0;
    for (const [i, f] of files.entries()) {
      setProgress(`Завантаження ${i + 1} з ${files.length}…`);
      try {
        const { url, path } = await uploadImage(f, 'gallery');
        const publish = editor && (!children || consent);
        await insert('gallery_photos', { url, storage_path: path || null, album_id: album || null, caption: '', children_visible: children, consent_confirmed: children && consent, is_published: publish });
        ok++;
      } catch (e: any) { toast(`${f.name}: ${e.message}`, 'error'); }
    }
    setProgress(null);
    if (ok) toast(editor ? `Завантажено фото: ${ok}` : `Завантажено ${ok} фото — опублікує адміністратор`);
    load();
  }

  async function patch(p: any, data: any) {
    try { await update('gallery_photos', p.id, data); load(); } catch (e: any) { toast(e.message, 'error'); }
  }
  async function del(p: any) {
    if (!(await confirm('Видалити фото назавжди?', { danger: true, ok: 'Видалити' }))) return;
    try { await remove('gallery_photos', p.id); await deleteStored(p.storage_path); load(); } catch (e: any) { toast(e.message, 'error'); }
  }

  if (!auth.can('gallery') && auth.profile?.role !== 'employee') return <Empty text="У вас немає доступу до галереї." />;

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab('photos')} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${tab === 'photos' ? 'bg-ink text-white ring-ink' : 'bg-white ring-line'}`}>Фото</button>
        <button onClick={() => setTab('albums')} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${tab === 'albums' ? 'bg-ink text-white ring-ink' : 'bg-white ring-line'}`}>Альбоми</button>
      </div>
      {tab === 'albums' ? <EntityManager config={albumsConfig} /> : (
        <>
          <PageTitle title="Фотогалерея" text="Фото автоматично зменшуються й очищуються від метаданих (геолокація тощо) перед завантаженням." />
          {uploader ? (
            <div className="card mb-6 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="alb">Альбом</label>
                    <select id="alb" className="input" value={album} onChange={(e) => setAlbum(e.target.value)}>
                      <option value="">Без альбому</option>
                      {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 pt-1 text-sm">
                    <Toggle checked={children} onChange={setChildren} label="На фото видно дітей" />
                    {children && <Toggle checked={consent} onChange={setConsent} label="Є згода батьків на публікацію" />}
                  </div>
                </div>
                <button className="btn-accent !py-3.5" disabled={!!progress} onClick={() => ref.current?.click()}>
                  <Icon name="image" className="h-4 w-4" /> {progress || 'Завантажити фото'}
                </button>
              </div>
              <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) upload(f); }} />
            </div>
          ) : <p className="mb-6 rounded-2xl bg-violet-soft p-4 text-sm text-violet">Власник ще не дозволив вам завантажувати фото.</p>}

          {!photos ? <Spinner /> : !photos.length ? <Empty text="Фото ще немає." /> : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {photos.map((p) => (
                <li key={p.id} className="card overflow-hidden">
                  <div className="relative aspect-square bg-paper-cool">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {p.is_published ? <Badge tone="green">На сайті</Badge> : <Badge tone="yellow">Приховано</Badge>}
                      {p.children_visible && <Badge tone={p.consent_confirmed ? 'blue' : 'red'}>{p.consent_confirmed ? 'Діти · згода є' : 'Діти · без згоди'}</Badge>}
                    </div>
                  </div>
                  {editor && (
                    <div className="space-y-2 p-3">
                      <input className="input !rounded-xl !px-3 !py-2 text-sm" placeholder="Підпис" defaultValue={p.caption} onBlur={(e) => e.target.value !== p.caption && patch(p, { caption: e.target.value })} />
                      <select className="input !rounded-xl !px-3 !py-2 text-sm" value={p.album_id || ''} onChange={(e) => patch(p, { album_id: e.target.value || null })}>
                        <option value="">Без альбому</option>
                        {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>
                      {p.children_visible && !p.consent_confirmed && <button className="text-xs font-medium text-blue" onClick={() => patch(p, { consent_confirmed: true })}>Позначити: згода батьків є</button>}
                      <div className="flex gap-2">
                        <button className="btn-ghost flex-1 !px-2 !py-1.5 text-xs" onClick={() => patch(p, { is_published: !p.is_published })}>{p.is_published ? 'Сховати' : 'Опублікувати'}</button>
                        <button className="btn !px-2 !py-1.5 text-xs text-red hover:bg-red-soft" onClick={() => del(p)}>Видалити</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
