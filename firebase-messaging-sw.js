importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyCybRMBRgaE5MWO2unrsqgEE4EnA88XIks",
    authDomain: "barbeira-4801d.firebaseapp.com",
    databaseURL: "https://barbeira-4801d-default-rtdb.firebaseio.com",
    projectId: "barbeira-4801d",
    storageBucket: "barbeira-4801d.firebasestorage.app",
    messagingSenderId: "181117782716",
    appId: "1:181117782716:web:1a5ecc2f27dc8cd8a71eb9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Notificação recebida:",
        payload
    );

    const notificationTitle =
        payload.notification?.title ||
        "Dom Alfa";

    const notificationOptions = {
        body:
            payload.notification?.body ||
            "Você recebeu uma nova notificação.",
        icon: "/favicon.ico"
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});