'use client';

import { useState } from 'react';
import { Icon } from './Icon';

/** Google Map loads only after a click (privacy + speed). */
export function MapEmbed({ query, url }: { query: string; url: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="card relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
      {show ? (
        <iframe title="Карта: як нас знайти" className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_30%_20%,#E3F0F8,transparent_60%),radial-gradient(circle_at_80%_80%,#FDF7DF,transparent_55%)] p-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-red shadow-soft"><Icon name="pin" className="h-7 w-7" /></div>
          <p className="max-w-xs text-sm text-ink-soft">Карта Google завантажиться після натискання.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setShow(true)} className="btn-primary">Показати карту</button>
            <a href={url} target="_blank" rel="noopener" className="btn-ghost">Відкрити в Google Maps <Icon name="external" className="h-4 w-4" /></a>
          </div>
        </div>
      )}
    </div>
  );
}
