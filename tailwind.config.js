/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

export default {
  darkMode: 'class',
  content: ['resources/**/*.{edge,js,ts,jsx,tsx,vue}', 'app/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: [
          'ui-monospace',
          'Cascadia Code',
          'Source Code Pro',
          'Menlo',
          'Consolas',
          'DejaVu Sans Mono',
          'monospace',
        ],
      },
      // Standardized transition timings for consistency
      transitionDuration: {
        theme: '200ms',
        interactive: '200ms',
        animation: '300ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Brand gradients
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      // Custom animations moved from CSS
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
        pulseWarning: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-warning': 'pulseWarning 2s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Custom components for DRY code
    plugin(({ addComponents }) => {
      addComponents({
        // Consistent transition for theme changes
        '.transition-theme': {
          transition:
            'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), ' +
            'color 200ms cubic-bezier(0.4, 0, 0.2, 1), ' +
            'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      })
    }),
  ],
}
