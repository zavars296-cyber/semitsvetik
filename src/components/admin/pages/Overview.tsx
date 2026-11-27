'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dashboardCounts, getSettings, list } from '@/lib/admin/db';
import { roleLabel, useAuth } from '@/lib/admin/auth';
import { formatDate } from '@/lib/format';
import { Icon } from '@/components/site/Icon';
import { Badge, PageTitle } from '../ui';

const tableLabel: Record<string, string> = { programs: 'Програми', teachers: 'Педагоги', schedule_items: 'Розклад', posts: 'Новини', gallery_albums: 'Альбоми', gallery_photos: 'Фото', testimonials: 'Відгуки', site_settings: 'Налаштування' };
const actionLabel: Record<string, string> = { insert: 'додав(ла)', update: 'змінив(ла)', delete: 'видалив(ла)' };

export function Overview() {
  const auth = useAuth();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [regs, setRegs] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    dashboardCounts().then(setCounts).catch(() => {});
    if (auth.can('registrations')) list('registrations', { order: [['created_at', false]], limit: 5 }).then(setRegs).catch(() => {});
    if (auth.isEditor) list('activity_log', { order: [['created_at', false]], limit: 8 }).then(setLog).catch(() => {});
    if (auth.isEditor) Promise.all([getSettings(), list('teachers'), list('gallery_photos')]).then(([s, t, ph]) => {
      const m: string[] = [];
      if (!s.hours?.length) m.push('Графік роботи');
      if (!s.aboutHistory) m.push('Історія центру (сторінка «Про нас»)');
      if (!t.length) m.push('Профілі педагогів');
      if (!ph.length) m.push('Фото центру в галереї');
      if (!s.telegram && !s.viber) m.push('Месенджери (Viber / Telegram)');
      setMissing(m);
    }).catch(() => {});
  }, [auth]);

  const tiles = [
    { k: 'registrations_new', l: 'Нові заявки', href: '/admin/registrations/', tone: 'bg-red-soft text-red', icon: 'user' },
    { k: 'requests_pending', l: 'Пропозиції на розгляді', href: '/admin/requests/', tone: 'bg-yellow-soft text-yellow-deep', icon: 'chat' },
    { k: 'staff_pending', l: 'Нові працівники', href: '/admin/users/', tone: 'bg-violet-soft text-violet', icon: 'shield' },
    { k: 'programs', l: 'Програми', href: '/admin/programs/', tone: 'bg-blue-soft text-blue', icon: 'puzzle' },
    { k: 'posts', l: 'Публікації', href: '/admin/news/', tone: 'bg-green-soft text-green-deep', icon: 'sparkle' },
    { k: 'photos', l: 'Фото', href: '/admin/gallery/', tone: 'bg-cyan-soft text-cyan-deep', icon: 'image' },
  ].filter((t) => counts[t.k] !== null && counts[t.k] !== undefined);

  return (
    <div>
      <PageTitle title={`Вітаємо${auth.profile?.full_name ? ', ' + auth.profile.full_name.split(' ')[0] : ''}!`} text={`Ваша роль: ${roleLabel[auth.profile!.role]}.`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <Link key={t.k} href={t.href} className="card p-4 transition hover:shadow-lift">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${t.tone}`}><Icon name={t.icon} className="h-[18px] w-[18px]" /></span>
            <p className="mt-3 font-display text-2xl font-semibold">{counts[t.k]}</p>
            <p className="text-sm text-ink-mute">{t.l}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {auth.can('registrations') && (
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Останні заявки</h2><Link href="/admin/registrations/" className="text-sm text-blue">Усі</Link></div>
            {regs.length ? (
              <ul className="divide-y divide-line">
                {regs.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0"><p className="truncate font-medium">{r.parent_name} · {r.phone}</p><p className="truncate text-ink-mute">{r.program || r.kind} · {formatDate(r.created_at)}</p></div>
                    {r.status === 'new' ? <Badge tone="red">Нова</Badge> : r.status === 'done' ? <Badge tone="green">Оброблено</Badge> : <Badge>{r.status === 'spam' ? 'Спам' : 'В роботі'}</Badge>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-mute">Заявок поки немає.</p>}
          </section>
        )}
        {auth.isEditor && missing.length > 0 && (
          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold">Варто заповнити</h2>
            <p className="mt-1 text-sm text-ink-mute">Цієї інформації ще немає на сайті:</p>
            <ul className="mt-4 space-y-2 text-sm">{missing.map((m) => <li key={m} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange" />{m}</li>)}</ul>
          </section>
        )}
        {auth.isEditor && (
          <section className="card p-5 xl:col-span-2">
            <h2 className="mb-4 font-display text-lg font-semibold">Остання активність</h2>
            {log.length ? (
              <ul className="space-y-2 text-sm">
                {log.map((l) => <li key={l.id} className="flex flex-wrap gap-x-2 text-ink-soft"><span className="font-medium text-ink">{l.actor_name || 'Система'}</span>{actionLabel[l.action] || l.action}<span>{tableLabel[l.table_name] || l.table_name}:</span><span className="text-ink">{l.summary}</span><span className="text-ink-mute">· {formatDate(l.created_at)}</span></li>)}
              </ul>
            ) : <p className="text-sm text-ink-mute">Поки що змін не було.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
