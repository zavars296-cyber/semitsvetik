'use client';

import { useContent } from '@/lib/content';

export function PreviewBanner() {
  const { preview } = useContent();
  if (!preview) return null;
  return (
    <div className="sticky top-0 z-50 bg-violet px-4 py-2 text-center text-sm font-medium text-white">
      Режим попереднього перегляду: показано також неопубліковані чернетки. Відвідувачі їх не бачать.
    </div>
  );
}
