import type { BrandColor } from '@/lib/types';

const tones: Record<BrandColor, [string, string, string]> = {
  red: ['#F07A63', '#C43C2A', '#8F2618'],
  orange: ['#F8B26E', '#E48C3C', '#B5621B'],
  yellow: ['#FFE38A', '#F2CA46', '#C89B17'],
  green: ['#86D193', '#4AA45A', '#2D7239'],
  cyan: ['#8CCBEE', '#4498C9', '#256F9C'],
  blue: ['#5C86D1', '#24519E', '#14336E'],
  violet: ['#9A6BD6', '#5A2D91', '#2E1A57'],
};

/** Decorative glossy "3D" petal. Purely ornamental — the brand logo is always the original image. */
export function Petal({ color, className = '', rotate = 0, id }: { color: BrandColor; className?: string; rotate?: number; id: string }) {
  const [light, mid, dark] = tones[color];
  return (
    <svg viewBox="0 0 100 130" className={className} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <defs>
        <radialGradient id={`pg-${id}`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`ph-${id}`} cx="35%" cy="22%" r="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`ps-${id}`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor={dark} floodOpacity=".28" />
        </filter>
      </defs>
      <path d="M50 4C76 4 94 34 94 66c0 34-20 60-44 60S6 100 6 66C6 34 24 4 50 4z" fill={`url(#pg-${id})`} filter={`url(#ps-${id})`} />
      <path d="M50 4C76 4 94 34 94 66c0 34-20 60-44 60S6 100 6 66C6 34 24 4 50 4z" fill={`url(#ph-${id})`} />
    </svg>
  );
}

export const petalOrder: BrandColor[] = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet'];
