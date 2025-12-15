import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../connection/firebase.js';

const COLLECTION_NAME = 'eventos_alumnos';

// Función helper para mapear datos de Firestore
function mapFirestoreEventoAlumnoData(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    eventoId: data.eventoId,
    nombres: data.nombres,
    apellidos: data.apellidos,
    rut: data.rut,
    carrera: data.carrera,
    institucion: data.institucion,
    asiento: data.asiento,
    grupo: data.grupo,
    fechaCreacion: data.fechaCreacion,
  };
}

// Obtener alumnos por evento
export const getAlumnosPorEvento = async eventoId => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('eventoId', '==', eventoId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapFirestoreEventoAlumnoData);
  } catch (error) {
    console.error('Error al obtener alumnos por evento:', error);
    throw error;
  }
};

// Agregar alumno a un evento
export const agregarAlumnoAEvento = async (eventoId, alumno) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      eventoId,
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      rut: alumno.rut,
      carrera: alumno.carrera,
      institucion: alumno.institucion,
      asiento: alumno.asiento,
      grupo: alumno.grupo,
      fechaCreacion: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar alumno al evento:', error);
    throw error;
  }
};

// Eliminar alumno de un evento
export const eliminarAlumnoDeEvento = async alumnoId => {
  try {
    const alumnoRef = doc(db, COLLECTION_NAME, alumnoId);
    await deleteDoc(alumnoRef);
  } catch (error) {
    console.error('Error al eliminar alumno del evento:', error);
    throw error;
  }
};

// Escuchar cambios en alumnos por evento en tiempo real
export const subscribeToAlumnosPorEvento = (
  eventoId,
  callback,
  errorCallback
) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('eventoId', '==', eventoId)
    );
    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const alumnos = querySnapshot.docs.map(mapFirestoreEventoAlumnoData);
        callback(alumnos);
      },
      error => {
        console.error('Error en onSnapshot alumnos por evento:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Datos de ejemplo para eventos (en un caso real, esto vendría de la base de datos)
export const getAlumnosEjemploPorEvento = eventoId => {
  // Mapeo de eventos por nombre para simular la relación
  const eventosPorNombre = {
    'Seminario de Informática 2025': [
      {
        nombres: 'Juan',
        apellidos: 'Pérez',
        rut: '12345678-9',
        carrera: 'Informática',
        institucion: 'Santo Tomás',
        asiento: 'A1',
        grupo: '1',
      },
      {
        nombres: 'María',
        apellidos: 'González',
        rut: '23456789-0',
        carrera: 'Informática',
        institucion: 'Santo Tomás',
        asiento: 'A2',
        grupo: '1',
      },
      {
        nombres: 'Carlos',
        apellidos: 'Rodríguez',
        rut: '34567890-1',
        carrera: 'Informática',
        institucion: 'Santo Tomás',
        asiento: 'A3',
        grupo: '2',
      },
      {
        nombres: 'Ana',
        apellidos: 'López',
        rut: '45678901-2',
        carrera: 'Informática',
        institucion: 'Santo Tomás',
        asiento: 'A4',
        grupo: '2',
      },
      {
        nombres: 'Luis',
        apellidos: 'Martínez',
        rut: '56789012-3',
        carrera: 'Informática',
        institucion: 'Santo Tomás',
        asiento: 'A5',
        grupo: '3',
      },
    ],
    'Conferencia de Ingeniería': [
      {
        nombres: 'Pedro',
        apellidos: 'García',
        rut: '67890123-4',
        carrera: 'Ingeniería',
        institucion: 'Santo Tomás',
        asiento: 'B1',
        grupo: '1',
      },
      {
        nombres: 'Carmen',
        apellidos: 'Fernández',
        rut: '78901234-5',
        carrera: 'Ingeniería',
        institucion: 'Santo Tomás',
        asiento: 'B2',
        grupo: '1',
      },
      {
        nombres: 'Roberto',
        apellidos: 'Sánchez',
        rut: '89012345-6',
        carrera: 'Ingeniería',
        institucion: 'Santo Tomás',
        asiento: 'B3',
        grupo: '2',
      },
    ],
    'Workshop de Administración': [
      {
        nombres: 'Isabel',
        apellidos: 'Torres',
        rut: '90123456-7',
        carrera: 'Administración',
        institucion: 'Santo Tomás',
        asiento: 'C1',
        grupo: '1',
      },
      {
        nombres: 'Miguel',
        apellidos: 'Ruiz',
        rut: '01234567-8',
        carrera: 'Administración',
        institucion: 'Santo Tomás',
        asiento: 'C2',
        grupo: '1',
      },
      {
        nombres: 'Elena',
        apellidos: 'Jiménez',
        rut: '12345678-9',
        carrera: 'Administración',
        institucion: 'Santo Tomás',
        asiento: 'C3',
        grupo: '2',
      },
      {
        nombres: 'Francisco',
        apellidos: 'Moreno',
        rut: '23456789-0',
        carrera: 'Administración',
        institucion: 'Santo Tomás',
        asiento: 'C4',
        grupo: '2',
      },
    ],
  };

  // Función no utilizada - comentada
  // const getEventoNombre = async eventoId => {
  //   try {
  //     const eventoRef = doc(db, 'eventos', eventoId);
  //     const eventoDoc = await getDocs(
  //       query(collection(db, 'eventos'), where('__name__', '==', eventoId))
  //     );
  //     if (!eventoDoc.empty) {
  //       return eventoDoc.docs[0].data().nombre;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.error('Error al obtener nombre del evento:', error);
  //     return null;
  //   }
  // };

  // Por ahora, retornamos datos de ejemplo basados en el ID
  // En una implementación real, esto se haría consultando la base de datos
  const alumnosEjemplo = {
    evento1: eventosPorNombre['Seminario de Informática 2025'],
    evento2: eventosPorNombre['Conferencia de Ingeniería'],
    evento3: eventosPorNombre['Workshop de Administración'],
  };

  return alumnosEjemplo[eventoId] || [];
};
