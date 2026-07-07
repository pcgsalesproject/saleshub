const CACHE_NAME = "it-asset-tracker-v2";

// Only static build assets are ever cached. Navigations (HTML pages), API
// routes, and CSV/export endpoints can contain authenticated personal data
// and must always be fetched fresh from the network.
const CACHEABLE_PATH_PREFIXES = ["/_next/static/", "/icons/", "/images/"];
const CACHEABLE_EXTENSIONS = [".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2"];

function isCacheableStaticAsset(url) {
  const { pathname } = new URL(url);
  if (CACHEABLE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return CACHEABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") return;
  if (!isCacheableStaticAsset(request.url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
