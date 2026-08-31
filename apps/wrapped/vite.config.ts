import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const editionCacheVersion = process.env.VITE_EDITION_CACHE_VERSION ?? 'edition-v1'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Bundestag Wrapped',
        short_name: 'BT Wrapped',
        description: 'Entdecke die Sprache des Bundestags mit interaktiven, editionsbasierten Statistiken.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'de',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Edition URLs contain both the edition and its immutable dataVersion.
        // That makes CacheFirst safe without ever serving one edition's data for another.
        runtimeCaching: [
          {
            urlPattern: /\/data\/[^/]+\/[^/]+\/wrapped\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `wrapped-data-${editionCacheVersion}`,
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /\/data\/[^/]+\/[^/]+\/speakers\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `speaker-data-${editionCacheVersion}`,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /\/data\/[^/]+\/[^/]+\/speeches.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `speeches-data-${editionCacheVersion}`,
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /\/data\/[^/]+\/[^/]+\/words.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `words-data-${editionCacheVersion}`,
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /\/fonts\/.*\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
        // Pre-cache critical assets
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don't pre-cache large JSON files (they'll be runtime cached)
        globIgnores: ['**/speeches_*.json', '**/words_index.json'],
      },
    }),
  ],
  resolve: {
    // The web and Expo workspaces intentionally use different React versions.
    // Always resolve one app-local React instance for web dependencies and peers.
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8's bundler only accepts the function form of manualChunks.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (/[\\/](react|react-dom|react-router)[\\/]/.test(id)) return 'vendor-react'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (/[\\/]motion[\\/]/.test(id)) return 'vendor-motion'
          if (id.includes('lucide-react')) return 'vendor-icons'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
