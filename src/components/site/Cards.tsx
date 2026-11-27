import Link from 'next/link';
import type { BrandColor, Post, Program, Teacher } from '@/lib/types';
import { Icon } from './Icon';
import { formatDate, formatDayMonth, img, kindLabel } from '@/lib/format';

export const programIcon: Record<string, string> = {
  'mini-sadok': 'home', 'rozvyvaiuchi-zaniattia': 'puzzle', 'pidhotovka-do-shkoly': 'book', lohoped: 'chat',
  'anhliiska-mova': 'globe', 'mentalna-aryfmetyka': 'star', 'tvorcha-studiia': 'pencil', khoreohrafiia: 'music',
};

export const colorClasses: Record<BrandColor, { bg: string; soft: string; text: string; ring: string }> = {
  red: { bg: 'bg-red', soft: 'bg-red-soft', text: 'text-red', ring: 'ring-red/20' },
  orange: { bg: 'bg-orange', soft: 'bg-orange-soft', text: 'text-orange-deep', ring: 'ring-orange/20' },
  yellow: { bg: 'bg-yellow', soft: 'bg-yellow-soft', text: 'text-yellow-deep', ring: 'ring-yellow/30' },
  green: { bg: 'bg-green', soft: 'bg-green-soft', text: 'text-green-deep', ring: 'ring-green/20' },
  cyan: { bg: 'bg-cyan', soft: 'bg-cyan-soft', text: 'text-cyan-deep', ring: 'ring-cyan/20' },
  blue: { bg: 'bg-blue', soft: 'bg-blue-soft', text: 'text-blue', ring: 'ring-blue/20' },
  violet: { bg: 'bg-violet', soft: 'bg-violet-soft', text: 'text-violet', ring: 'ring-violet/20' },
};

export function ProgramCard({ p }: { p: Program }) {
  const c = colorClasses[p.color] || colorClasses.blue;
  return (
    <Link href={`/programs/#${p.slug}`} className="group card relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className={`absolute inset-x-0 top-0 h-1 ${c.bg}`} />
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img(p.image_url)} alt="" loading="lazy" className="-mx-6 -mt-6 mb-5 aspect-[16/10] w-[calc(100%+3rem)] max-w-none object-cover" />
      ) : (
        <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${c.soft} ${c.text}`}>
          <Icon name={programIcon[p.slug] || 'sparkle'} className="h-7 w-7" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-ink">{p.title}</h3>
      {p.age_group && <p className={`mt-1 text-sm font-semibold ${c.text}`}>{p.age_group}</p>}
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-soft">{p.short}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
        Детальніше <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

const kindColor: Record<string, string> = { news: 'bg-blue-soft text-blue', event: 'bg-red-soft text-red', workshop: 'bg-green-soft text-green-deep', announcement: 'bg-yellow-soft text-yellow-deep' };

export function PostCard({ post }: { post: Post }) {
  const dm = formatDayMonth(post.event_date);
  return (
    <Link href={`/news/post/?slug=${post.slug}`} className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden bg-paper-cool">
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(post.cover_url)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-yellow-soft via-white to-violet-soft">
            {post.event_date ? (
              <div className="text-center">
                <p className="font-display text-6xl font-semibold text-red">{dm.day}</p>
                <p className="mt-1 font-display text-lg text-ink">{dm.month}</p>
              </div>
            ) : <Icon name="sparkle" className="h-12 w-12 text-orange" />}
          </div>
        )}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${kindColor[post.kind] || kindColor.news}`}>{kindLabel[post.kind]}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-mute">
          {post.event_date ? `Дата: ${formatDate(post.event_date)}` : formatDate(post.published_at || post.created_at)}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export function TeacherCard({ t }: { t: Teacher }) {
  return (
    <article className="card overflow-hidden">
      <div className="aspect-[4/5] bg-gradient-to-br from-cyan-soft to-violet-soft">
        {t.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(t.photo_url)} alt={t.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-violet/50"><Icon name="user" className="h-16 w-16" strokeWidth={1.2} /></div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-ink">{t.full_name}</h3>
        {t.position && <p className="mt-1 text-sm font-semibold text-violet">{t.position}</p>}
        {t.qualifications && <p className="mt-3 text-sm text-ink-soft">{t.qualifications}</p>}
        {t.bio && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t.bio}</p>}
      </div>
    </article>
  );
}
