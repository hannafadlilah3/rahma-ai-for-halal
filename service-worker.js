// Nama cache
const CACHE_NAME = 'rahma-v2'; // Versi diubah untuk memaksa pembaruan
// Daftar file penting yang akan di-cache
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Pastikan ikon Anda ada di root
  './icon-192.png',
  './icon-512.png', 
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// Instalasi Service Worker: Coba cache semua file penting
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Menginstal...');
  self.skipWaiting(); // Langsung aktifkan tanpa menunggu
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache file aplikasi');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Gagal caching file:', error);
      })
  );
});

// Mengaktifkan Service Worker: Membersihkan cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Mengaktifkan...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Klaim semua klien agar service worker segera mengambil alih
  return self.clients.claim(); 
});

// Strategi Fetch: Cache first, lalu Network (untuk resource inti)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika ada di cache, kirimkan dari cache
        if (response) {
          return response;
        }

        // Jika tidak ada di cache, ambil dari jaringan dan coba cache hasil baru
        return fetch(event.request).then(
          (response) => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Jangan cache permintaan yang melibatkan API (misalnya Gemini API)
                if (event.request.url.includes('googleapis.com')) {
                    return; 
                }
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch((error) => {
             console.error('Fetch gagal:', event.request.url, error);
        });
      })
  );
});
