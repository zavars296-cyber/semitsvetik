'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AuthProvider, roleLabel, useAuth } from '@/lib/admin/auth';
import { DEMO, demoReset } from '@/lib/admin/db';
import { Icon } from '@/components/site/Icon';
import { LogoMark } from '@/components/site/Logo';
import { Login } from './Login';
import { Spinner, UiProvider } from './ui';

type Item = { href: string; label: string; icon: string; show: (a: ReturnType<typeof useAuth>) => boolean };
const items: Item[] = [
  { href: '/admin/', label: 'Огляд', icon: 'home', show: () => true },
  { href: '/admin/registrations/', label: 'Заявки батьків', icon: 'user', show: (a) => a.can('registrations') },
  { href: '/admin/requests/', label: 'Пропозиції працівників', icon: 'chat', show: () => true },
  { href: '/admin/programs/', label: 'Програми', icon: 'puzzle', show: (a) => a.can('programs') || a.profile?.role === 'employee' },
  { href: '/admin/schedule/', label: 'Розклад', icon: 'calendar', show: (a) => a.can('schedule') || a.profile?.role === 'employee' },
  { href: '/admin/teachers/', label: 'Педагоги', icon: 'smile', show: (a) => a.can('teachers') || a.profile?.role === 'employee' },
  { href: '/admin/gallery/', label: 'Фотогалерея', icon: 'image', show: (a) => a.can('gallery') || a.profile?.role === 'employee' },
  { href: '/admin/news/', label: 'Новини та події', icon: 'sparkle', show: (a) => a.can('news') || a.profile?.role === 'employee' },
  { href: '/admin/testimonials/', label: 'Відгуки', icon: 'star', show: (a) => a.can('testimonials') },
  { href: '/admin/contacts/', label: 'Контакти й соцмережі', icon: 'phone', show: (a) => a.can('settings') },
  { href: '/admin/hours/', label: 'Графік роботи', icon: 'clock', show: (a) => a.can('settings') },
  { href: '/admin/settings/', label: 'Тексти й налаштування', icon: 'pencil', show: (a) => a.can('settings') },
  { href: '/admin/users/', label: 'Користувачі та права', icon: 'shield', show: (a) => a.isOwner },
  { href: '/admin/account/', label: 'Мій профіль', icon: 'user', show: () => true },
];

function Gate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);

  if (auth.loading) return <div className="container-x"><Spinner /></div>;
  if (!auth.profile) return <Login />;
  if (auth.profile.role === 'pending' || !auth.profile.is_active) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-cool p-4">
        <div className="card max-w-md p-8 text-center">
          <LogoMark className="mx-auto h-12 w-auto" />
          <h1 className="mt-5 font-display text-xl font-semibold">{auth.profile.is_active ? 'Очікуйте підтвердження' : 'Доступ вимкнено'}</h1>
          <p className="mt-3 text-sm text-ink-soft">{auth.profile.is_active ? 'Ваш обліковий запис створено. Власник центру має надати вам роль у розділі «Користувачі та права».' : 'Зверніться до власника центру.'}</p>
          <p className="mt-3 text-sm text-ink-mute">{auth.email}</p>
          <button className="btn-ghost mt-6" onClick={auth.signOut}>Вийти</button>
        </div>
      </div>
    );
  }

  const nav = items.filter((i) => i.show(auth));
  const isActive = (href: string) => (href === '/admin/' ? pathname === '/admin' || pathname === '/admin/' : pathname?.startsWith(href.replace(/\/$/, '')));

  const sidebar = (
    <nav className="flex flex-col gap-0.5" aria-label="Меню адмін-панелі">
      {nav.map((i) => (
        <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(i.href) ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-ink'}`}>
          <Icon name={i.icon} className="h-[18px] w-[18px]" /> {i.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper-cool">
      {DEMO && (
        <div className="bg-violet px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
          Демо-режим: дані зберігаються лише в цьому браузері. Після підключення бази все працюватиме по-справжньому.{' '}
          <button className="underline" onClick={() => { demoReset(); location.reload(); }}>Скинути демо</button>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line lg:hidden" onClick={() => setMenu((v) => !v)} aria-label="Меню"><Icon name={menu ? 'close' : 'menu'} /></button>
            <Link href="/admin/" className="flex items-center gap-2"><LogoMark className="h-8 w-auto" /><span className="hidden font-display font-semibold sm:inline">Семицвіт · Адмін</span></Link>
          </div>
          <div className="flex items-center gap-2">
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`} target="_blank" rel="noopener" className="btn-ghost hidden !py-2 sm:inline-flex"><Icon name="external" className="h-4 w-4" /> Сайт</a>
            <div className="hidden text-right text-xs leading-tight md:block">
              <p className="font-semibold">{auth.profile.full_name || auth.email}</p>
              <p className="text-ink-mute">{roleLabel[auth.profile.role]}</p>
            </div>
            <button className="btn-ghost !py-2" onClick={auth.signOut}>Вийти</button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto p-4 lg:block">{sidebar}</aside>
        {menu && <div className="fixed inset-0 top-16 z-20 overflow-y-auto bg-paper-cool p-4 lg:hidden">{sidebar}</div>}
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UiProvider>
        <Gate>{children}</Gate>
      </UiProvider>
    </AuthProvider>
  );
}
