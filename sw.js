// كل ما تحدّث نسخة الكود، غيّر رقم النسخة هون (v1, v2, v3...) عشان يجبر تحديث الكاش عند كل المستخدمين
const CACHE_NAME = "water-map-cache-v1";

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./map.jpg",
  "./Add.jpg",
  "./icon-192.png",
  "./icon-512.png"
];

// عند التثبيت: خزّن نسخة أساسية من التطبيق للعمل دون إنترنت
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// عند التفعيل: احذف أي كاش قديم من نسخة سابقة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// استراتيجية: حاول تجيب أحدث نسخة من الإنترنت أولاً (Network First)
// وإذا ما في إنترنت، استخدم النسخة المخزنة (Cache Fallback)
// هيك كل تحديث ترفعه ع GitHub بينعكس فورًا لأي حدا فاتح التطبيق وعنده إنترنت
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ملفات غوغل شيت وفايربيس دايمًا لازم تكون من الشبكة مباشرة (بيانات حية)
  if (
    req.url.includes("docs.google.com") ||
    req.url.includes("firestore") ||
    req.url.includes("firebase")
  ) {
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (req.method === "GET") cache.put(req, clone);
        });
        return networkResponse;
      })
      .catch(() => caches.match(req))
  );
});
