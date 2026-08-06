import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../connection/firebase.js';

export const capitalizarPalabras = (texto) => {
  if (texto === null || texto === undefined) return null;
  const str = String(texto).trim();
  if (!str) return null;

  const minusculas = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'o', 'u', 'en', 'con', 'por', 'para', 'a']);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, index) => {
      if (!palabra) return '';
      if (index > 0 && minusculas.has(palabra)) {
        return palabra;
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
};

const parseBooleanField = valor => {
  if (typeof valor === 'boolean') return valor;
  if (valor === null || valor === undefined) return null;
  const texto = valor.toString().trim().toLowerCase();
  if (!texto) return null;
  const afirmativos = [
    'si',
    'sí',
    'yes',
    'true',
    '1',
    'distinción máxima',
    'distinción maxima',
    'distincion maxima',
    'distincion',
    'distinción',
    'con distinción',
    'con distincion',
    'reconocimiento',
    'con reconocimiento',
    'reconocimiento especial',
  ];
  const negativos = [
    'no',
    'false',
    '0',
    'sin distinción',
    'sin distincion',
    'sin reconocimiento',
  ];
  if (afirmativos.includes(texto)) return true;
  if (negativos.includes(texto)) return false;
  return null;
};

const parseReconocimientoField = valor => {
  if (valor === null || valor === undefined) return false;
  const parsedBool = parseBooleanField(valor);
  if (parsedBool === true) return true;
  if (parsedBool === false) return false;
  if (typeof valor === 'string' && valor.trim().length > 0) return valor.trim();
  return Boolean(valor);
};

const parseDistincionField = (valor, colHeader = '') => {
  if (valor === null || valor === undefined) return false;
  const colLower = (colHeader || '').toLowerCase();
  const isUnanimeCol = colLower.includes('unanime') || colLower.includes('unánime');

  if (typeof valor === 'boolean') {
    if (!valor) return false;
    return isUnanimeCol ? 'Distinción Unánime' : 'Distinción Máxima';
  }

  const strVal = String(valor).trim();
  if (!strVal) return false;

  const strLower = strVal.toLowerCase();
  const negativos = ['no', 'false', '0', 'sin distinción', 'sin distincion'];
  if (negativos.includes(strLower)) return false;

  const parsedBool = parseBooleanField(strVal);
  if (parsedBool === false) return false;
  if (parsedBool === true) {
    if (isUnanimeCol || strLower.includes('unanime') || strLower.includes('unánime')) {
      return 'Distinción Unánime';
    }
    return 'Distinción Máxima';
  }

  if (strLower === 'distincion unanime' || strLower === 'distinción unánime' || strLower.includes('unanime')) {
    return 'Distinción Unánime';
  }

  if (strLower === 'distincion maxima' || strLower === 'distinción máxima' || strLower.includes('maxima')) {
    return 'Distinción Máxima';
  }

  return strVal;
};

// Función helper para mapear datos de Firestore
function mapFirestoreData(doc) {
  const data = doc.data();
  const asisteValor =
    data['Asiste'] ??
    data.asiste ??
    data['Asiste (Pre confirmación)'] ??
    data['Asiste (Si/No)'] ??
    data['Asiste (Si o No)'] ??
    data['Confirmación Asistencia'];
  const distincionValor =
    data['Distinción'] ??
    data['Distinción Máxima'] ??
    data['Distinción Unánime'] ??
    data['Distinción unánime'] ??
    data['Distinción unanime'] ??
    data['Distincion Unanime'] ??
    data['Distincion unanime'] ??
    data['Distinción maxima'] ??
    data['Distincion Maxima'] ??
    data['Distincion'] ??
    data.distincion ??
    data.distincionMaxima;
  const reconocimientoValor =
    data['Reconocimiento'] ??
    data['Reconocimiento Especial'] ??
    data['Reconocimientos'] ??
    data.reconocimiento;
  return {
    id: doc.id,
    nombres: data['Nombres'] ?? null,
    apellidos: data['Apellidos'] ?? null,
    nombre:
      data['Nombre Completo'] ??
      data['Nombre completo'] ??
      data['nombreCompleto'] ??
      data['Nombre'] ??
      data['nombre'] ??
      (data['Nombres'] && data['Apellidos']
        ? `${data['Nombres']} ${data['Apellidos']}`
        : null),
    rut: data['RUT'],
    telefono:
      data['Teléfono'] ??
      data['Telefono'] ??
      data['telefono'] ??
      data['Teléfono/Celular'] ??
      data['Celular'] ??
      null,
    correo:
      data['Correo electrónico'] ??
      data['Correo electronico'] ??
      data['Correo'] ??
      data['Email'] ??
      data['email'] ??
      null,
    cargo: data['Cargo'] ?? data['cargo'] ?? data['Puesto'] ?? null,
    comuna:
      data['Comuna del Establecimiento'] ??
      data['Comuna del establecimiento'] ??
      data['Comuna de establecimiento'] ??
      data['Comuna'] ??
      data['comuna'] ??
      data['Comuna Colegio'] ??
      data['Comuna Origen'] ??
      null,
    establecimiento:
      data['Establecimiento'] ??
      data['establecimiento'] ??
      data['Establecimiento de Origen'] ??
      null,
    carrera: data['Carrera'] ?? data['carrera'] ?? null,
    institucion: data['Institución'] ?? data['institucion'] ?? null,
    departamento: data['Departamento'] ?? null,
    observacion: data['Observación'] ?? data['Observacion'] ?? null,
    presente: Boolean(data.presente),
    asiste: parseBooleanField(asisteValor) ?? false,
    distincion: parseDistincionField(distincionValor),
    reconocimiento: parseReconocimientoField(reconocimientoValor),
    asiento: data['asiento'] ?? null,
    grupo: data['grupo'] ?? null,
    numeroLista: (() => {
      const valor = data['numeroLista'] ??
        data['N° de Lista'] ??
        data['N de Lista'] ??
        data['numero de lista'] ??
        data['nro de lista'] ??
        data['N° de lista'] ??
        data['N de lista'];
      return valor != null ? String(valor) : null;
    })(),
    fechaRegistro: data.fechaRegistro ?? null,
    ultimaActualizacion: data.ultimaActualizacion ?? null,
  };
}

// Obtener todos los alumnos (de todas las colecciones de eventos)
export const getAlumnos = async () => {
  try {
    // Primero obtener todos los eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Obtener alumnos de cada evento
    const todosLosAlumnos = [];
    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const alumnosSnapshot = await getDocs(alumnosRef);
      const alumnos = alumnosSnapshot.docs.map(doc => ({
        ...mapFirestoreData(doc),
        eventoId: evento.id, // Importante para poder actualizar/eliminar
      }));
      todosLosAlumnos.push(...alumnos);
    }

    return todosLosAlumnos;
  } catch (error) {
    console.error('Error al obtener todos los alumnos:', error);
    throw error;
  }
};

// Actualizar un alumno
export const updateAlumno = async (eventoId, alumnoId, data) => {
  try {
    const alumnoRef = doc(db, `eventos/${eventoId}/alumnos`, alumnoId);

    // Mapear los campos a los nombres que espera Firestore (Capitalizados o como estén en tu BD)
    // Ojo: mapFirestoreData lee 'Nombres', 'Apellidos', etc.
    // Dependiendo de cómo guardes, deberías respetar la estructura.
    // Si guardas con minúsculas, asegurate que mapFirestoreData lo lea.
    // Asumiremos que se guardan como los lee mapFirestoreData o usamos un standard.
    // Pero para editar, lo ideal es mantener consistencia.
    // Si miramos mapFirestoreData, lee 'Nombres', 'Apellidos', etc.

    const updateData = {};
    if (data.nombres !== undefined) updateData['Nombres'] = capitalizarPalabras(data.nombres);
    if (data.apellidos !== undefined) updateData['Apellidos'] = capitalizarPalabras(data.apellidos);

    if (data.nombre !== undefined && String(data.nombre).trim() !== '') {
      const nombreCap = capitalizarPalabras(data.nombre);
      updateData['Nombre Completo'] = nombreCap;
      updateData['nombre'] = nombreCap;
      if (!data.nombres) {
        const partes = nombreCap.split(' ');
        updateData['Nombres'] = partes[0] || '';
        if (!data.apellidos) {
          updateData['Apellidos'] = partes.slice(1).join(' ') || '';
        }
      }
    } else if (data.nombres !== undefined || data.apellidos !== undefined) {
      const nombres = capitalizarPalabras(data.nombres) ?? (data.originalData?.nombres || '');
      const apellidos = capitalizarPalabras(data.apellidos) ?? (data.originalData?.apellidos || '');
      const nombreCompleto = `${nombres} ${apellidos}`.trim();
      if (nombreCompleto) {
        updateData['Nombre Completo'] = nombreCompleto;
        updateData['nombre'] = nombreCompleto;
      }
    }

    if (data.rut !== undefined) updateData['RUT'] = data.rut ? String(data.rut).replace(/[^0-9kK]/gi, '').trim().toUpperCase() : data.rut;
    if (data.telefono !== undefined) updateData['Teléfono'] = data.telefono ? String(data.telefono).trim() : data.telefono;
    if (data.correo !== undefined) updateData['Correo electrónico'] = data.correo ? String(data.correo).trim().toLowerCase() : data.correo;
    if (data.cargo !== undefined) updateData['Cargo'] = capitalizarPalabras(data.cargo);
    if (data.comuna !== undefined) updateData['Comuna del Establecimiento'] = capitalizarPalabras(data.comuna);
    if (data.establecimiento !== undefined) {
      const estCap = capitalizarPalabras(data.establecimiento);
      updateData['Establecimiento'] = estCap;
      updateData['Institución'] = estCap;
    }
    if (data.carrera !== undefined) updateData['Carrera'] = capitalizarPalabras(data.carrera);
    if (data.institucion !== undefined) updateData['Institución'] = capitalizarPalabras(data.institucion);
    if (data.grupo !== undefined) updateData['grupo'] = data.grupo;
    if (data.asiento !== undefined) updateData['asiento'] = data.asiento;
    if (data.numeroLista !== undefined) updateData['numeroLista'] = data.numeroLista;
    if (data.presente !== undefined) {
      const esPresente = Boolean(data.presente);
      updateData['presente'] = esPresente;
      if (esPresente) {
        const alumnoDoc = await getDoc(alumnoRef);
        if (!alumnoDoc.data()?.fechaRegistro) {
          updateData['fechaRegistro'] = new Date();
        }
      }
    }
    if (data.distincion !== undefined) {
      const distVal = parseDistincionField(data.distincion);
      updateData['Distinción'] = distVal;
      updateData['distincion'] = distVal;
    }
    if (data.reconocimiento !== undefined) {
      const recVal = parseReconocimientoField(data.reconocimiento);
      updateData['Reconocimiento'] = recVal;
      updateData['reconocimiento'] = recVal;
    }

    updateData['ultimaActualizacion'] = new Date().toISOString();

    await updateDoc(alumnoRef, updateData);
    return true;
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    throw error;
  }
};

// Obtener alumnos por evento (desde su colección específica)
export const getAlumnosPorEvento = async eventoId => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const querySnapshot = await getDocs(alumnosRef);
    return querySnapshot.docs.map(mapFirestoreData);
  } catch (error) {
    // Si la subcolección no existe (error 404), retornar array vacío
    if (
      error.code === 'not-found' ||
      error.message?.includes('404') ||
      error.message?.includes('NOT_FOUND')
    ) {
      return [];
    }
    console.error('Error al obtener alumnos por evento:', error);
    throw error;
  }
};

// Obtener alumnos del evento activo
export const getAlumnosEventoActivo = async () => {
  try {
    // Primero obtener el evento activo
    const eventosRef = collection(db, 'eventos');
    const qEvento = query(eventosRef, where('activo', '==', true));
    const eventoSnapshot = await getDocs(qEvento);

    if (eventoSnapshot.empty) {
      return [];
    }

    const eventoActivo = eventoSnapshot.docs[0];
    const eventoId = eventoActivo.id;

    // Luego obtener los alumnos de la colección específica de ese evento
    try {
      const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
      const alumnosSnapshot = await getDocs(alumnosRef);
      const alumnos = alumnosSnapshot.docs.map(doc => ({
        ...mapFirestoreData(doc),
        eventoId: eventoId,
      }));
      return alumnos;
    } catch (subError) {
      // Si la subcolección no existe, retornar array vacío en lugar de lanzar error
      if (
        subError.code === 'not-found' ||
        subError.message?.includes('404') ||
        subError.message?.includes('NOT_FOUND')
      ) {
        return [];
      }
      throw subError;
    }
  } catch (error) {
    console.error('Error al obtener alumnos del evento activo:', error);
    // Si es un error 404, retornar array vacío en lugar de lanzar error
    if (
      error.code === 'not-found' ||
      error.message?.includes('404') ||
      error.message?.includes('NOT_FOUND')
    ) {
      return [];
    }
    throw error;
  }
};

export const verificarAsistenciaPorRut = async rut => {
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
    const unsubscribeEventos = onSnapshot(
      eventosRef,
      async eventosSnapshot => {
        const eventos = eventosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Obtener alumnos de todos los eventos
        const todosLosAlumnos = [];
        for (const evento of eventos) {
          const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
          const alumnosSnapshot = await getDocs(alumnosRef);
          const alumnos = alumnosSnapshot.docs.map(doc => ({
            ...mapFirestoreData(doc),
            eventoId: evento.id,
          }));
          todosLosAlumnos.push(...alumnos);
        }

        callback(todosLosAlumnos);
      },
      error => {
        console.error('Error en onSnapshot eventos:', error);
        if (errorCallback) errorCallback(error);
      }
    );

    return unsubscribeEventos;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Escuchar cambios en tiempo real - alumnos por evento
export const subscribeToAlumnosPorEvento = (
  eventoId,
  callback,
  errorCallback
) => {
  try {
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }

    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const unsubscribe = onSnapshot(
      alumnosRef,
      querySnapshot => {
        const alumnos = querySnapshot.docs.map(doc => ({
          ...mapFirestoreData(doc),
          eventoId: eventoId,
        }));
        callback(alumnos);
      },
      error => {
        // Manejar error 404 cuando la subcolección aún no existe
        if (
          error.code === 'not-found' ||
          error.message?.includes('404') ||
          error.message?.includes('NOT_FOUND') ||
          error.code === 'permission-denied'
        ) {
          callback([]);
          return;
        }
        console.error('Error en onSnapshot alumnos por evento:', error);
        if (errorCallback) errorCallback(error);
      }
    );
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

    // Variable para almacenar la suscripción a alumnos y limpiarla cuando cambie el evento
    let unsubscribeAlumnos = null;

    // Suscribirse a cambios en eventos activos
    const eventosRef = collection(db, 'eventos');
    const qEvento = query(eventosRef, where('activo', '==', true));

    const unsubscribeEventos = onSnapshot(
      qEvento,
      eventoSnapshot => {
        // Limpiar suscripción anterior de alumnos si existe
        if (unsubscribeAlumnos) {
          unsubscribeAlumnos();
          unsubscribeAlumnos = null;
        }

        if (eventoSnapshot.empty) {
          callback([]);
          return;
        }

        const eventoActivo = eventoSnapshot.docs[0];
        const eventoId = eventoActivo.id;

        // Suscribirse a cambios en alumnos de la colección específica de ese evento
        const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
        unsubscribeAlumnos = onSnapshot(
          alumnosRef,
          alumnosSnapshot => {
            const alumnos = alumnosSnapshot.docs.map(doc => ({
              ...mapFirestoreData(doc),
              eventoId: eventoId,
            }));
            callback(alumnos);
          },
          error => {
            // Manejar error 404 cuando la subcolección aún no existe
            if (
              error.code === 'not-found' ||
              error.code === 'permission-denied' ||
              error.message?.includes('404') ||
              error.message?.includes('NOT_FOUND') ||
              error.message?.includes('N0T_F0UND')
            ) {
              callback([]);
              return;
            }
            console.error('Error en onSnapshot alumnos evento activo:', error);
            if (errorCallback) errorCallback(error);
          }
        );
      },
      error => {
        console.error('Error en onSnapshot evento activo:', error);
        if (errorCallback) errorCallback(error);
      }
    );

    // Retornar función para cancelar AMBAS suscripciones
    return () => {
      if (unsubscribeAlumnos) {
        unsubscribeAlumnos();
      }
      unsubscribeEventos();
    };
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Buscar alumno por RUT en evento específico
export const buscarAlumnoPorRutEnEvento = async (rut, eventoId) => {
  try {
    const cleanSearchRut = String(rut || '').replace(/[^0-9kK]/gi, '').trim().toUpperCase();
    const cleanSearchRutNoZero = cleanSearchRut.replace(/^0+/, '');
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);

    // 1. Intentar búsqueda exacta
    let q = query(alumnosRef, where('RUT', '==', rut));
    let querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return mapFirestoreData(querySnapshot.docs[0]);
    }

    // 2. Intentar búsqueda por RUT limpio (sin puntos ni guion ni espacios)
    if (cleanSearchRut && cleanSearchRut !== rut) {
      q = query(alumnosRef, where('RUT', '==', cleanSearchRut));
      querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return mapFirestoreData(querySnapshot.docs[0]);
      }
    }

    // 3. Intentar búsqueda sin cero inicial (por si el escáner incluyó 0 al inicio)
    if (cleanSearchRutNoZero && cleanSearchRutNoZero !== cleanSearchRut) {
      q = query(alumnosRef, where('RUT', '==', cleanSearchRutNoZero));
      querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return mapFirestoreData(querySnapshot.docs[0]);
      }
    }

    // 4. Fallback: buscar en todos los alumnos del evento comparando RUTs normalizados
    const allSnapshot = await getDocs(alumnosRef);
    const docEncontrado = allSnapshot.docs.find(d => {
      const dRut = d.data()['RUT'];
      if (!dRut) return false;
      const dRutClean = String(dRut).replace(/[^0-9kK]/gi, '').trim().toUpperCase();
      return (
        dRutClean === cleanSearchRut ||
        dRutClean.replace(/^0+/, '') === cleanSearchRutNoZero
      );
    });

    if (docEncontrado) {
      return mapFirestoreData(docEncontrado);
    }

    return null;
  } catch (error) {
    console.error('Error al buscar alumno por RUT en evento:', error);
    throw error;
  }
};

// Buscar alumno por RUT (en cualquier evento)
export const buscarAlumnoPorRut = async rut => {
  try {
    // Buscar en todas las colecciones de eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const q = query(alumnosRef, where('RUT', '==', rut));
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
    const q = query(alumnosRef, where('RUT', '==', rut));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty)
      throw new Error('No se encontró alumno con ese RUT en este evento');
    const docRef = querySnapshot.docs[0].ref;
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar alumno por RUT de evento:', error);
    throw error;
  }
};

// Eliminar alumno por RUT (de cualquier evento)
export const deleteAlumnoPorRut = async rut => {
  try {
    // Buscar en todas las colecciones de eventos
    const eventosRef = collection(db, 'eventos');
    const eventosSnapshot = await getDocs(eventosRef);
    const eventos = eventosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    for (const evento of eventos) {
      const alumnosRef = collection(db, `eventos/${evento.id}/alumnos`);
      const q = query(alumnosRef, where('RUT', '==', rut));
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
    
    // Preparar fecha de registro: usar la proporcionada o la fecha actual
    const fechaRegistroFinal = alumno.fechaRegistro 
      ? (alumno.fechaRegistro instanceof Date ? alumno.fechaRegistro : new Date(alumno.fechaRegistro))
      : (alumno.presente ? new Date() : null);

    const nombreRaw = alumno.nombre || `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim();
    const nombreFinal = capitalizarPalabras(nombreRaw);
    const nombresFinal = capitalizarPalabras(alumno.nombres) || (nombreFinal ? nombreFinal.split(' ')[0] : null);
    const apellidosFinal = capitalizarPalabras(alumno.apellidos) || (nombreFinal ? nombreFinal.split(' ').slice(1).join(' ') : null);
    const rutClean = alumno.rut ? String(alumno.rut).replace(/[^0-9kK]/gi, '').trim().toUpperCase() : null;
    const correoClean = alumno.correo ? String(alumno.correo).trim().toLowerCase() : null;
    
    const docData = {
      Nombres: nombresFinal,
      Apellidos: apellidosFinal,
      'Nombre Completo': nombreFinal,
      RUT: rutClean || alumno.rut,
      'Teléfono': alumno.telefono ?? null,
      'Correo electrónico': correoClean,
      Cargo: capitalizarPalabras(alumno.cargo) ?? null,
      'Comuna del Establecimiento': capitalizarPalabras(alumno.comuna) ?? null,
      Establecimiento: capitalizarPalabras(alumno.establecimiento) ?? null,
      Carrera: capitalizarPalabras(alumno.carrera) ?? null,
      Institución: capitalizarPalabras(alumno.institucion) ?? null,
      Departamento: capitalizarPalabras(alumno.departamento) ?? null,
      Observación: alumno.observacion ?? null,
      asiste: parseBooleanField(alumno.asiste) ?? false,
      presente: alumno.presente ?? false,
      'Distinción': parseDistincionField(alumno.distincion),
      distincion: parseDistincionField(alumno.distincion),
      'Reconocimiento': parseReconocimientoField(alumno.reconocimiento),
      reconocimiento: parseReconocimientoField(alumno.reconocimiento),
      asiento: alumno.asiento ?? null,
      grupo: alumno.grupo ?? null,
      numeroLista: alumno.numeroLista ?? null,
    };
    
    // Agregar fechaRegistro si existe
    if (fechaRegistroFinal) {
      docData.fechaRegistro = fechaRegistroFinal;
    }
    
    // Agregar ultimaActualizacion
    docData.ultimaActualizacion = new Date();
    
    const docRef = await addDoc(alumnosRef, docData);
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
    const alumnoDoc = await getDoc(alumnoRef);
    const alumnoData = alumnoDoc.data();

    const updateData = {
      presente: Boolean(presente),
      ultimaActualizacion: new Date(),
    };

    // Si se marca como presente y no tiene fechaRegistro, guardarla
    if (presente && !alumnoData?.fechaRegistro) {
      updateData.fechaRegistro = new Date();
    }

    await updateDoc(alumnoRef, updateData);
  } catch (error) {
    console.error('Error al actualizar presencia:', error);
    throw error;
  }
};

// Borrar toda la colección de alumnos de un evento específico
export const borrarColeccionAlumnos = async eventoId => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const querySnapshot = await getDocs(alumnosRef);

    if (querySnapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return { success: true, deletedCount: querySnapshot.size };
  } catch (error) {
    console.error('Error al borrar la colección:', error);
    throw error;
  }
};

// Borrar alumnos de un evento específico (alias para mantener compatibilidad)
export const borrarAlumnosDeEvento = async eventoId => {
  return await borrarColeccionAlumnos(eventoId);
};

export const importarAlumnosDesdeExcel = async (
  file,
  eventoId,
  tipoEvento = 'alumnos'
) => {
  try {
    // Validar que el archivo existe y es válido
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Verificar el tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(
        'El archivo es demasiado grande. El tamaño máximo permitido es 10MB'
      );
    }

    // Verificar que sea un archivo Excel
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        'El archivo debe ser un archivo Excel válido (.xlsx, .xls o .xlsm)'
      );
    }

    // Importar XLSX dinámicamente
    const XLSX = await import('xlsx');

    // Leer el archivo con mejor manejo de errores
    let data;
    try {
      data = await file.arrayBuffer();
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      throw new Error(
        'No se pudo leer el archivo. Verifique que el archivo no esté corrupto y que tenga permisos de lectura'
      );
    }

    // Verificar que el buffer no esté vacío
    if (!data || data.byteLength === 0) {
      throw new Error('El archivo está vacío o corrupto');
    }

    // Intentar leer el workbook
    let workbook;
    try {
      workbook = XLSX.read(data, { type: 'array' });
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      throw new Error(
        'El archivo no es un archivo Excel válido o está corrupto'
      );
    }

    // Verificar que tenga al menos una hoja
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El archivo Excel no contiene ninguna hoja de trabajo');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Verificar que la hoja tenga datos
    if (!worksheet) {
      throw new Error('La hoja de trabajo está vacía');
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Verificar que haya al menos una fila de datos
    if (!jsonData || jsonData.length === 0) {
      throw new Error(
        'El archivo Excel no contiene datos. Asegúrese de que la primera hoja tenga al menos una fila con datos'
      );
    }

    const estaVacio = valor => {
      return (
        valor === null ||
        valor === undefined ||
        valor === '' ||
        (typeof valor === 'string' && valor.trim() === '')
      );
    };

    const normalizarClave = (clave = '') =>
      clave
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/°/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizarAlias = lista => lista.map(normalizarClave);

    const aliasCampos = {
      nombres: normalizarAlias([
        'nombres', 'nombre(s)', 'name', 'primer nombre', 'nombres del alumno', 'nombres del participante', 'nombres del asistente', 'nombre participante', 'nombre asistente', 'nombre alumno', 'nombre', 'participante', 'asistente', 'alumno', 'persona', 'contacto',
      ]),
      apellidos: normalizarAlias([
        'apellidos', 'apellido', 'second name', 'segundo nombre', 'apellidos del alumno', 'apellidos del participante', 'apellidos del asistente',
      ]),
      nombreCompleto: normalizarAlias([
        'nombre completo', 'nombrecompleto', 'nombre y apellido', 'nombre y apellidos', 'full name', 'nombres y apellidos', 'nombre del alumno', 'nombre del participante', 'nombre del asistente', 'nombre participante', 'nombre asistente', 'nombre alumno', 'nombre', 'participante', 'asistente', 'alumno', 'persona', 'contacto',
      ]),
      rut: normalizarAlias([
        'rut', 'r.u.t', 'r.u.t.', 'run', 'r.u.n', 'r.u.n.', 'documento', 'dni', 'cedula', 'cédula', 'id', 'identificacion', 'identificación', 'numero documento', 'nro documento', 'numero de documento', 'nro de documento', 'rut del participante', 'rut participante', 'rut del alumno', 'rut alumno', 'rut del asistente', 'rut asistente', 'run del participante', 'run participante', 'run alumno',
      ]),
      carrera: normalizarAlias(['carrera', 'programa', 'curso', 'especialidad', 'carrera profesional', 'programa de estudios']),
      institucion: normalizarAlias(['institucion', 'institución', 'institucion de origen', 'institución de origen', 'sede', 'universidad', 'centro', 'instituto', 'casa de estudios']),
      asiento: normalizarAlias(['asiento', 'nro asiento', 'numero asiento', 'seat']),
      grupo: normalizarAlias(['grupo', 'grupo nro', 'grupo numero', 'group']),
      numeroLista: normalizarAlias(['numero de lista', 'nro de lista', 'numero lista', 'nro lista', 'n° de lista', 'n de lista', 'n. de lista', 'lista', 'n lista', 'num lista', 'n° lista']),
      estado: normalizarAlias(['estado', 'presente', 'asistencia', 'presente (si,no)', 'presente (si o no)', 'presente (sí o no)', 'presente si o no', 'presente sí o no']),
      fechaRegistro: normalizarAlias(['fecha y hora de registro', 'fecha y hora registro', 'fecha hora registro', 'fecha de registro', 'fecha registro', 'hora de registro', 'hora registro', 'fecha', 'fecha y hora', 'timestamp', 'fecha creacion', 'fecha creación', 'fecha creacion registro', 'fecha creación registro']),
      asiste: normalizarAlias(['asiste', 'asiste (si,no)', 'asiste (si/no)', 'asiste (sí/no)', 'asiste (si o no)', 'asiste (sí o no)', 'confirmación', 'confirmacion', 'preconfirmacion', 'pre confirmacion', 'pre-confirmacion', 'confirmacion asistencia', 'confirmación asistencia', 'confirma asistencia', 'pre asistencia']),
      departamento: normalizarAlias(['departamento', 'área', 'area', 'unidad', 'dependencia', 'departamento/area', 'area/departamento']),
      observacion: normalizarAlias(['observacion', 'observación', 'obs', 'nota', 'notas', 'comentario', 'comentarios']),
      telefono: normalizarAlias(['telefono', 'teléfono', 'celular', 'phone', 'fono', 'movil', 'móvil', 'telefono/celular', 'teléfono/celular', 'telefono de contacto', 'teléfono de contacto', 'telefono participante', 'teléfono participante', 'contacto', 'nro telefono', 'nro teléfono']),
      correo: normalizarAlias(['correo electronico', 'correo electrónico', 'correo', 'email', 'e-mail', 'e mail', 'mail', 'correo de contacto', 'correo institucional', 'correo personal', 'email de contacto', 'correo participante', 'correo del participante']),
      cargo: normalizarAlias(['cargo', 'puesto', 'funcion', 'función', 'position', 'rol', 'cargo/puesto', 'cargo ocupado', 'cargo participante', 'cargo del participante', 'cargo en el establecimiento']),
      comuna: normalizarAlias(['comuna del establecimiento', 'comuna establecimiento', 'comuna de establecimiento', 'comuna', 'municipio', 'ciudad', 'comuna de residencia', 'comuna colegio', 'comuna liceo', 'comuna origen']),
      establecimiento: normalizarAlias(['establecimiento', 'nombre del establecimiento', 'establecimiento de origen', 'colegio', 'escuela', 'liceo', 'centro educativo', 'establecimiento educacional', 'unidad educativa', 'lugar de procedencia', 'rbd']),
      distincion: normalizarAlias(['distincion', 'distinción', 'distincion maxima', 'distinción máxima', 'distincion unanime', 'distinción unánime', 'distincion unánime', 'distinción unanime', 'distincion unanime (si/no)', 'distinción unánime (si/no)', 'distincion unanime (sí/no)', 'distinción unánime (sí/no)', 'distincion maxima (si/no)', 'distinción máxima (si/no)', 'distincion maxima (sí/no)', 'distinción máxima (sí/no)', 'distincion (si/no)', 'distinción (si/no)', 'distincion (sí/no)', 'distinción (sí/no)', 'tiene distincion', 'tiene distinción', 'distincion max', 'distinción máx', 'distincion_maxima', 'distincionmaxima', 'distincion_unanime', 'distincionunanime']),
      reconocimiento: normalizarAlias(['reconocimiento', 'reconocimientos', 'reconocimiento especial', 'reconocimiento (si/no)', 'reconocimiento (sí/no)', 'tiene reconocimiento', 'reconocimiento_especial', 'tipo de reconocimiento', 'tipo reconocimiento']),
    };

    const aliasKeywords = {
      nombres: ['nombres'],
      apellidos: ['apellidos', 'apellido'],
      nombreCompleto: ['nombre', 'participante', 'asistente', 'alumno', 'persona'],
      rut: ['rut', 'run', 'dni', 'cedula', 'identificacion', 'documento'],
      carrera: ['carrera', 'programa', 'curso', 'especialidad'],
      institucion: ['institucion', 'institución', 'sede', 'universidad'],
      telefono: ['telefono', 'celular', 'phone', 'fono', 'movil', 'contacto'],
      correo: ['correo', 'email', 'e mail', 'mail'],
      cargo: ['cargo', 'puesto', 'funcion', 'rol'],
      comuna: ['comuna', 'municipio', 'ciudad'],
      establecimiento: ['establecimiento', 'colegio', 'escuela', 'liceo', 'rbd'],
    };

    const obtenerValorCampo = (fila, alias, keywords = []) => {
      for (const clave of alias) {
        if (Object.prototype.hasOwnProperty.call(fila, clave)) {
          const val = fila[clave];
          if (val !== null && val !== undefined && String(val).trim() !== '') {
            return val;
          }
        }
      }
      if (keywords && keywords.length > 0) {
        for (const [claveFila, val] of Object.entries(fila)) {
          if (val !== null && val !== undefined && String(val).trim() !== '') {
            const claveLower = claveFila.toLowerCase();
            if (keywords.some(kw => claveLower.includes(kw))) {
              return val;
            }
          }
        }
      }
      return null;
    };

    const esEventoTrabajadores = tipoEvento === 'trabajadores';

    const alumnosExistentes = await getAlumnosPorEvento(eventoId);
    const rutsExistentes = new Set(
      alumnosExistentes
        .map(a => a.rut && String(a.rut).replace(/[.-]/g, '').trim().toUpperCase())
        .filter(Boolean)
    );

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const alumno of jsonData) {
      try {
        const filaNormalizada = Object.entries(alumno).reduce(
          (acc, [clave, valor]) => {
            acc[normalizarClave(clave)] = valor;
            return acc;
          },
          {}
        );



        const nombresRaw = obtenerValorCampo(filaNormalizada, aliasCampos.nombres, aliasKeywords.nombres);
        const apellidosRaw = obtenerValorCampo(filaNormalizada, aliasCampos.apellidos, aliasKeywords.apellidos);
        let nombreCompletoRaw = obtenerValorCampo(filaNormalizada, aliasCampos.nombreCompleto, aliasKeywords.nombreCompleto);

        const nombres = capitalizarPalabras(nombresRaw);
        const apellidos = capitalizarPalabras(apellidosRaw);
        let nombreCompleto = capitalizarPalabras(nombreCompletoRaw);

        if (!nombreCompleto && (nombres || apellidos)) {
          nombreCompleto = `${nombres || ''} ${apellidos || ''}`.trim();
        }

        if (estaVacio(nombreCompleto) && estaVacio(nombres) && estaVacio(apellidos)) {
          errorCount++;
          continue;
        }

        const rutRaw = obtenerValorCampo(filaNormalizada, aliasCampos.rut, aliasKeywords.rut);
        const rut = rutRaw != null
          ? String(rutRaw).replace(/[^0-9kK]/gi, '').trim().toUpperCase()
          : null;

        if (estaVacio(rut)) {
          errorCount++;
          continue;
        }

        const carreraRaw = obtenerValorCampo(filaNormalizada, aliasCampos.carrera, aliasKeywords.carrera);
        const carrera = capitalizarPalabras(carreraRaw);

        const institucionRaw = obtenerValorCampo(filaNormalizada, aliasCampos.institucion, aliasKeywords.institucion);
        const institucion = capitalizarPalabras(institucionRaw);

        const asiento = obtenerValorCampo(filaNormalizada, aliasCampos.asiento);
        const grupo = obtenerValorCampo(filaNormalizada, aliasCampos.grupo);
        const numeroListaRaw = obtenerValorCampo(filaNormalizada, aliasCampos.numeroLista);
        const numeroLista = numeroListaRaw != null ? String(numeroListaRaw).trim() : null;
        const estado = obtenerValorCampo(filaNormalizada, aliasCampos.estado);
        const presente = parseBooleanField(estado);

        const departamentoRaw = obtenerValorCampo(filaNormalizada, aliasCampos.departamento);
        const departamento = capitalizarPalabras(departamentoRaw);

        const observacion = obtenerValorCampo(filaNormalizada, aliasCampos.observacion);
        const asisteValor = obtenerValorCampo(filaNormalizada, aliasCampos.asiste);
        const asiste = parseBooleanField(asisteValor);
        
        const { valor: distincionValor, clave: distincionClave } = (fila => {
          for (const clave of aliasCampos.distincion) {
            if (Object.prototype.hasOwnProperty.call(fila, clave)) {
              return { valor: fila[clave], clave };
            }
          }
          return { valor: null, clave: null };
        })(filaNormalizada);
        
        const distincion = parseDistincionField(distincionValor, distincionClave);
        const reconocimientoValor = obtenerValorCampo(filaNormalizada, aliasCampos.reconocimiento);
        const reconocimiento = parseReconocimientoField(reconocimientoValor);
        
        const telefono = obtenerValorCampo(filaNormalizada, aliasCampos.telefono, aliasKeywords.telefono);

        const correoRaw = obtenerValorCampo(filaNormalizada, aliasCampos.correo, aliasKeywords.correo);
        const correo = correoRaw ? String(correoRaw).trim().toLowerCase() : null;

        const cargoRaw = obtenerValorCampo(filaNormalizada, aliasCampos.cargo, aliasKeywords.cargo);
        const cargo = capitalizarPalabras(cargoRaw);

        const comunaRaw = obtenerValorCampo(filaNormalizada, aliasCampos.comuna, aliasKeywords.comuna);
        const comuna = capitalizarPalabras(comunaRaw);

        const establecimientoRaw = obtenerValorCampo(filaNormalizada, aliasCampos.establecimiento, aliasKeywords.establecimiento);
        const establecimiento = capitalizarPalabras(establecimientoRaw);

        const fechaRegistroRaw = obtenerValorCampo(filaNormalizada, aliasCampos.fechaRegistro);
        let fechaRegistro = null;
        if (fechaRegistroRaw) {
          try {
            const fechaParseada = new Date(fechaRegistroRaw);
            if (!isNaN(fechaParseada.getTime())) {
              fechaRegistro = fechaParseada;
            }
          } catch (err) {
            console.warn('No se pudo parsear la fecha de registro:', fechaRegistroRaw);
          }
        }

        const departamentoFinal = esEventoTrabajadores ? (departamento ?? null) : departamento;
        const carreraFinal = estaVacio(carrera) ? (esEventoTrabajadores ? 'Colaboradores Santo Tomás' : null) : carrera;
        const institucionFinal = estaVacio(institucion) ? null : institucion;



        const rutNormalizado = String(rut).toUpperCase();
        if (rutsExistentes.has(rutNormalizado)) {
          skippedCount++;
          continue;
        }

        await agregarAlumno(
          {
            nombres,
            apellidos,
            nombre: nombreCompleto,
            rut: rut,
            telefono: telefono ? String(telefono).trim() : null,
            correo: correo ? String(correo).trim() : null,
            cargo: cargo ? String(cargo).trim() : null,
            comuna: comuna ? String(comuna).trim() : null,
            establecimiento: establecimiento ? String(establecimiento).trim() : null,
            carrera: carreraFinal || null,
            institucion: esEventoTrabajadores ? null : (institucionFinal ? String(institucionFinal).trim() : null),
            asiento: esEventoTrabajadores ? null : asiento,
            grupo: esEventoTrabajadores ? null : grupo,
            numeroLista: esEventoTrabajadores ? null : numeroLista,
            presente: presente ?? false,
            distincion: distincion ?? false,
            reconocimiento: reconocimiento ?? false,
            departamento: esEventoTrabajadores ? departamentoFinal : null,
            observacion: esEventoTrabajadores ? (observacion ?? null) : null,
            asiste: asiste ?? false,
            fechaRegistro: fechaRegistro,
          },
          eventoId
        );

        successCount++;
      } catch (error) {
        console.error('Error al importar alumno:', error);
        errorCount++;
      }
    }

    if (successCount === 0) {
      if (skippedCount > 0 && errorCount === 0) {
        return {
          successCount: 0,
          errorCount: 0,
          skippedCount,
          message: `Todos los participantes (${skippedCount}) ya están registrados en este evento.`,
        };
      }
      if (skippedCount > 0) {
        return {
          successCount: 0,
          errorCount,
          skippedCount,
          message: `No se agregaron nuevos participantes: ${skippedCount} ya están registrados en este evento (${errorCount} filas omitidas por faltar Nombre o RUT).`,
        };
      }
      throw new Error(`No se pudo importar ningún alumno. Asegúrese de que el archivo Excel contenga columnas con al menos el Nombre y el RUT del participante.`);
    }

    return {
      successCount,
      errorCount,
      skippedCount,
      message: `Importación completada: ${successCount} agregados, ${skippedCount} duplicados omitidos, ${errorCount} errores`,
    };
  } catch (error) {
    console.error('Error en importarAlumnosDesdeExcel:', error);
    throw new Error(`Error al procesar el archivo: ${error.message}`);
  }
};
