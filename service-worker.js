const CACHE_NAME = 'frotise-app-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './products.csv',
    './client_stock.csv',
    './images/icon-192.png',
    './images/icon-512.png',
    // 缓存 Bootstrap 资源，保证离线样式正常
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff2?52484601'
];

// 安装 Service Worker 并缓存资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 激活并清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 拦截请求：优先使用网络，网络失败则使用缓存 (Network First, falling back to cache)
// 对于 CSV 数据，这样可以确保有网时获取最新库存，没网时也能用旧数据
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 如果请求成功，更新缓存
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // 网络失败，读取缓存
                return caches.match(event.request);
            })
    );
});