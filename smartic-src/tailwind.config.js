/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg-2)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        line: 'var(--line)',
        brand: '#3200ff',
      },
      fontFamily: {
        sans: ['"Noto Sans Armenian Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif Armenian Variable"', 'Georgia', 'serif'],
      },
      maxWidth: { editorial: '1240px' },
    },
  },
  plugins: [],
};
