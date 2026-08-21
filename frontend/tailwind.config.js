/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFEDE6', card: '#F9F8F4', ink: '#232A3B',
        'ink-soft': '#667080', hairline: '#D8D3C5',
        paid: '#2F7D5C', 'paid-soft': '#E7EEE9', due: '#A63D2F',
        'due-soft': '#F7E7E3', brass: '#B47B25', 'brass-dark': '#8A611F',
        partial: '#B8860B', 'partial-soft': '#F6EED9',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        ledger: '0 12px 30px -20px rgba(35, 42, 59, 0.22)',
      },
    },
  },
  plugins: [],
};
