// ============================================
// FIREBASE CONFIGURATION
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAnrzMaB4sNbfqL9DKDmrWb9PsBaDnNjBc",
    authDomain: "artdrops-83d18.firebaseapp.com",
    projectId: "artdrops-83d18",
    storageBucket: "artdrops-83d18.firebasestorage.app",
    messagingSenderId: "821146936988",
    appId: "1:821146936988:web:4d4bc9c57df82c8b1b5972",
    measurementId: "G-ZQR0TY5XPM"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

console.log('✅ Firebase initialized');
