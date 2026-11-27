'use client';

import Link from 'next/link';
import { useContent } from '@/lib/content';
import { PageHero, SectionHeading } from '../Section';
import { Reveal } from '../Reveal';
import { Icon } from '../Icon';
import { LogoMark } from '../Logo';
import { TeacherCard, colorClasses } from '../Cards';
import { img, paragraphs } from '@/lib/format';
import { petalOrder } from '../Petal';

const tones = ['bg-red-soft text-red', 'bg-orange-soft text-orange-deep', 'bg-green-soft text-green-deep', 'bg-blue-soft text-blue', 'bg-violet-soft text-violet', 'bg-cyan-soft text-cyan-deep'];

export function AboutView() {
  const { settings: s, teachers, photos, albums } = useContent().content;
  const facility = photos.filter((p) => albums.find((a) => a.id === p.album_id)?.category === 'classrooms').slice(0, 6);
  return (
    <>
      <PageHero eyebrow="Про нас" title={s.fullName} text={s.aboutIntro} />
      <section className="container-x grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <Reveal>
          <h2 className="h-display text-3xl">Наша філософія</h2>
          <div className="prose-text mt-5 text-[17px]">{paragraphs(s.aboutPhilosophy).map((p) => <p key={p}>{p}</p>)}</div>
          {s.aboutHistory && (<><h2 className="h-display mt-10 text-3xl">Історія центру</h2><div className="prose-text mt-5 text-[17px]">{paragraphs(s.aboutHistory).map((p) => <p key={p}>{p}</p>)}</div></>)}
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card relative grid aspect-square place-items-center overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#fff_35%,#F5F7FB)]" />
            <LogoMark className="relative w-3/5" />
            <div className="absolute inset-x-8 bottom-8 flex justify-center gap-1.5">
              {petalOrder.map((c) => <span key={c} className={`h-1.5 flex-1 rounded-full ${colorClasses[c].bg}`} />)}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-x py-14">
        <SectionHeading eyebrow="Цінності" title="Що для нас важливо" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="card h-full p-7">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl font-display font-semibold ${tones[i % tones.length]}`}>{i + 1}</span>
                <h3 className="mt-5 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {facility.length > 0 && (
        <section className="container-x py-14">
          <SectionHeading eyebrow="Простір" title="Наші кімнати" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {facility.map((p) => <img key={p.id} src={img(p.url)} alt={p.caption || 'Приміщення центру'} loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover" />)}
          </div>
        </section>
      )}

      <section className="container-x py-14">
        <SectionHeading eyebrow="Команда" title="Наші педагоги" text={teachers.length ? undefined : s.teamText}
          action={<Link href="/teachers/" className="btn-ghost shrink-0">Уся команда <Icon name="arrow" className="h-4 w-4" /></Link>} />
        {teachers.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{teachers.slice(0, 3).map((t) => <TeacherCard key={t.id} t={t} />)}</div>}
      </section>
    </>
  );
}
