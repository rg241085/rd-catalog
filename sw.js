// ===================================================
// 1. APP VERSION CONTROL (JAB BHI KUCH BADLEIN, YE NUMBER BADAL DEIN)
// ===================================================
const CACHE_VERSION = 'rd-catalog-v5';

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
