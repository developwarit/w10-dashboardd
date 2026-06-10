import daisyui from 'daisyui';
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app.vue',
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        egat: {
          navy: '#16295f',
          blue: '#1e40af',
          cyan: '#06b6d4',
          green: '#10b981',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        egat: {
          primary: '#1e40af',
          secondary: '#06b6d4',
          accent: '#10b981',
          neutral: '#16295f',
          'base-100': '#f3f6fb',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
  },
} satisfies Config;
