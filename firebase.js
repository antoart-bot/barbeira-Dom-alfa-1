import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyCybRMBRgaE5MWO2unrsqgEE4EnA88XIks",
    authDomain: "barbeira-4801d.firebaseapp.com",
    databaseURL: "https://barbeira-4801d-default-rtdb.firebaseio.com",
    projectId: "barbeira-4801d",
    storageBucket: "barbeira-4801d.firebasestorage.app",
    messagingSenderId: "181117782716",
    appId: "1:181117782716:web:1a5ecc2f27dc8cd8a71eb9"
};


const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export { app };
