import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIyByoZatiJno8fsVoaEsKHnYq75er6AE",
  authDomain: "bharatcomfort-46bac.firebaseapp.com",
  projectId: "bharatcomfort-46bac",
  storageBucket: "bharatcomfort-46bac.firebasestorage.app",
  messagingSenderId: "566612210879",
  appId: "1:566612210879:web:25dfd26a5444f08c9d820a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
