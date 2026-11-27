'use client';

import Link from 'next/link';
import { useContent } from '@/lib/content';
import { telHref } from '@/lib/format';
import { Icon } from './Icon';

/** Sticky bottom bar on phones: call + sign up. */
export function MobileBar() {
  const phone = useContent().content.settings.phones[0];
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur sm:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="flex gap-2">
        {phone && <a href={telHref(phone)} className="btn-ghost flex-1 !py-3"><Icon name="phone" className="h-4 w-4 text-green" /> Подзвонити</a>}
        <Link href="/register/" className="btn-accent flex-1 !py-3">Записатися</Link>
      </div>
    </div>
  );
}
