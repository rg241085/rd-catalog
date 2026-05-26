// Firebase ke background scripts import karna
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Aapka Firebase Configuration
firebase.initializeApp({
    apiKey: "AIzaSyDkW8QBHruMzQztReP3XmGU5sz8MwSlYEU",
    authDomain: "rd-catalog.firebaseapp.com",
    projectId: "rd-catalog",
    storageBucket: "rd-catalog.firebasestorage.app",
    messagingSenderId: "194426515298",
    appId: "1:194426515298:web:9d572c86a9c80b9fcc463b"
});

const messaging = firebase.messaging();

// Jab app band ho tab notification dikhane ka code
messaging.onBackgroundMessage((payload) => {
    console.log('Background notification aayi: ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'logo.png', // Aapki app ka logo
        badge: 'logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});