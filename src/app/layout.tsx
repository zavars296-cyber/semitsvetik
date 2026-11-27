import type { Metadata, Viewport } from 'next';
import { Onest, Unbounded } from 'next/font/google';
import './globals.css';
import { SITE_URL, asset } from '@/lib/config';
import { staticContent } from '@/lib/snapshot';

const display = Unbounded({ subsets: ['latin', 'cyrillic'], weight: ['500', '600'], variable: '--font-display', display: 'swap' });
const sans = Onest({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' });

const s = staticContent.settings;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL + '/'),
  title: { default: s.seoTitle, template: `%s — ${s.name}` },
  description: s.seoDescription,
  applicationName: s.fullName,
  openGraph: {
    type: 'website', locale: 'uk_UA', siteName: s.fullName, title: s.seoTitle, description: s.seoDescription,
    images: [{ url: asset('/brand/og.png'), width: 1200, height: 630, alt: s.fullName }],
  },
  twitter: { card: 'summary_large_image', title: s.seoTitle, description: s.seoDescription },
  icons: { icon: asset('/brand/favicon.png'), apple: asset('/brand/apple-touch-icon.png') },
};

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
