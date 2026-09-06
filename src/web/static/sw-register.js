/* ─────────────────────────────────────────────────────────────
   Service Worker registration (PWA offline support, issue #72).
   CSP-safe: no inline script; loaded by every authenticated SSR page.
   Registration failures are swallowed — offline support is a progressive
   enhancement, not a requirement for the page to function online.
   ───────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignored: unsupported browser, restrictive privacy mode, etc.
    });
  });
})();
