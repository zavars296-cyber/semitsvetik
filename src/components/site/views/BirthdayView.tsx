'use client';

import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Reveal } from '../Reveal';
import { Icon } from '../Icon';
import { Petal } from '../Petal';
import { RegistrationForm } from '../RegistrationForm';

const icons = ['sparkle', 'gift', 'image', 'music', 'heart', 'star'];
const tones = ['bg-red-soft text-red', 'bg-yellow-soft text-yellow-deep', 'bg-cyan-soft text-cyan-deep', 'bg-green-soft text-green-deep', 'bg-violet-soft text-violet', 'bg-orange-soft text-orange-deep'];

export function BirthdayView() {
  const { settings: s } = useContent().content;
  return (
    <>
      <PageHero eyebrow="Свята" title="Дні народження та дитячі свята" text={s.birthdayIntro} />
      <section className="container-x py-6">
        <div className="grid gap-5 md:grid-cols-3">
          {s.birthdayItems.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.06}>
              <div className="card h-full p-7">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[i % tones.length]}`}><Icon name={icons[i % icons.length]} className="h-6 w-6" /></span>
                <h3 className="mt-5 font-display text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-mute">Програму, тривалість, кількість гостей і вартість свята обговоримо індивідуально.</p>
      </section>
      <section className="container-x relative grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div aria-hidden className="absolute -left-6 top-10 hidden w-24 lg:block"><Petal color="yellow" id="bd-y" rotate={-20} /></div>
        <Reveal className="relative lg:pl-20">
          <h2 className="h-display text-3xl sm:text-4xl">Замовити свято</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">Залиште заявку: вкажіть вік іменинника та бажану дату в коментарі — ми зателефонуємо й запропонуємо варіанти.</p>
        </Reveal>
        <Reveal delay={0.1}><RegistrationForm kind="birthday" /></Reveal>
      </section>
    </>
  );
}
