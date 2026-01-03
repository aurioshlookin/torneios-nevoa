// ATENÇÃO: As bibliotecas do Firebase são carregadas globalmente pelo index.html via importmap.
// Não use 'import' aqui para evitar redeclaração no bundle final.

const firebaseConfig = {
    apiKey: "AIzaSyBFR5q22-9AIGJYN6fFFJVV3p9LH6p5Ma8",
    authDomain: "torneios-nin.firebaseapp.com",
    projectId: "torneios-nin",
    storageBucket: "torneios-nin.firebasestorage.app",
    messagingSenderId: "466171413764",
    appId: "1:466171413764:web:77e537310a16c391193c51"
};

// Inicializa Firebase (usando as globais injetadas pelo loader/importmap)
// Usamos 'var' ou atribuição direta ao window para garantir visibilidade global no bundle
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore.getFirestore(app);
const auth = firebase.auth.getAuth(app);

// Expondo para uso global no app (alternativa segura para bundles simples)
window.db = db;
window.auth = auth;
