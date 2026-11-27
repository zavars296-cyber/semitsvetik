'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useContent } from '@/lib/content';
import { LogoMark } from '../Logo';
import { Petal } from '../Petal';
import { Icon } from '../Icon';
import { Reveal } from '../Reveal';
import { SectionHeading } from '../Section';
import { PostCard, ProgramCard, TeacherCard } from '../Cards';
import { RegistrationForm } from '../RegistrationForm';
import { MapEmbed } from '../MapEmbed';
import { img, telHref } from '@/lib/format';
import { t } from '@/lib/i18n';

const whyIcons = ['heart', 'smile', 'gift', 'pin'];
const whyTones = ['bg-red-soft text-red', 'bg-yellow-soft text-yellow-deep', 'bg-green-soft text-green-deep', 'bg-cyan-soft text-cyan-deep'];

function Hero() {
  const { settings: s } = useContent().content;
  const phone = s.phones[0];
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(242,202,70,.18),transparent),radial-gradient(50%_45%_at_10%_30%,rgba(68,152,201,.14),transparent),radial-gradient(40%_40%_at_70%_90%,rgba(90,45,145,.08),transparent)]" />
      <div className="container-x relative grid items-center gap-12 pb-16 pt-8 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink-soft shadow-soft ring-1 ring-line">
            <span className="h-2 w-2 rounded-full bg-green" /> {s.tagline}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-display mt-6 text-[40px] leading-[1.08] sm:text-6xl lg:text-[64px]">
            {s.heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-red via-orange to-yellow-deep bg-clip-text text-transparent">{s.heroTitle.split(' ').slice(-1)}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.7 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{s.heroText}</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.7 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register/" className="btn-accent !px-7 !py-4 text-base">{t.cta.register} <Icon name="arrow" className="h-4 w-4" /></Link>
            {phone && <a href={telHref(phone)} className="btn-ghost !px-6 !py-4 text-base"><Icon name="phone" className="h-4 w-4 text-green" /> {phone}</a>}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 text-red" /> {s.address}, {s.city}</span>
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-ink"><Icon name="instagram" className="h-4 w-4 text-violet" /> Instagram</a>}
          </motion.div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[520px]">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-[9%] rounded-full bg-white shadow-[0_40px_80px_-30px_rgba(27,31,59,.25),inset_0_0_0_1px_#EEF0F5]">
            <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff,#F5F7FB)]" />
            <div className="absolute inset-0 grid place-items-center">
              <LogoMark className="w-[66%] drop-shadow-[0_12px_18px_rgba(27,31,59,.12)]" />
            </div>
          </motion.div>
          {/* orbit ring in brand colours */}
          <div aria-hidden className="absolute inset-[4%] rounded-full p-[3px] opacity-70 [background:conic-gradient(#C43C2A,#E48C3C,#F2CA46,#4AA45A,#4498C9,#24519E,#5A2D91,#C43C2A)] [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_calc(100%-2px))]" />
          {([
            ['red', 'left-[0%] top-[14%] w-[13%]', -35, 0],
            ['yellow', 'right-[4%] top-[4%] w-[11%]', 25, 0.6],
            ['green', 'right-[-2%] top-[52%] w-[12%]', 70, 1.2],
            ['cyan', 'right-[18%] bottom-[0%] w-[9%]', 140, 0.3],
            ['violet', 'left-[8%] bottom-[6%] w-[12%]', -150, 0.9],
          ] as const).map(([c, pos, rot, d], i) => (
            <motion.div key={c} aria-hidden className={`absolute ${pos}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: [0, -10, 0] }}
              transition={{ opacity: { delay: 0.4 + i * 0.08 }, y: { duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay: d } }}>
              <Petal color={c} rotate={rot} id={`hero-${c}`} className="w-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeView() {
  const { settings: s, programs, teachers, posts, photos, testimonials } = useContent().content;
  const active = programs.filter((p) => p.is_active);
  const now = Date.now();
  const latest = [...posts].sort((a, b) => {
    const ua = a.event_date && new Date(a.event_date).getTime() > now ? 0 : 1;
    const ub = b.event_date && new Date(b.event_date).getTime() > now ? 0 : 1;
    return ua - ub || new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
  }).slice(0, 3);

  return (
    <>
      <Hero />

      <section className="container-x py-16 sm:py-20" id="programs">
        <SectionHeading eyebrow="Наші програми" title="Усе для гармонійного розвитку дитини"
          text="Обирайте напрям — або приходьте на знайомство, і ми разом підберемо найкраще для вашої дитини."
          action={<Link href="/programs/" className="btn-ghost shrink-0">{t.cta.allPrograms} <Icon name="arrow" className="h-4 w-4" /></Link>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {active.map((p, i) => <Reveal key={p.id} delay={i * 0.06}><ProgramCard p={p} /></Reveal>)}
        </div>
        <Reveal className="mt-5">
          <Link href="/birthday/" className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-violet via-blue to-cyan p-7 text-white shadow-soft transition hover:shadow-lift sm:flex-row sm:items-center sm:p-8">
            <div aria-hidden className="absolute -right-6 -top-10 w-28 opacity-90 sm:w-32"><Petal color="yellow" id="bday-y" rotate={35} /></div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><Icon name="gift" className="h-7 w-7" /></div>
            <div className="relative flex-1">
              <h3 className="font-display text-xl font-semibold">Дні народження та дитячі свята</h3>
              <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-white/80">Свято для іменинника та друзів — весело для дітей і без клопоту для батьків.</p>
            </div>
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">Детальніше <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-paper-cool py-16 sm:py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Чому обирають нас" title="Батьки спокійні — діти щасливі" center />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {s.whyUs.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.07}>
                <div className="card h-full p-7">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${whyTones[i % 4]}`}><Icon name={whyIcons[i % 4]} className="h-6 w-6" /></div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{w.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow"><span className="h-1.5 w-6 rounded-full bg-spectrum" />Наша команда</p>
            <h2 className="h-display mt-3 text-3xl sm:text-4xl">Педагоги, яким довіряють найдорожче</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">{s.teamText}</p>
            <Link href="/teachers/" className="btn-primary mt-7">Познайомитися з командою <Icon name="arrow" className="h-4 w-4" /></Link>
          </Reveal>
          {teachers.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {teachers.slice(0, 2).map((tt, i) => <Reveal key={tt.id} delay={i * 0.1}><TeacherCard t={tt} /></Reveal>)}
            </div>
          ) : (
            <Reveal delay={0.1}>
              <div className="card relative overflow-hidden p-8 sm:p-10">
                <div aria-hidden className="absolute -right-10 -top-10 w-40 opacity-90"><Petal color="cyan" id="team-c" rotate={30} /></div>
                <div aria-hidden className="absolute -bottom-12 right-16 w-28 opacity-90"><Petal color="yellow" id="team-y" rotate={-160} /></div>
                <blockquote className="relative max-w-md font-display text-2xl leading-snug text-ink">«{s.aboutPhilosophy.split('.')[0]}.»</blockquote>
                <p className="relative mt-5 text-sm font-medium text-ink-mute">— підхід центру «Семицвіт»</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="bg-paper-cool py-16 sm:py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Галерея" title="Життя центру в кадрі"
            action={<Link href="/gallery/" className="btn-ghost shrink-0">Уся галерея <Icon name="arrow" className="h-4 w-4" /></Link>} />
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.slice(0, 8).map((ph, i) => (
                <Reveal key={ph.id} delay={i * 0.04} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(ph.url)} alt={ph.caption || 'Фото з центру «Семицвіт»'} loading="lazy" className="aspect-square h-full w-full rounded-3xl object-cover" />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <a href={s.instagram} target="_blank" rel="noopener" className="card group flex flex-col items-center gap-5 p-10 text-center sm:flex-row sm:text-left">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange via-red to-violet text-white"><Icon name="instagram" className="h-8 w-8" /></div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">Свіжі фото та відео — в нашому Instagram</h3>
                  <p className="mt-2 text-ink-soft">Заняття, свята та будні центру щодня. Фотогалерея на сайті скоро поповниться.</p>
                </div>
                <span className="btn-primary">Перейти <Icon name="external" className="h-4 w-4" /></span>
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="container-x py-16 sm:py-24">
          <SectionHeading eyebrow="Новини та події" title="Що відбувається у «Семицвіті»"
            action={<Link href="/news/" className="btn-ghost shrink-0">{t.cta.allNews} <Icon name="arrow" className="h-4 w-4" /></Link>} />
          <div className="grid gap-5 md:grid-cols-3">
            {latest.map((p, i) => <Reveal key={p.id} delay={i * 0.07}><PostCard post={p} /></Reveal>)}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="bg-paper-cool py-16 sm:py-24">
          <div className="container-x">
            <SectionHeading eyebrow="Відгуки" title="Що кажуть батьки" center />
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.slice(0, 3).map((r, i) => (
                <Reveal key={r.id} delay={i * 0.07}>
                  <figure className="card h-full p-7">
                    <div className="flex gap-1 text-yellow">{Array.from({ length: 5 }).map((_, k) => <Icon key={k} name="star" className="h-4 w-4 fill-current" />)}</div>
                    <blockquote className="mt-4 text-[15px] leading-relaxed text-ink-soft">“{r.text}”</blockquote>
                    <figcaption className="mt-5 text-sm font-semibold">{r.author}{r.source && <span className="font-normal text-ink-mute"> · {r.source}</span>}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-16 sm:py-24" id="contact">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <p className="eyebrow"><span className="h-1.5 w-6 rounded-full bg-spectrum" />Запис і контакти</p>
            <h2 className="h-display mt-3 text-3xl sm:text-4xl">Приходьте знайомитися!</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">Залиште заявку — ми зателефонуємо, відповімо на запитання та запросимо на знайомство з центром.</p>
            <ul className="mt-8 space-y-4">
              <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-soft text-red"><Icon name="pin" /></span><div><p className="text-sm text-ink-mute">Адреса</p><p className="font-medium">{s.address}, {s.city}</p></div></li>
              {s.phones.map((p) => <li key={p} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-soft text-green-deep"><Icon name="phone" /></span><div><p className="text-sm text-ink-mute">Телефон</p><a href={telHref(p)} className="font-medium hover:text-blue">{p}</a></div></li>)}
              <li className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-soft text-blue"><Icon name="clock" /></span><div><p className="text-sm text-ink-mute">Графік роботи</p>{s.hours.length ? s.hours.map((h) => <p key={h.days} className="font-medium">{h.days}: {h.hours}</p>) : <p className="font-medium">{s.hoursNote}</p>}</div></li>
            </ul>
            <div className="mt-8"><MapEmbed query={s.mapsQuery} url={s.mapsUrl} /></div>
          </Reveal>
          <Reveal delay={0.1}><RegistrationForm /></Reveal>
        </div>
      </section>
    </>
  );
}
