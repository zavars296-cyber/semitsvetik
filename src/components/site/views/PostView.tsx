'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useContent } from '@/lib/content';
import { Icon } from '../Icon';
import { formatDate, img, kindLabel, paragraphs } from '@/lib/format';
import type { Post } from '@/lib/types';

export function PostView() {
  const { posts, settings } = useContent().content;
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => setSlug(new URLSearchParams(window.location.search).get('slug')), []);
  const post: Post | undefined = posts.find((p) => p.slug === slug);

  useEffect(() => { if (post) document.title = `${post.title} — ${settings.name}`; }, [post, settings.name]);

  if (slug === null) return <div className="container-x py-24" />;
  if (!post) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="h-display text-3xl">Публікацію не знайдено</h1>
        <Link href="/news/" className="btn-primary mt-6">До новин</Link>
      </div>
    );
  }
  return (
    <article className="container-x max-w-3xl py-10 sm:py-16">
      <Link href="/news/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"><Icon name="arrow" className="h-4 w-4 rotate-180" /> Усі новини</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-red">{kindLabel[post.kind]}</p>
      <h1 className="h-display mt-3 text-4xl sm:text-5xl">{post.title}</h1>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-ink-soft">
        {post.event_date && <span className="inline-flex items-center gap-2 rounded-full bg-red-soft px-3 py-1.5 font-semibold text-red"><Icon name="calendar" className="h-4 w-4" /> {formatDate(post.event_date)}</span>}
        {post.published_at && <span className="py-1.5">Опубліковано {formatDate(post.published_at)}</span>}
      </div>
      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img(post.cover_url)} alt="" className="mt-8 w-full rounded-4xl object-cover" />
      )}
      <div className="prose-text mt-8 whitespace-pre-line text-[17px]">{paragraphs(post.body).map((p) => <p key={p}>{p}</p>)}</div>
      <div className="mt-10 flex flex-col gap-3 rounded-3xl bg-paper-cool p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">Маєте запитання? Ми з радістю відповімо.</p>
        <Link href="/register/" className="btn-accent">Залишити заявку</Link>
      </div>
    </article>
  );
}
