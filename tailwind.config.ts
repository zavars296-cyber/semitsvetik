import type { Config } from 'tailwindcss';

// Brand palette — sampled from the seven petals of the original logo.
const petals = {
  red: { DEFAULT: '#C43C2A', soft: '#FBE9E6', deep: '#9E2E1F' },
  orange: { DEFAULT: '#E48C3C', soft: '#FDF0E3', deep: '#B9681F' },
  yellow: { DEFAULT: '#F2CA46', soft: '#FDF7DF', deep: '#B8901A' },
  green: { DEFAULT: '#4AA45A', soft: '#E6F4E8', deep: '#317A3F' },
  cyan: { DEFAULT: '#4498C9', soft: '#E3F0F8', deep: '#2B729E' },
  blue: { DEFAULT: '#24519E', soft: '#E4EAF5', deep: '#1A3C78' },
  violet: { DEFAULT: '#5A2D91', soft: '#EEE8F6', deep: '#3E2E78' },
};

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...petals,
        ink: { DEFAULT: '#1B1F3B', soft: '#4A4F6A', mute: '#7A7F96' },
        paper: { DEFAULT: '#FFFFFF', warm: '#FBFAF7', cool: '#F5F7FB' },
        line: '#E7E9F0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(27,31,59,.04), 0 8px 24px -8px rgba(27,31,59,.10)',
        lift: '0 2px 4px rgba(27,31,59,.04), 0 24px 48px -16px rgba(27,31,59,.18)',
      },
      backgroundImage: {
        spectrum: 'linear-gradient(90deg,#C43C2A,#E48C3C,#F2CA46,#4AA45A,#4498C9,#24519E,#5A2D91)',
      },
    },
  },
  plugins: [],
} satisfies Config;
