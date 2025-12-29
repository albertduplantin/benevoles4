// Service Worker pour Firebase Cloud Messaging
// Ce fichier doit être à la racine du domaine pour fonctionner

importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js');

// Configuration Firebase (utilise les mêmes valeurs que l'app)
firebase.initializeApp({
  apiKey: "AIzaSyDxjGQY3c8VF9_zxqL8QZ1nYqN7X8Kj3eM",
  authDomain: "benevoles3-a85b4.firebaseapp.com",
  projectId: "benevoles3-a85b4",
  storageBucket: "benevoles3-a85b4.firebasestorage.app",
  messagingSenderId: "854279344169",
  appId: "1:854279344169:web:8b9e0f6f0e8b9e0f6f0e8b"
});

const messaging = firebase.messaging();

// Gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.tag || 'notification',
    data: payload.data,
    requireInteraction: true,
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Ouvrir l'URL si elle est fournie
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Vérifier si une fenêtre est déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});












