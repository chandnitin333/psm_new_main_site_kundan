import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // expose dev server on the LAN so a phone on the same Wi-Fi can open reports / scan QRs
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['psm_logo2.ico', 'apple-touch-icon.png', 'fonts/**/*'],
      manifest: {
        name: 'PSM - ग्रामपंचायत मालमत्ता व कर व्यवस्थापन',
        short_name: 'PSM',
        description: 'ग्रामपंचायत मालमत्ता नोंदणी, कर आकारणी व वसुली व्यवस्थापन प्रणाली',
        lang: 'mr',
        theme_color: '#764ba2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Lets the site detect its own installed PWA via navigator.getInstalledRelatedApps()
        // (Chrome/Android) so the install button/help never shows in the browser once installed.
        related_applications: [
          { platform: 'webapp', url: 'https://psm.gramvikas.co.in/manifest.webmanifest' },
        ],
      },
      workbox: {
        // custom push / notificationclick handlers merged into the generated SW
        importScripts: ['/push-sw.js'],
        // app bundle is > 2 MiB (Workbox default) — raise the precache limit
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // precache the built app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // SPA fallback so deep links work offline
        navigateFallback: '/index.html',
        // never let the SW intercept API calls — always go to network
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // cache GET API responses with network-first (fresh when online, fallback offline)
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // google maps embeds / tiles
            urlPattern: ({ url }) => url.origin.includes('google.com') || url.origin.includes('gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'maps-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        // enabled so the PWA (manifest + service worker + install prompt) can be
        // tested with `npm run dev`. Set back to false for normal development.
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
