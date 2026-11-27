'use client';

import Link from 'next/link';
import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Reveal } from '../Reveal';
import { Icon } from '../Icon';
import { colorClasses, programIcon } from '../Cards';
import { img, paragraphs, time, weekdaysShort } from '@/lib/format';

export function ProgramsView() {
  const { programs, schedule, teachers } = useContent().content;
  const list = programs;
  return (
    <>
      <PageHero eyebrow="Програми" title="Програми та заняття" text="Оберіть напрям, який підходить вашій дитині. Вік, розклад і вартість уточнюйте у адміністратора — ми допоможемо з вибором.">
        <div className="mt-7 flex flex-wrap gap-2">
          {list.map((p) => (
            <a key={p.id} href={`#${p.slug}`} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${colorClasses[p.color]?.soft} ${colorClasses[p.color]?.text} ${colorClasses[p.color]?.ring}`}>{p.title}</a>
          ))}
        </div>
      </PageHero>
      <div className="container-x space-y-6 py-6">
        {list.map((p, i) => {
          const c = colorClasses[p.color] || colorClasses.blue;
          const slots = schedule.filter((s) => s.program_id === p.id);
          return (
            <Reveal key={p.id}>
              <article id={p.slug} className="card scroll-mt-28 overflow-hidden">
                <div className={`h-1.5 ${c.bg}`} />
                <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${c.soft} ${c.text}`}><Icon name={programIcon[p.slug] || 'sparkle'} className="h-7 w-7" /></span>
                      <div>
                        <h2 className="h-display text-2xl sm:text-3xl">{p.title}</h2>
                        {!p.is_published && <span className="mt-1 inline-block rounded-full bg-yellow-soft px-2.5 py-0.5 text-xs font-semibold text-yellow-deep">Чернетка — не опубліковано</span>}
                        {!p.is_active && p.is_published && <span className="mt-1 inline-block rounded-full bg-paper-cool px-2.5 py-0.5 text-xs font-semibold text-ink-mute">Набір тимчасово закрито</span>}
                      </div>
                    </div>
                    <p className="mt-5 text-lg leading-relaxed text-ink">{p.short}</p>
                    <div className="prose-text mt-4">{paragraphs(p.description).map((t) => <p key={t}>{t}</p>)}</div>
                    {p.photos.length > 0 && (
                      <div className="mt-6 grid grid-cols-3 gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.photos.slice(0, 6).map((u) => <img key={u} src={img(u)} alt={p.title} loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />)}
                      </div>
                    )}
                  </div>
                  <aside className="flex flex-col gap-3 rounded-3xl bg-paper-cool p-6">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img(p.image_url)} alt={p.title} loading="lazy" className="mb-2 aspect-[4/3] w-full rounded-2xl object-cover" />
                    )}
                    <Fact label="Вік" value={p.age_group} />
                    <Fact label="Розклад" value={p.schedule_text} />
                    {slots.length > 0 && (
                      <ul className="space-y-1.5 text-sm">
                        {slots.map((s) => (
                          <li key={s.id} className="flex justify-between gap-3 rounded-xl bg-white px-3 py-2">
                            <span className="font-semibold">{weekdaysShort[s.weekday]}</span>
                            <span>{time(s.start_time)}{s.end_time ? `–${time(s.end_time)}` : ''}</span>
                            <span className="truncate text-ink-mute">{s.group_name || teachers.find((t) => t.id === s.teacher_id)?.full_name || ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Fact label="Вартість" value={p.price_text} />
                    {p.is_active && <Link href={`/register/?program=${p.slug}`} className="btn-accent mt-auto w-full !py-3.5">Записатися</Link>}
                  </aside>
                </div>
              </article>
            </Reveal>
          );
        })}
        {list.length === 0 && <p className="card p-10 text-center text-ink-soft">Програми скоро з’являться.</p>}
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line pb-3 text-sm last:border-0">
      <span className="text-ink-mute">{label}</span>
      <span className="text-right font-medium text-ink">{value || 'уточнюйте за телефоном'}</span>
    </div>
  );
}
