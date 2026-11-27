'use client';

import { useState } from 'react';
import { useContent } from '@/lib/content';
import { PageHero } from '../Section';
import { Reveal } from '../Reveal';
import { PostCard } from '../Cards';
import { kindLabel } from '@/lib/format';

export function NewsView() {
  const { posts } = useContent().content;
  const [kind, setKind] = useState('all');
  const now = Date.now();
  const upcoming = posts.filter((p) => p.event_date && new Date(p.event_date).getTime() >= now - 864e5)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime());
  const list = posts.filter((p) => kind === 'all' || p.kind === kind);
  const kinds = Array.from(new Set(posts.map((p) => p.kind)));
  return (
    <>
      <PageHero eyebrow="Новини" title="Новини та події" text="Свята, майстер-класи, оголошення та все, що відбувається в центрі." />
      {upcoming.length > 0 && (
        <section className="container-x pb-10">
          <h2 className="h-display mb-5 text-2xl">Найближчі події</h2>
          <div className="grid gap-5 md:grid-cols-3">{upcoming.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
      <section className="container-x py-4">
        {kinds.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {['all', ...kinds].map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${kind === k ? 'bg-ink text-white ring-ink' : 'text-ink-soft ring-line'}`}>
                {k === 'all' ? 'Усе' : kindLabel[k]}
              </button>
            ))}
          </div>
        )}
        <h2 className="h-display mb-5 text-2xl">Усі публікації</h2>
        {list.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 0.05}><PostCard post={p} /></Reveal>)}</div>
        ) : <p className="card p-10 text-center text-ink-soft">Новини скоро з’являться.</p>}
      </section>
    </>
  );
}
