'use client';

import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Reveal } from '../Reveal';
import { TeacherCard } from '../Cards';
import { Icon } from '../Icon';

export function TeachersView() {
  const { teachers, settings } = useContent().content;
  return (
    <>
      <PageHero eyebrow="Команда" title="Наші педагоги" text="Люди, які щодня створюють для дітей атмосферу турботи, відкриттів і радості." />
      <section className="container-x py-6">
        {teachers.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t, i) => <Reveal key={t.id} delay={(i % 3) * 0.06}><TeacherCard t={t} /></Reveal>)}
          </div>
        ) : (
          <div className="card flex flex-col items-center p-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-violet-soft text-violet"><Icon name="user" className="h-8 w-8" /></div>
            <p className="mt-5 max-w-lg text-ink-soft">{settings.teamText}</p>
          </div>
        )}
      </section>
    </>
  );
}
