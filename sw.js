// AI 知識庫 PWA Service Worker (v5 - Network First 防卡舊版快取)
const CACHE_NAME = "ai-collector-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // 跨域 API (ntfy.sh / restful-api.dev / script.google.com) 直接走網路
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(e.request.url);
  // 對 HTML 頁面採 Network-First（網路優先，斷網才退回快取），確保手機永遠載入最新版程式
  if (e.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((networkResp) => {
          if (networkResp && networkResp.ok) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", clone));
          }
          return networkResp;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
