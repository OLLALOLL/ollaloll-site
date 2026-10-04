// Service worker for the public OLLALOLL site.
// Scope: /. Caches the static app shell so the site installs and opens
// offline, plus the data behind the Project, Dictionary and Library pages
// so the last few you looked at stay readable without a connection. Live
// features (Bingo, Polls, Tournament, downloads) always need a live
// network round-trip and are left alone so their own "reconnect to play"
// messaging can take over.
const CACHE = "ollaloll-public-v1";
const RUNTIME_CACHE = "ollaloll-public-runtime-v1";

const SHELL = [
  "/",
  "/index.html",
  "/about.html",
  "/projects.html",
  "/project.html",
  "/dictionary.html",
  "/term.html",
  "/library.html",
  "/library-entry.html",
  "/quotes.html",
  "/quote.html",
  "/extras.html",
  "/notwordle.html",
  "/tournament.html",
  "/contact.html",
  "/report-bug.html",
  "/404.html",
  "/css/style.css",
  "/js/main.js",
  "/js/i18n.js",
  "/manifest.webmanifest",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-512-maskable.png",
  "/assets/favicon.svg",
];

// Supabase REST tables safe to read offline from a cached copy: static
// reference content, not live/interactive state.
const OFFLINE_READABLE_TABLES = [
  "projects",
  "dictionary_terms",
  "library_entries",
  "library_relations",
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
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isOfflineReadableRest(url) {
  if (!/\/rest\/v1\//.test(url.pathname)) return false;
  return OFFLINE_READABLE_TABLES.some((t) =>
    url.pathname.includes(`/rest/v1/${t}`)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Same-origin pages/assets: network-first, cache fallback, and keep
    // the shell cache fresh with whatever pages get visited (so the last
    // Project/Dictionary/Library pages opened stay available offline).
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Cross-origin: leave everything else (auth, storage, live-feature
  // tables) strictly on the network. Only the reference-content tables
  // behind Project/Dictionary/Library get an offline-read fallback.
  if (!isOfflineReadableRest(url)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// Web Push: show the notification the "push" edge function sent.
self.addEventListener("push", (event) => {
  let data = { title: "OLLALOLL", body: "", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (error) {
    data.body = event.data ? event.data.text() : "";
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/assets/icon-192.png",
      badge: "/assets/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.endsWith(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
