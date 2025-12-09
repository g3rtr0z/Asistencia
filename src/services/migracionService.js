import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../connection/firebase.js';

// Función para migrar datos de la estructura antigua a la nueva
export const migrarDatosAntiguos = async () => {
  try {
    
    // 1. Obtener todos los eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (eventos.length === 0) {
      return { success: true, message: 'No hay eventos para migrar' };
    }
    
    // 2. Obtener todos los alumnos de la colección antigua
    const alumnosAntiguosRef = collection(db, 'alumnos');
    const alumnosAntiguosSnapshot = await getDocs(alumnosAntiguosRef);
    const alumnosAntiguos = alumnosAntiguosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (alumnosAntiguos.length === 0) {
      return { success: true, message: 'No hay alumnos para migrar' };
    }
    
    // 3. Obtener el evento activo
    const eventoActivo = eventos.find(evento => evento.activo);
    
    if (!eventoActivo) {
      // Migrar a todos los eventos
      for (const evento of eventos) {
        await migrarAlumnosAEvento(alumnosAntiguos, evento.id);
      }
    } else {
      // Migrar solo al evento activo
      await migrarAlumnosAEvento(alumnosAntiguos, eventoActivo.id);
    }
    
    // 4. Eliminar la colección antigua
    for (const alumno of alumnosAntiguos) {
      await deleteDoc(doc(db, 'alumnos', alumno.id));
    }
    
    return { 
      success: true, 
      message: `Migración completada: ${alumnosAntiguos.length} alumnos migrados`,
      alumnosMigrados: alumnosAntiguos.length,
      eventos: eventos.length
    };
    
  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  }
};

// Función auxiliar para migrar alumnos a un evento específico
const migrarAlumnosAEvento = async (alumnos, eventoId) => {
  const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
  
  for (const alumno of alumnos) {
    try {
      // Crear el alumno en la nueva estructura (sin eventoId)
      const { eventoId: _, ...datosAlumno } = alumno;
      await addDoc(alumnosRef, datosAlumno);
    } catch (error) {
      console.error(`Error migrando alumno ${alumno.id}:`, error);
    }
  }
};

// Función para verificar si hay datos en la estructura antigua
export const verificarDatosAntiguos = async () => {
  try {
    const alumnosRef = collection(db, 'alumnos');
    const snapshot = await getDocs(alumnosRef);
    return {
      tieneDatosAntiguos: !snapshot.empty,
      cantidad: snapshot.size
    };
  } catch (error) {
    console.error('Error verificando datos antiguos:', error);
    return { tieneDatosAntiguos: false, cantidad: 0 };
  }
}; 