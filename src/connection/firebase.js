import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCjIOHNe954lfdlAP0co33YemyR60rETvo",
  authDomain: "miasistenciast-6f99e.firebaseapp.com",
  projectId: "miasistenciast-6f99e",
  storageBucket: "miasistenciast-6f99e.appspot.com",
  messagingSenderId: "459845025528",
  appId: "1:459845025528:web:3f2e2c4333f5b6da9fc50d",
  measurementId: "G-0E78V5SLTW"
};

// Inicializar Firebase
console.log('Configuración de Firebase:', firebaseConfig);

const app = initializeApp(firebaseConfig);

// Obtener instancia de Firestore
export const db = getFirestore(app);
// Obtener instancia de Auth
export const auth = getAuth(app);

console.log('Firebase inicializado correctamente');

export default app;