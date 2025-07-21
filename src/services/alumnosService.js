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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLLECTION_NAME = 'alumnos';

// Función para probar la conexión a Firebase
export const testFirebaseConnection = async () => {
  try {
    console.log('Probando conexión a Firebase...');
    const testQuery = await getDocs(collection(db, COLLECTION_NAME));
    console.log('Conexión exitosa. Documentos encontrados:', testQuery.size);
    return true;
  } catch (error) {
    console.error('Error en la conexión a Firebase:', error);
    return false;
  }
};

// Obtener todos los alumnos
export const getAlumnos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const alumnos = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      alumnos.push({
        id: doc.id,
        nombre: data["Nombre Completo"],
        rut: data["RUT"],
        carrera: data["Carrera"],
        institucion: data["Institución"],
        presente: Boolean(data.presente) // Convertir a booleano explícitamente
      });
    });
    return alumnos;
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    throw error;
  }
};

//validacion de rut

export const verificarAsistenciaPorRut = async (rut) => {
  const alumnos = await getAlumnos();
  const encontrado = alumnos.find(alumno => alumno.rut === rut);
  return encontrado?.presente === true; // devuelve true si ya marcó asistencia
};


// Escuchar cambios en tiempo real
export const subscribeToAlumnos = (callback, errorCallback) => {
  try {
    
    // Verificar que db esté inicializado
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
      const alumnos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        alumnos.push({
          id: doc.id,
          nombre: data["Nombre Completo"],
          rut: data["RUT"],
          carrera: data["Carrera"],
          institucion: data["Institución"],
          presente: Boolean(data.presente) // Convertir a booleano explícitamente
        });
      });
      callback(alumnos);
    }, (error) => {
      console.error('Error en onSnapshot:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      console.error('Detalles del error:', error);
      if (errorCallback) errorCallback(error);
    });
    
    console.log('Suscripción creada exitosamente');
    return unsubscribe;
  } catch (error) {
    console.error('Error al suscribirse a alumnos:', error);
    if (errorCallback) errorCallback(error);
  }
};

// Buscar alumno por RUT
export const buscarAlumnoPorRut = async (rut) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("RUT", "==", rut));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data["Nombre Completo"],
        rut: data["RUT"],
        carrera: data["Carrera"],
        institucion: data["Institución"],
        presente: Boolean(data.presente) // Convertir a booleano explícitamente
      };
    }
    return null;
  } catch (error) {
    console.error('Error al buscar alumno:', error);
    throw error;
  }
};

// Agregar nuevo alumno
export const agregarAlumno = async (alumno) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      "Nombre Completo": alumno.nombre,
      "RUT": alumno.rut,
      "Carrera": alumno.carrera,
      "Institución": alumno.institucion,
      presente: false
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
      presente: Boolean(presente), // Asegurar que sea booleano
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

const exportarAExcel = (alumnos) => {
  // Mapeo para mostrar "Presente" o "Ausente"
  const datosFormateados = alumnos.map(alumno => ({
    ...alumno,
    presente: alumno.presente ? "Presente" : "Ausente"
  }));

  const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'alumnos.xlsx');
}; 