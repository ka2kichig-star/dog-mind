// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBio-wwXDiPKYQ5mPiqE98bwakOKl1UPvo",
  authDomain: "wanwan-translator.firebaseapp.com",
  projectId: "wanwan-translator",
  storageBucket: "wanwan-translator.firebasestorage.app",
  messagingSenderId: "1060567209218",
  appId: "1:1060567209218:web:2c2298458b8e378b119e1b"
});

const messaging = firebase.messaging();

// バックグラウンド通知を受信した場合の処理
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] バックグラウンド通知受信: ', payload);
  const notificationTitle = payload.notification?.title || '🌈 虹の橋からお知らせ';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
