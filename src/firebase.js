import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1mJb8JCj2B4WhBCzJQ7sXG68vPWXaB-o",
  authDomain: "castro-corts.firebaseapp.com",
  projectId: "castro-corts",
  storageBucket: "castro-corts.firebasestorage.app",
  messagingSenderId: "794363661157",
  appId: "1:794363661157:web:af1540291658e7d8fdef8c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);