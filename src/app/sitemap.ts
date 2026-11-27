import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { staticContent } from '@/lib/snapshot';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', 'about/', 'programs/', 'teachers/', 'gallery/', 'news/', 'birthday/', 'contacts/', 'register/', 'privacy/'];
  const posts = staticContent.posts.map((p) => ({ url: `${SITE_URL}/news/post/?slug=${p.slug}`, lastModified: p.published_at || undefined }));
  return [...pages.map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: 'weekly' as const, priority: p ? 0.7 : 1 })), ...posts];
}
