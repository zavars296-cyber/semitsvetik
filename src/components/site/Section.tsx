import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionHeading({ eyebrow, title, text, center = false, action }: { eyebrow?: string; title: string; text?: string; center?: boolean; action?: ReactNode }) {
  return (
    <Reveal className={`mb-10 flex flex-col gap-4 md:mb-12 ${center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={center ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && <p className="eyebrow"><span className="h-1.5 w-6 rounded-full bg-spectrum" />{eyebrow}</p>}
        <h2 className="h-display mt-3 text-3xl sm:text-4xl">{title}</h2>
        {text && <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{text}</p>}
      </div>
      {action}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-yellow/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" />
      <div className="container-x relative pb-10 pt-10 sm:pt-16">
        <Reveal>
          {eyebrow && <p className="eyebrow"><span className="h-1.5 w-6 rounded-full bg-spectrum" />{eyebrow}</p>}
          <h1 className="h-display mt-4 max-w-3xl text-4xl sm:text-5xl">{title}</h1>
          {text && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{text}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
