// noinspection JSUnusedGlobalSymbols
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#94E170',
        secondary: '#FFFBD3',
        accent: '#FD9494',
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        mono: ['"Anonymous Pro"', 'monospace'],
      },
      gridTemplateRows: {
        main: '3rem minmax(0, 4fr) minmax(0, 6fr)',
      },
    },
  },
  plugins: [],
};
