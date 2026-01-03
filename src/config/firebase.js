import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBFR5q22-9AIGJYN6fFFJVV3p9LH6p5Ma8",
    authDomain: "torneios-nin.firebaseapp.com",
    projectId: "torneios-nin",
    storageBucket: "torneios-nin.firebasestorage.app",
    messagingSenderId: "466171413764",
    appId: "1:466171413764:web:77e537310a16c391193c51"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
