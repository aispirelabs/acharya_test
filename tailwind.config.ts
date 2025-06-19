import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      keyframes: {
        hover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3.5px)' },
        },
        pulseY: {
          '0%': { transform: 'scale(1,1)' },
          '100%': { transform: 'scale(1.2,1.2)' },
        },
      },
      animation: {
        hover: 'hover 1.4s infinite alternate ease-in-out',
        pulseY: 'pulseY 1s infinite alternate',
      },
      colors: {
        neutral30: 'var(--Neutral-30)',
        neutral80: 'var(--Neutral-80)',
      },
    },
  },
};

export default config;