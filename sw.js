// ===================================================
// 1. APP VERSION CONTROL (JAB BHI KUCH BADLEIN, YE NUMBER BADAL DEIN)
// ===================================================
const CACHE_VERSION = 'rd-catalog-v6';

// ===================================================
// 2. FIREBASE PUSH NOTIFICATION CODE
// ===================================================
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDkW8QBHruMzQztReP3XmGU5sz8MwSlYEU",
    authDomain: "rd-catalog.firebaseapp.com",
    projectId: "rd-catalog",
    storageBucket: "rd-catalog.firebasestorage.app",
    messagingSenderId: "194426515298",
    appId: "1:194426515298:web:9d572c86a9c80b9fcc463b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background notification aayi: ', payload);
    // Humne niche ka code hata diya hai kyunki Firebase Console 
    // se bheje gaye messages ko Firebase khud screen par dikha deta hai.
});

// ===================================================
// 3. AUTO-UPDATE & CACHE CLEARING LOGIC
// ===================================================

// Install hote hi naye code ko activate kar de (skip waiting)
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Purana Cache Delete karne ka logic
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_VERSION) {
                        console.log('Purana cache delete ho gaya: ', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // <-- Ab yeh sahi timing par control lega
    );
});

// Hamesha naya data internet se laane ki koshish kare
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// ===================================================
// 4. NOTIFICATION PAR CLICK HONE KA LOGIC
// ===================================================
self.addEventListener('notificationclick', function (event) {
    // 1. Click karte hi notification ko upar se hata do
    event.notification.close();

    // 2. Customer panel ka link jahan user ko bhejna hai
    const urlToOpen = 'https://rg241085.github.io/rd-catalog/code.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Agar customer ne app pehle se minimize kar rakhi hai, toh use samne (focus) le aao
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url.includes('/code.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Agar app poori tarah band hai, toh app ko naye sire se khol do
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
