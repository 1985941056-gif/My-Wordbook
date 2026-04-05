// Service Worker for 极简单词本 PWA
const CACHE_NAME = 'wordbook-cache-v1';
const urlsToCache = ['./'];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    // API 请求：网络优先，不强制缓存，保持协作数据新鲜
    if (event.request.url.includes('api.bmobcloud.com')) {
        event.respondWith(
            fetch(event.request).catch(() => new Response(JSON.stringify({error: "Offline"}), {status: 503}))
        );
        return;
    }

    // 静态资源：缓存优先
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchRes.clone());
                    return fetchRes;
                });
            });
        }).catch(() => { /* 离线降级处理 */ })
    );
});

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: '背单词提醒', body: '快来复习今天的单词吧！' };
    event.waitUntil(
        self.registration.showNotification(data.title, { body: data.body, icon: 'data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%234F46E5'/><path d='M30,70 L50,30 L70,70 M40,60 L60,60' stroke='white' stroke-width='8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>' })
    );
});