/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['resources/**/*.{edge,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}

