import { ContentProvider } from '@/lib/content';
import { staticContent } from '@/lib/snapshot';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileBar } from '@/components/site/MobileBar';
import { PreviewBanner } from '@/components/site/PreviewBanner';
import { SITE_URL } from '@/lib/config';

function jsonLd() {
  const s = staticContent.settings;
  return {
    '@context': 'https://schema.org',
    '@type': 'ChildCare',
    name: s.fullName,
    alternateName: ['Семицвіт', 'Семицветик'],
    description: s.seoDescription,
    url: SITE_URL + '/',
    logo: `${SITE_URL}/brand/logo.png`,
    image: `${SITE_URL}/brand/og.png`,
    telephone: s.phones[0] || undefined,
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: s.city, addressCountry: 'UA' },
    sameAs: [s.instagram, s.facebook].filter(Boolean),
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContentProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">До змісту</a>
      <PreviewBanner />
      <Header />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">{children}</main>
      <Footer />
      <MobileBar />
    </ContentProvider>
  );
}
