// Service worker for the OLLALOLL admin app.
// Scope: /admin/. Keeps the app installable and lets the shell open
// even with a flaky connection, but never caches API/auth calls —
// those always need a live network round-trip.
const CACHE = "ollaloll-admin-v11";
const SHELL = [
  "/admin/",
  "/admin/index.html",
  "/admin/projects/",
  "/admin/messages/",
  "/admin/bugreports/",
  "/admin/dictionary/",
  "/admin/quotes/",
  "/admin/library/",
  "/admin/extras/",
  "/admin/words/",
  "/css/style.css",
  "/js/admin.js",
  "/js/i18n.js",
  "/assets/admin-icon-192.png",
  "/assets/admin-icon-512.png",
  "/assets/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch anything cross-origin (Supabase REST/auth/storage, fonts CDN, etc.)
  // or the login/session flow — always go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Network-first for the admin shell itself, so edits/deploys show up
  // right away; fall back to the cached copy only when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/admin/")))
  );
});
