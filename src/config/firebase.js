// As funções initializeApp, getFirestore, etc. já vêm dos imports globais do loader

const firebaseConfig = {
    apiKey: "AIzaSyBFR5q22-9AIGJYN6fFFJVV3p9LH6p5Ma8",
    authDomain: "torneios-nin.firebaseapp.com",
    projectId: "torneios-nin",
    storageBucket: "torneios-nin.firebasestorage.app",
    messagingSenderId: "466171413764",
    appId: "1:466171413764:web:77e537310a16c391193c51"
};

// Inicializa e expõe para o escopo global do bundle
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
