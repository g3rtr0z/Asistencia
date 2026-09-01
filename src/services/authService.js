import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db } from '../connection/firebase';

const firebaseConfig = {
  apiKey: 'AIzaSyCjIOHNe954lfdlAP0co33YemyR60rETvo',
  authDomain: 'miasistenciast-6f99e.firebaseapp.com',
  projectId: 'miasistenciast-6f99e',
  storageBucket: 'miasistenciast-6f99e.appspot.com',
  messagingSenderId: '459845025528',
  appId: '1:459845025528:web:3f2e2c4333f5b6da9fc50d',
  measurementId: 'G-0E78V5SLTW',
};

// App secundaria de Firebase para crear usuarios en Authentication sin alterar la sesión activa
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuthApp');
const secondaryAuth = getAuth(secondaryApp);

const COLLECTION_NAME = 'usuarios';

export const PERMISOS_DEFAULT_ADMIN = {
  eventos: true,
  participantes: true,
  asistencia: true,
  usuarios: true,
};

export const PERMISOS_DEFAULT_OPERADOR = {
  eventos: false,
  participantes: false,
  asistencia: true,
  usuarios: false,
};

export const PERMISOS_DEFAULT_COORDINADOR = {
  eventos: true,
  participantes: true,
  asistencia: true,
  usuarios: false,
};

/**
 * Obtiene el rol y permisos de un usuario por su UID o Email en Firestore.
 * Si el documento no existe o fue eliminado ('inactivo'), retorna null.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<{rol: 'admin' | 'coordinador' | 'usuario', permisos: Object, nombre: string} | null>}
 */
export async function obtenerRolUsuario(user) {
  if (!user) return null;

  try {
    const userEmail = (user.email || '').trim().toLowerCase();
    let data = null;

    // 1. Intentar buscar por user.uid
    const userDocRef = doc(db, COLLECTION_NAME, user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      data = userDocSnap.data();
    } else if (userEmail) {
      // 2. Intentar buscar por ID sanitizado de email
      const emailDocId = userEmail.replace(/[.@]/g, '_');
      const emailDocSnap = await getDoc(doc(db, COLLECTION_NAME, emailDocId));
      if (emailDocSnap.exists()) {
        data = emailDocSnap.data();
      } else {
        // 3. Intentar buscar por campo email en la colección
        const q = query(collection(db, COLLECTION_NAME), where('email', '==', userEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          data = qSnap.docs[0].data();
        }
      }
    }

    if (data) {
      // Si el usuario fue marcado como eliminado o inactivo
      if (data.activo === false || data.estado === 'inactivo') {
        return null;
      }
      const rolRaw = (data.rol || data.role || 'usuario').toLowerCase().trim();
      let rol = 'usuario';
      if (rolRaw === 'admin' || rolRaw === 'administrador') rol = 'admin';
      else if (rolRaw === 'coordinador' || rolRaw === 'supervisor') rol = 'coordinador';

      const permisosDef = rol === 'admin'
        ? PERMISOS_DEFAULT_ADMIN
        : rol === 'coordinador'
        ? PERMISOS_DEFAULT_COORDINADOR
        : PERMISOS_DEFAULT_OPERADOR;

      const permisos = {
        ...permisosDef,
        ...(data.permisos || {}),
      };

      return {
        rol,
        permisos,
        nombre: data.nombre || user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: data.email || user.email,
      };
    }

    // Si el usuario fue eliminado o no existe en Firestore, no tiene autorización
    return null;
  } catch (error) {
    console.warn('Error al verificar rol en Firestore:', error);
    return null;
  }
}

/**
 * Escucha en tiempo real todos los usuarios activos de la colección 'usuarios'.
 * @param {(usuarios: Array<Object>) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function escucharUsuarios(callback) {
  const usuariosRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    usuariosRef,
    (snapshot) => {
      const lista = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .filter((u) => u.activo !== false && u.estado !== 'inactivo');
      callback(lista);
    },
    (error) => {
      console.error('Error al escuchar usuarios:', error);
      callback([]);
    }
  );
}

/**
 * Obtiene la lista de usuarios una sola vez.
 */
export async function obtenerUsuarios() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((u) => u.activo !== false && u.estado !== 'inactivo');
}

/**
 * Guarda o crea un usuario en Firebase Authentication y en Firestore.
 * Si se incluye password, se crea la cuenta en Firebase Auth con su UID real.
 * @param {Object} usuarioData
 */
export async function guardarUsuario(usuarioData) {
  const { id, uid, email, password, nombre, rol, cargo, permisos } = usuarioData;
  const emailLimpio = (email || '').trim().toLowerCase();

  let finalUid = id || uid;

  // Si se proporciona contraseña, creamos el usuario en Firebase Authentication
  if (password && password.trim()) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        emailLimpio,
        password
      );
      finalUid = userCredential.user.uid;
      // Cerrar sesión en la app secundaria para no interferir
      await signOut(secondaryAuth);
    } catch (authErr) {
      console.warn('Advertencia en createUserWithEmailAndPassword:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error('El correo ya está registrado en Authentication.');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      } else {
        throw new Error(authErr.message || 'Error al crear credenciales de acceso.');
      }
    }
  }

  const rolLimpio = (rol || 'usuario').toLowerCase().trim();
  const permisosFinal = permisos || (
    rolLimpio === 'admin'
      ? PERMISOS_DEFAULT_ADMIN
      : rolLimpio === 'coordinador'
      ? PERMISOS_DEFAULT_COORDINADOR
      : PERMISOS_DEFAULT_OPERADOR
  );

  const docId = finalUid || (emailLimpio ? emailLimpio.replace(/[.@]/g, '_') : doc(collection(db, COLLECTION_NAME)).id);
  const userDocRef = doc(db, COLLECTION_NAME, docId);

  const payload = {
    email: emailLimpio,
    nombre: (nombre || '').trim(),
    rol: rolLimpio,
    cargo: (cargo || '').trim(),
    permisos: permisosFinal,
    activo: true,
    actualizadoEn: new Date().toISOString(),
  };

  const existingDoc = await getDoc(userDocRef);
  if (!existingDoc.exists()) {
    payload.creadoEn = new Date().toISOString();
  }

  await setDoc(userDocRef, payload, { merge: true });
  return { id: docId, ...payload };
}

/**
 * Actualiza los datos, rol o permisos granulares de un usuario en Firestore.
 * @param {string} usuarioId
 * @param {Object} datos
 */
export async function actualizarUsuario(usuarioId, datos) {
  const userDocRef = doc(db, COLLECTION_NAME, usuarioId);
  const payload = {
    ...datos,
    actualizadoEn: new Date().toISOString(),
  };
  if (payload.rol) payload.rol = payload.rol.toLowerCase().trim();
  if (payload.email) payload.email = payload.email.toLowerCase().trim();
  delete payload.password;
  
  await updateDoc(userDocRef, payload);
  return { id: usuarioId, ...payload };
}

/**
 * Elimina un usuario: borra su registro y revoca inmediatamente sus permisos en el sistema.
 * @param {string} usuarioId
 */
export async function eliminarUsuario(usuarioId) {
  const userDocRef = doc(db, COLLECTION_NAME, usuarioId);
  await deleteDoc(userDocRef);
  return usuarioId;
}
