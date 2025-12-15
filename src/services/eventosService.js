import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../connection/firebase.js';

const COLLECTION_NAME = 'eventos';

// Función helper para mapear datos de Firestore
function mapFirestoreEventData(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    fechaInicio: data.fechaInicio,
    fechaFin: data.fechaFin,
    activo: Boolean(data.activo),
    tipo: data.tipo || 'alumnos',
    fechaCreacion: data.fechaCreacion,
    fechaActualizacion: data.fechaActualizacion,
  };
}

// Obtener todos los eventos
export const getEventos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(mapFirestoreEventData);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw error;
  }
};

// Obtener evento activo
export const getEventoActivo = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('activo', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return mapFirestoreEventData(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error al obtener evento activo:', error);
    throw error;
  }
};

// Función para probar la conexión a Firestore
export const probarConexionFirestore = async () => {
  try {
    const testDoc = await addDoc(collection(db, 'test'), {
      timestamp: new Date(),
      test: true,
    });
    await deleteDoc(doc(db, 'test', testDoc.id));
    return true;
  } catch (error) {
    console.error('Error en prueba de conexión Firestore:', error);
    return false;
  }
};

// Crear nuevo evento
export const crearEvento = async evento => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio,
      fechaFin: evento.fechaFin,
      activo: Boolean(evento.activo),
      tipo: evento.tipo || 'alumnos',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    // Activar automáticamente el nuevo evento y desactivar el anterior
    await activarEvento(docRef.id);

    // Retornar el objeto completo del evento creado
    return {
      id: docRef.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio,
      fechaFin: evento.fechaFin,
      activo: true,
      tipo: evento.tipo || 'alumnos',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    };
  } catch (error) {
    console.error('Error al crear evento:', error);
    throw error;
  }
};

// Actualizar evento
export const actualizarEvento = async (eventoId, datos) => {
  try {
    const eventoRef = doc(db, COLLECTION_NAME, eventoId);
    await updateDoc(eventoRef, {
      ...datos,
      fechaActualizacion: new Date(),
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    throw error;
  }
};

// Activar evento (desactivar otros y activar el seleccionado)
export async function activarEvento(eventoId) {
  try {
    // Primero desactivar todos los eventos
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, { activo: false, fechaActualizacion: new Date() })
    );
    await Promise.all(updatePromises);

    // Luego activar el evento seleccionado
    const eventoRef = doc(db, COLLECTION_NAME, eventoId);
    await updateDoc(eventoRef, {
      activo: true,
      fechaActualizacion: new Date(),
    });
  } catch (error) {
    console.error('Error al activar evento:', error);
    throw error;
  }
}

// Eliminar evento
export const eliminarEvento = async eventoId => {
  try {
    const eventoRef = doc(db, COLLECTION_NAME, eventoId);
    await deleteDoc(eventoRef);
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    throw error;
  }
};

// Crear eventos de ejemplo si no existen
export const crearEventosEjemplo = async () => {
  try {
    const eventosExistentes = await getEventos();

    if (eventosExistentes.length === 0) {
      const eventosEjemplo = [
        {
          nombre: 'Seminario de Informática 2025',
          descripcion:
            'Seminario anual de estudiantes de Informática del Instituto Santo Tomás Temuco',
          fechaInicio: '2025-03-15T09:00',
          fechaFin: '2025-03-15T18:00',
          activo: true,
        },
        {
          nombre: 'Conferencia de Ingeniería',
          descripcion: 'Conferencia sobre nuevas tecnologías en ingeniería',
          fechaInicio: '2025-04-20T10:00',
          fechaFin: '2025-04-20T17:00',
          activo: false,
        },
        {
          nombre: 'Workshop de Administración',
          descripcion: 'Taller práctico de administración empresarial',
          fechaInicio: '2025-05-10T08:00',
          fechaFin: '2025-05-10T16:00',
          activo: false,
        },
      ];

      for (const evento of eventosEjemplo) {
        await crearEvento(evento);
      }
    }
  } catch (error) {
    console.error('Error al crear eventos de ejemplo:', error);
  }
};

// Escuchar cambios en eventos en tiempo real
export const subscribeToEventos = (callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      querySnapshot => {
        const eventos = querySnapshot.docs.map(mapFirestoreEventData);
        callback(eventos);
      },
      error => {
        console.error('Error en onSnapshot eventos:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Escuchar cambios en evento activo en tiempo real
export const subscribeToEventoActivo = (callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('activo', '==', true)
    );
    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        if (!querySnapshot.empty) {
          const evento = mapFirestoreEventData(querySnapshot.docs[0]);
          callback(evento);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error en onSnapshot evento activo:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};
