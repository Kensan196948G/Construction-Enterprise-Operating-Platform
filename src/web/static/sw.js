/* ─────────────────────────────────────────────────────────────
   CEOP Service Worker — minimal offline shell (issue #72).

   Registered from the origin root (`/sw.js`) so its scope covers every
   SSR page. Strategy, kept intentionally small:
     - Precache the app shell (shared CSS/JS/icons + offline fallback) on
       install so the dashboard/daily-report shell can render offline.
     - Cache-first for static GET assets under /api/assets/ and /assets/
       (immutable-ish design assets; a network refresh updates the cache).
     - Network-first for page navigations, falling back to a cached copy
       of the page or, failing that, the offline fallback page.
     - Never intercept non-GET requests. Daily-report submissions (POST/
       PATCH) are handled by the page itself, which spools failed writes
       into IndexedDB and retries them on the "online" event — the
       service worker does not need to know about that queue.
   ───────────────────────────────────────────────────────────── */

const CACHE_VERSION = "ceop-shell-v1";
const OFFLINE_URL = "/api/assets/offline.html";
const PRECACHE_URLS = [
  "/api/assets/app.css",
  "/api/assets/app.js",
  "/api/assets/daily-reports.js",
  "/api/assets/favicon.svg",
  "/api/assets/manifest.webmanifest",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableStaticAsset(url) {
  return url.pathname.startsWith("/api/assets/") || url.pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only ever cache/replay safe GETs — API writes (daily-report create /
  // update / transition) must reach the network untouched so the page's
  // own online/offline handling sees the real result.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL)),
      ),
    );
    return;
  }

  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});
