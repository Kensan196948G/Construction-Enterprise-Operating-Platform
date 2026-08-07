/// <reference lib="webworker" />
/**
 * Service Worker — Workbox (precache + runtime + Background Sync).
 *
 * - 静的アセット: precache (vite-plugin-pwa injectManifest)
 * - /api/v1/* (GET): NetworkFirst, 5s timeout, 7日キャッシュ
 * - /api/v1/sync/push (POST): Background Sync で再送
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST || []);

// API GET — NetworkFirst
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/v1/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'cdx-site-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Sync push — Background Sync で再送
const bgSyncPlugin = new BackgroundSyncPlugin('cdx-site-sync-queue', {
  maxRetentionTime: 24 * 60, // minutes
});

registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/v1/sync/push') && request.method === 'POST',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST',
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
