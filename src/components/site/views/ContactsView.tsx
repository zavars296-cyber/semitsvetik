'use client';

import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Reveal } from '../Reveal';
import { Icon } from '../Icon';
import { MapEmbed } from '../MapEmbed';
import { RegistrationForm } from '../RegistrationForm';
import { telHref } from '@/lib/format';

export function ContactsView() {
  const { settings: s } = useContent().content;
  const phoneDigits = (s.phones[0] || '').replace(/[^\d]/g, '');
  const messengers = [
    s.viber && { href: s.viber, label: 'Viber', icon: 'chat', tone: 'bg-violet-soft text-violet' },
    s.telegram && { href: s.telegram, label: 'Telegram', icon: 'send', tone: 'bg-cyan-soft text-cyan-deep' },
    s.whatsapp && { href: s.whatsapp, label: 'WhatsApp', icon: 'chat', tone: 'bg-green-soft text-green-deep' },
    s.instagram && { href: s.instagram, label: 'Instagram', icon: 'instagram', tone: 'bg-red-soft text-red' },
    s.facebook && { href: s.facebook, label: 'Facebook', icon: 'facebook', tone: 'bg-blue-soft text-blue' },
  ].filter(Boolean) as { href: string; label: string; icon: string; tone: string }[];

  return (
    <>
      <PageHero eyebrow="Контакти" title="Як нас знайти" text={`${s.fullName} — ${s.address}, ${s.city}.`} />
      <section className="container-x grid gap-6 py-4 lg:grid-cols-[1fr_1.4fr]">
        <Reveal className="space-y-4">
          <div className="card p-6">
            <p className="eyebrow">Адреса</p>
            <p className="mt-2 font-display text-xl font-semibold">{s.address}, {s.city}</p>
            {s.directions && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.directions}</p>}
            <a href={s.mapsUrl} target="_blank" rel="noopener" className="btn-ghost mt-4"><Icon name="pin" className="h-4 w-4 text-red" /> Прокласти маршрут</a>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Телефон</p>
            {s.phones.map((p) => <a key={p} href={telHref(p)} className="mt-2 block font-display text-xl font-semibold hover:text-blue">{p}</a>)}
            {s.email && <a href={`mailto:${s.email}`} className="mt-2 block text-ink-soft hover:text-ink">{s.email}</a>}
            {phoneDigits && <a href={telHref(s.phones[0])} className="btn-accent mt-4 w-full sm:w-auto"><Icon name="phone" className="h-4 w-4" /> Зателефонувати</a>}
          </div>
          <div className="card p-6">
            <p className="eyebrow">Графік роботи</p>
            {s.hours.length ? (
              <dl className="mt-3 space-y-2">{s.hours.map((h) => <div key={h.days} className="flex justify-between gap-4 text-[15px]"><dt className="text-ink-soft">{h.days}</dt><dd className="font-semibold">{h.hours}</dd></div>)}</dl>
            ) : <p className="mt-2 text-ink-soft">{s.hoursNote}</p>}
          </div>
          {messengers.length > 0 && (
            <div className="card p-6">
              <p className="eyebrow">Ми в соцмережах і месенджерах</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {messengers.map((m) => <a key={m.label} href={m.href} target="_blank" rel="noopener" className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${m.tone}`}><Icon name={m.icon} className="h-4 w-4" /> {m.label}</a>)}
              </div>
            </div>
          )}
        </Reveal>
        <Reveal delay={0.08}><MapEmbed query={s.mapsQuery} url={s.mapsUrl} /></Reveal>
      </section>
      <section className="container-x py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="h-display text-center text-3xl">Напишіть нам</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">Поставте запитання — ми передзвонимо або напишемо зручним для вас способом.</p>
          <div className="mt-8"><RegistrationForm kind="question" /></div>
        </div>
      </section>
    </>
  );
}
