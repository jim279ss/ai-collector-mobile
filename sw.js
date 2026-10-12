// AI 知識庫 PWA Service Worker
const CACHE_NAME = "ai-collector-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
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
  // 對於跨域 API（如 Google Apps Script），直接透過網路發送，不走快取
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 對於 share_target GET 請求（帶 query 參數），一律回傳快取的 index.html
  const url = new URL(e.request.url);
  if (url.pathname.endsWith("index.html") || url.pathname.endsWith("/")) {
    e.respondWith(
      caches.match("./index.html").then((response) => response || fetch(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
