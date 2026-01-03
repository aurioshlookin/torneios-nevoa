// Desestrutura das globais injetadas pelo index.html
const { initializeApp } = window.firebase;
const { getFirestore } = window.firebase.firestore;
const { getAuth } = window.firebase.auth;

const firebaseConfig = {
    apiKey: "AIzaSyBFR5q22-9AIGJYN6fFFJVV3p9LH6p5Ma8",
    authDomain: "torneios-nin.firebaseapp.com",
    projectId: "torneios-nin",
    storageBucket: "torneios-nin.firebasestorage.app",
    messagingSenderId: "466171413764",
    appId: "1:466171413764:web:77e537310a16c391193c51"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
