// Importar funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do Firebase (suas credenciais)
const firebaseConfig = {
    apiKey: "AIzaSyDNciTbliYHdbn8wn0Gb2X0krakdVLqlLo",
    authDomain: "hamburgueria-sistema.firebaseapp.com",
    projectId: "hamburgueria-sistema",
    storageBucket: "hamburgueria-sistema.firebasestorage.app",
    messagingSenderId: "517643244866",
    appId: "1:517643244866:web:2f1e5f499408d37b26a4db"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar para usar em outros arquivos
export { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    setDoc,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
};