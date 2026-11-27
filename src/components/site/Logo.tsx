import { asset } from '@/lib/config';

/** The ORIGINAL logo (seven petals), cropped pixel-for-pixel from the centre's Instagram avatar. Never redraw. */
export function LogoMark({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset('/brand/logo.png')} alt="Логотип дитячого центру «Семицвіт»" width={524} height={378} className={className} />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? 'h-8 w-auto' : 'h-10 w-auto'} />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-semibold tracking-tight text-ink">Семицвіт</span>
        {!compact && <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">дитячий центр</span>}
      </span>
    </span>
  );
}
