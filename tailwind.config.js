/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['resources/**/*.{edge,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Seravek', 'Gill Sans Nova', 'Ubuntu', 'Calibri', 'DejaVu Sans', 'source-sans-pro', 'sans-serif'],
        'mono': ['ui-monospace', 'Cascadia Code', 'Source Code Pro', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}

