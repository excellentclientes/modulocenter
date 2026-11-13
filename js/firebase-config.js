// Configuração e inicialização do Firebase (SDK modular via CDN, sem build).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0nNak0ivb4w5uARqfTFPCrBlg5_rAB24",
  authDomain: "modulocenter.firebaseapp.com",
  projectId: "modulocenter",
  storageBucket: "modulocenter.firebasestorage.app",
  messagingSenderId: "18663388417",
  appId: "1:18663388417:web:b79a7b70c8ecfc308a1700"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
