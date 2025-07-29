import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../connection/firebase.js';

const COLLECTION_NAME = 'alumnos';

// Función helper para mapear datos de Firestore
function mapFirestoreData(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    nombres: data["Nombres"] ?? null,
    apellidos: data["Apellidos"] ?? null,
    nombre: data["Nombre Completo"] ?? ((data["Nombres"] && data["Apellidos"]) ? `${data["Nombres"]} ${data["Apellidos"]}` : null),
    rut: data["RUT"],
    carrera: data["Carrera"],
    institucion: data["Institución"],
    presente: Boolean(data.presente),
    asiento: data["asiento"] ?? null,
    grupo: data["grupo"] ?? null
  };
}

export const getAlumnos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(mapFirestoreData);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    throw error;
  }
};

export const verificarAsistenciaPorRut = async (rut) => {
  const alumnos = await getAlumnos();
  const encontrado = alumnos.find(alumno => alumno.rut === rut);
  return encontrado?.presente === true;
};

// Escuchar cambios en tiempo real
export const subscribeToAlumnos = (callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
      const alumnos = querySnapshot.docs.map(mapFirestoreData);
      callback(alumnos);
    }, (error) => {
      console.error('Error en onSnapshot:', error);
      if (errorCallback) errorCallback(error);
    });
    return unsubscribe;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Buscar alumno por RUT
export const buscarAlumnoPorRut = async (rut) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("RUT", "==", rut));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return mapFirestoreData(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error al buscar alumno:', error);
    throw error;
  }
};

// Eliminar alumno por RUT
export const deleteAlumnoPorRut = async (rut) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("RUT", "==", rut));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('No se encontró alumno con ese RUT');
    const docRef = querySnapshot.docs[0].ref;
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar alumno por RUT:', error);
    throw error;
  }
};

// Agregar nuevo alumno
export const agregarAlumno = async (alumno) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      "Nombres": alumno.nombres ?? null,
      "Apellidos": alumno.apellidos ?? null,
      "Nombre Completo": alumno.nombre,
      "RUT": alumno.rut,
      "Carrera": alumno.carrera,
      "Institución": alumno.institucion,
      presente: false,
      asiento: alumno.asiento ?? null,
      grupo: alumno.grupo ?? null
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar alumno:', error);
    throw error;
  }
};

// Actualizar estado de presencia
export const actualizarPresencia = async (alumnoId, presente) => {
  try {
    const alumnoRef = doc(db, COLLECTION_NAME, alumnoId);
    await updateDoc(alumnoRef, {
      presente: Boolean(presente),
      ultimaActualizacion: new Date()
    });
  } catch (error) {
    console.error('Error al actualizar presencia:', error);
    throw error;
  }
};

// Borrar toda la colección de alumnos
export const borrarColeccionAlumnos = async () => {
  try {
    console.log('Iniciando borrado de colección...');
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));

    if (querySnapshot.empty) {
      console.log('La colección ya está vacía');
      return { success: true, deletedCount: 0 };
    }

    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`Colección borrada exitosamente. ${querySnapshot.size} documentos eliminados.`);
    return { success: true, deletedCount: querySnapshot.size };
  } catch (error) {
    console.error('Error al borrar la colección:', error);
    throw error;
  }
};