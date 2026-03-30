import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const require = createRequire(import.meta.url)
const tailwindNesting = require('tailwindcss/nesting')

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: ['resources/css/app.css', 'resources/js/app.js'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindNesting, tailwindcss, autoprefixer],
    },
  },
  build: {
    // Optimize for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Alpine.js into its own chunk for better caching
          alpine: ['alpinejs'],
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['alpinejs'],
  },
})
