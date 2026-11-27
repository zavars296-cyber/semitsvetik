'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content';
import { telHref } from '@/lib/format';

const nav = [
  { href: '/about/', label: t.nav.about },
  { href: '/programs/', label: t.nav.programs },
  { href: '/teachers/', label: t.nav.teachers },
  { href: '/gallery/', label: t.nav.gallery },
  { href: '/news/', label: t.nav.news },
  { href: '/birthday/', label: t.nav.birthday },
  { href: '/contacts/', label: t.nav.contacts },
];

export function Header() {
  const pathname = usePathname();
  const { content } = useContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const phone = content.settings.phones[0];

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const active = (href: string) => pathname?.startsWith(href.replace(/\/$/, ''));

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'bg-white/85 shadow-[0_1px_0_#E7E9F0] backdrop-blur-xl' : 'bg-white/0'}`}>
      {content.settings.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] font-medium text-white">{content.settings.announcement}</div>
      )}
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="Семицвіт — на головну" className="shrink-0"><Logo /></Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Головне меню">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium transition ${active(n.href) ? 'bg-ink/5 text-ink' : 'text-ink-soft hover:text-ink'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {phone && (
            <a href={telHref(phone)} className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-ink 2xl:flex">
              <Icon name="phone" className="h-4 w-4 text-green" /> {phone}
            </a>
          )}
          <Link href="/register/" className="btn-accent hidden !py-2.5 sm:inline-flex">{t.cta.register}</Link>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Меню"
            className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-line lg:hidden">
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white lg:hidden">
            <nav className="container-x flex flex-col gap-1 py-6" aria-label="Мобільне меню">
              <Link href="/" className="rounded-2xl px-4 py-3.5 font-display text-xl text-ink">{t.nav.home}</Link>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className={`rounded-2xl px-4 py-3.5 font-display text-xl ${active(n.href) ? 'bg-paper-cool text-ink' : 'text-ink'}`}>{n.label}</Link>
              ))}
              <div className="spectrum-line my-5 opacity-80" />
              <Link href="/register/" className="btn-accent w-full !py-4 text-base">{t.cta.register}</Link>
              {phone && <a href={telHref(phone)} className="btn-ghost mt-2 w-full !py-4 text-base"><Icon name="phone" className="h-4 w-4" /> {phone}</a>}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
