'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Icon } from '../Icon';
import { categoryLabel, img } from '@/lib/format';

export function GalleryView() {
  const { albums, photos, settings } = useContent().content;
  const [album, setAlbum] = useState<string>('all');
  const [open, setOpen] = useState<number | null>(null);
  const shown = useMemo(() => (album === 'all' ? photos : photos.filter((p) => p.album_id === album)), [album, photos]);

  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % shown.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + shown.length) % shown.length));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, shown.length]);

  return (
    <>
      <PageHero eyebrow="Галерея" title="Життя центру в кадрі" text="Заняття, свята, події та наші затишні кімнати." />
      <section className="container-x py-4">
        {albums.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button onClick={() => setAlbum('all')} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${album === 'all' ? 'bg-ink text-white ring-ink' : 'ring-line text-ink-soft'}`}>Усі фото</button>
            {albums.map((a) => (
              <button key={a.id} onClick={() => setAlbum(a.id)} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${album === a.id ? 'bg-ink text-white ring-ink' : 'ring-line text-ink-soft'}`}>
                {a.title} <span className="opacity-60">· {categoryLabel[a.category] || ''}</span>
              </button>
            ))}
          </div>
        )}
        {shown.length ? (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {shown.map((p, i) => (
              <button key={p.id} onClick={() => setOpen(i)} className="mb-3 block w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p.url)} alt={p.caption || 'Фото з центру «Семицвіт»'} loading="lazy" decoding="async" className="w-full transition duration-500 hover:scale-[1.03]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center p-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange via-red to-violet text-white"><Icon name="image" className="h-8 w-8" /></div>
            <h2 className="h-display mt-5 text-2xl">Фотогалерея скоро поповниться</h2>
            <p className="mt-3 max-w-md text-ink-soft">А поки що найсвіжіші фото й відео — у нашому Instagram.</p>
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener" className="btn-primary mt-6"><Icon name="instagram" className="h-4 w-4" /> Instagram центру</a>}
          </div>
        )}
      </section>

      <AnimatePresence>
        {open !== null && shown[open] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" onClick={() => setOpen(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(shown[open].url)} alt={shown[open].caption} className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            {shown[open].caption && <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-sm text-white">{shown[open].caption}</p>}
            <button aria-label="Закрити" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" onClick={() => setOpen(null)}><Icon name="close" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
