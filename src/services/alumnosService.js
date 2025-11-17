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

// Obtener todos los alumnos (de todas las colecciones de eventos)
export const getAlumnos = async () => {
  try {
    // Primero obtener todos los eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Obtener alumnos de cada evento
    const todosLosAlumnos = [];
    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const alumnosSnapshot = await getDocs(alumnosRef);
      const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
      todosLosAlumnos.push(...alumnos);
    }

    return todosLosAlumnos;
  } catch (error) {
    console.error('Error al obtener todos los alumnos:', error);
    throw error;
  }
};

// Obtener alumnos por evento (desde su colección específica)
export const getAlumnosPorEvento = async (eventoId) => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const querySnapshot = await getDocs(alumnosRef);
    return querySnapshot.docs.map(mapFirestoreData);
  } catch (error) {
    console.error('Error al obtener alumnos por evento:', error);
    throw error;
  }
};

// Obtener alumnos del evento activo
export const getAlumnosEventoActivo = async () => {
  try {
    console.log('getAlumnosEventoActivo: Iniciando búsqueda del evento activo...');

    // Primero obtener el evento activo
    const eventosRef = collection(db, 'eventos');
    const qEvento = query(eventosRef, where("activo", "==", true));
    const eventoSnapshot = await getDocs(qEvento);

    if (eventoSnapshot.empty) {
      console.log('getAlumnosEventoActivo: No hay evento activo');
      return [];
    }

    const eventoActivo = eventoSnapshot.docs[0];
    const eventoId = eventoActivo.id;
    console.log('getAlumnosEventoActivo: Evento activo encontrado:', eventoId, eventoActivo.data().nombre);

    // Luego obtener los alumnos de la colección específica de ese evento
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const alumnosSnapshot = await getDocs(alumnosRef);
    const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);

    console.log('getAlumnosEventoActivo: Alumnos encontrados:', alumnos.length);
    return alumnos;
  } catch (error) {
    console.error('Error al obtener alumnos del evento activo:', error);
    throw error;
  }
};

export const verificarAsistenciaPorRut = async (rut) => {
  const alumnos = await getAlumnosEventoActivo();
  const encontrado = alumnos.find(alumno => alumno.rut === rut);
  return encontrado?.presente === true;
};

// Escuchar cambios en tiempo real - todos los alumnos
export const subscribeToAlumnos = (callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    // Suscribirse a cambios en todos los eventos
    const eventosRef = collection(db, 'eventos');
    const unsubscribeEventos = onSnapshot(eventosRef, async (eventosSnapshot) => {
      const eventos = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Obtener alumnos de todos los eventos
      const todosLosAlumnos = [];
      for (const evento of eventos) {
        const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
        const alumnosSnapshot = await getDocs(alumnosRef);
        const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
        todosLosAlumnos.push(...alumnos);
      }

      callback(todosLosAlumnos);
    }, (error) => {
      console.error('Error en onSnapshot eventos:', error);
      if (errorCallback) errorCallback(error);
    });

    return unsubscribeEventos;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Escuchar cambios en tiempo real - alumnos por evento
export const subscribeToAlumnosPorEvento = (eventoId, callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const unsubscribe = onSnapshot(alumnosRef, (querySnapshot) => {
      const alumnos = querySnapshot.docs.map(mapFirestoreData);
      callback(alumnos);
    }, (error) => {
      console.error('Error en onSnapshot alumnos por evento:', error);
      if (errorCallback) errorCallback(error);
    });
    return unsubscribe;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Escuchar cambios en tiempo real - alumnos del evento activo
export const subscribeToAlumnosEventoActivo = (callback, errorCallback) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    console.log('subscribeToAlumnosEventoActivo: Iniciando suscripción...');

    // Suscribirse a cambios en eventos activos
    const eventosRef = collection(db, 'eventos');
    const qEvento = query(eventosRef, where("activo", "==", true));

    const unsubscribeEventos = onSnapshot(qEvento, async (eventoSnapshot) => {
      console.log('subscribeToAlumnosEventoActivo: Cambio en eventos activos detectado');

      if (eventoSnapshot.empty) {
        console.log('subscribeToAlumnosEventoActivo: No hay eventos activos');
        callback([]);
        return;
      }

      const eventoActivo = eventoSnapshot.docs[0];
      const eventoId = eventoActivo.id;
      console.log('subscribeToAlumnosEventoActivo: Evento activo:', eventoId, eventoActivo.data().nombre);

      // Suscribirse a cambios en alumnos de la colección específica de ese evento
      const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
      const unsubscribeAlumnos = onSnapshot(alumnosRef, (alumnosSnapshot) => {
        const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
        console.log('subscribeToAlumnosEventoActivo: Alumnos actualizados:', alumnos.length);
        callback(alumnos);
      }, (error) => {
        console.error('Error en onSnapshot alumnos evento activo:', error);
        if (errorCallback) errorCallback(error);
      });

      // Retornar función para cancelar ambas suscripciones
      return () => {
        unsubscribeAlumnos();
      };
    }, (error) => {
      console.error('Error en onSnapshot evento activo:', error);
      if (errorCallback) errorCallback(error);
    });

    return unsubscribeEventos;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Buscar alumno por RUT en evento específico
export const buscarAlumnoPorRutEnEvento = async (rut, eventoId) => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const q = query(alumnosRef, where("RUT", "==", rut));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return mapFirestoreData(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error al buscar alumno por RUT en evento:', error);
    throw error;
  }
};

// Buscar alumno por RUT (en cualquier evento)
export const buscarAlumnoPorRut = async (rut) => {
  try {
    // Buscar en todas las colecciones de eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const q = query(alumnosRef, where("RUT", "==", rut));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return mapFirestoreData(querySnapshot.docs[0]);
      }
    }

    return null;
  } catch (error) {
    console.error('Error al buscar alumno por RUT:', error);
    throw error;
  }
};

// Eliminar alumno por RUT de evento específico
export const deleteAlumnoPorRutDeEvento = async (rut, eventoId) => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const q = query(alumnosRef, where("RUT", "==", rut));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('No se encontró alumno con ese RUT en este evento');
    const docRef = querySnapshot.docs[0].ref;
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar alumno por RUT de evento:', error);
    throw error;
  }
};

// Eliminar alumno por RUT (de cualquier evento)
export const deleteAlumnoPorRut = async (rut) => {
  try {
    // Buscar en todas las colecciones de eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const q = query(alumnosRef, where("RUT", "==", rut));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
        return true;
      }
    }

    throw new Error('No se encontró alumno con ese RUT');
  } catch (error) {
    console.error('Error al eliminar alumno por RUT:', error);
    throw error;
  }
};

// Agregar nuevo alumno a un evento específico
export const agregarAlumno = async (alumno, eventoId) => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const docRef = await addDoc(alumnosRef, {
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
export const actualizarPresencia = async (alumnoId, presente, eventoId) => {
  try {
    const alumnoRef = doc(db, `eventos/${eventoId}/alumnos`, alumnoId);
    await updateDoc(alumnoRef, {
      presente: Boolean(presente),
      ultimaActualizacion: new Date()
    });
  } catch (error) {
    console.error('Error al actualizar presencia:', error);
    throw error;
  }
};

// Borrar toda la colección de alumnos de un evento específico
export const borrarColeccionAlumnos = async (eventoId) => {
  try {
    console.log(`Iniciando borrado de colección de alumnos del evento ${eventoId}...`);
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const querySnapshot = await getDocs(alumnosRef);

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

// Borrar alumnos de un evento específico (alias para mantener compatibilidad)
export const borrarAlumnosDeEvento = async (eventoId) => {
  return await borrarColeccionAlumnos(eventoId);
};

export const importarAlumnosDesdeExcel = async (file, eventoId) => {
  try {
    // Importar XLSX dinámicamente
    const XLSX = await import('xlsx');

    // Leer el archivo
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Función para verificar si un valor está vacío
    const estaVacio = (valor) => {
      return valor === null || valor === undefined || valor === '' || 
             (typeof valor === 'string' && valor.trim() === '');
    };

    const normalizarClave = (clave = '') => 
      clave
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const normalizarAlias = (lista) => lista.map(normalizarClave);

    const aliasCampos = {
      nombres: normalizarAlias(['nombres', 'nombre', 'nombre(s)', 'name', 'primer nombre']),
      apellidos: normalizarAlias(['apellidos', 'apellido', 'second name', 'segundo nombre']),
      nombreCompleto: normalizarAlias(['nombre completo', 'nombrecompleto', 'nombre y apellido', 'nombre y apellidos', 'full name']),
      rut: normalizarAlias(['rut', 'r.u.t', 'documento', 'dni', 'cedula', 'cédula', 'id', 'identificacion', 'identificación', 'numero documento', 'nro documento']),
      carrera: normalizarAlias(['carrera', 'programa', 'curso', 'especialidad']),
      institucion: normalizarAlias(['institucion', 'institución', 'sede', 'universidad', 'colegio', 'centro', 'instituto']),
      asiento: normalizarAlias(['asiento', 'nro asiento', 'numero asiento', 'seat']),
      grupo: normalizarAlias(['grupo', 'grupo nro', 'grupo numero', 'group'])
    };

    const obtenerValorCampo = (fila, alias) => {
      for (const clave of Object.keys(fila)) {
        if (alias.includes(clave)) {
          return fila[clave];
        }
      }
      return null;
    };

    let successCount = 0;
    let errorCount = 0;

    for (const alumno of jsonData) {
      try {
        // Normalizar claves de la fila para permitir cualquier nombre de columna
        const filaNormalizada = {};
        Object.entries(alumno).forEach(([clave, valor]) => {
          const claveNormalizada = normalizarClave(clave);
          filaNormalizada[claveNormalizada] = valor;
        });

        const nombres = obtenerValorCampo(filaNormalizada, aliasCampos.nombres);
        const apellidos = obtenerValorCampo(filaNormalizada, aliasCampos.apellidos);
        let nombreCompleto = obtenerValorCampo(filaNormalizada, aliasCampos.nombreCompleto);

        // Si no hay nombre completo pero sí nombres y apellidos, lo armo
        if (!nombreCompleto && nombres && apellidos) {
          nombreCompleto = `${nombres} ${apellidos}`;
        }

        // Validar que exista nombre (ya sea completo o compuesto)
        if ((estaVacio(nombres) || estaVacio(apellidos)) && estaVacio(nombreCompleto)) {
          errorCount++;
          continue;
        }

        const rut = obtenerValorCampo(filaNormalizada, aliasCampos.rut);
        const carrera = obtenerValorCampo(filaNormalizada, aliasCampos.carrera);
        const institucion = obtenerValorCampo(filaNormalizada, aliasCampos.institucion);

        // Validar campos obligatorios
        if (estaVacio(rut) || estaVacio(carrera) || estaVacio(institucion)) {
          errorCount++;
          continue;
        }

        const asiento = obtenerValorCampo(filaNormalizada, aliasCampos.asiento);
        const grupo = obtenerValorCampo(filaNormalizada, aliasCampos.grupo);

        // Guardar el RUT tal como viene (sin puntos ni guión)
        await agregarAlumno({
          nombres,
          apellidos,
          nombre: nombreCompleto,
          rut: String(rut),
          carrera,
          institucion,
          asiento,
          grupo
        }, eventoId);

        successCount++;
      } catch (error) {
        console.error('Error al importar alumno:', error);
        errorCount++;
      }
    }

    if (successCount === 0 && errorCount > 0) {
      throw new Error(`No se pudo importar ningún alumno. Verifica el formato del archivo.`);
    }

    return {
      successCount,
      errorCount,
      message: `Importación completada: ${successCount} exitosos, ${errorCount} errores`
    };
  } catch (error) {
    console.error('Error en importarAlumnosDesdeExcel:', error);
    throw new Error(`Error al procesar el archivo: ${error.message}`);
  }
};
