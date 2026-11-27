'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { useContent } from '@/lib/content';
import { telHref } from '@/lib/format';
import { t } from '@/lib/i18n';

export function Footer() {
  const { settings: s, programs } = useContent().content;
  return (
    <footer className="mt-24 bg-paper-cool">
      <div className="spectrum-line !h-1.5 !rounded-none" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">{s.tagline}</p>
          <div className="mt-5 flex gap-2">
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink ring-1 ring-line hover:text-red"><Icon name="instagram" /></a>}
            {s.facebook && <a href={s.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink ring-1 ring-line hover:text-blue"><Icon name="facebook" /></a>}
            {s.telegram && <a href={s.telegram} target="_blank" rel="noopener" aria-label="Telegram" className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink ring-1 ring-line hover:text-cyan"><Icon name="send" /></a>}
          </div>
        </div>
        <div>
          <p className="eyebrow">Програми</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {programs.filter((p) => p.is_active).slice(0, 6).map((p) => (
              <li key={p.id}><Link className="text-ink-soft hover:text-ink" href={`/programs/#${p.slug}`}>{p.title}</Link></li>
            ))}
            <li><Link className="text-ink-soft hover:text-ink" href="/birthday/">{t.nav.birthday}</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Контакти</p>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-red" />{s.address}, {s.city}</li>
            {s.phones.map((p) => <li key={p} className="flex gap-2.5"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-green" /><a href={telHref(p)} className="hover:text-ink">{p}</a></li>)}
            <li className="flex gap-2.5"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
              <span>{s.hours.length ? s.hours.map((h) => `${h.days}: ${h.hours}`).join(' · ') : s.hoursNote}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {s.fullName}. Усі права захищено.</p>
          <div className="flex gap-4">
            <Link href="/privacy/" className="hover:text-ink">Політика конфіденційності</Link>
            <Link href="/admin/" className="hover:text-ink">Вхід для персоналу</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
