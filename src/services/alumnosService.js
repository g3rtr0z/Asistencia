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

const parseBooleanField = valor => {
  if (typeof valor === 'boolean') return valor;
  if (valor === null || valor === undefined) return null;
  const texto = valor.toString().trim().toLowerCase();
  if (!texto) return null;
  const afirmativos = ['si', 'sí', 'yes', 'true', '1'];
  const negativos = ['no', 'false', '0'];
  if (afirmativos.includes(texto)) return true;
  if (negativos.includes(texto)) return false;
  return null;
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
  return {
    id: doc.id,
    nombres: data['Nombres'] ?? null,
    apellidos: data['Apellidos'] ?? null,
    nombre:
      data['Nombre Completo'] ??
      (data['Nombres'] && data['Apellidos']
        ? `${data['Nombres']} ${data['Apellidos']}`
        : null),
    rut: data['RUT'],
    carrera: data['Carrera'],
    institucion: data['Institución'],
    departamento: data['Departamento'] ?? null,
    observacion: data['Observación'] ?? data['Observacion'] ?? null,
    presente: Boolean(data.presente),
    asiste: parseBooleanField(asisteValor) ?? false,
    asiento: data['asiento'] ?? null,
    grupo: data['grupo'] ?? null,
    numeroLista: data['numeroLista'] ?? data['N° de Lista'] ?? data['N de Lista'] ?? data['numero de lista'] ?? data['nro de lista'] ?? null,
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
      const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
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
          const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
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
        const alumnos = querySnapshot.docs.map(mapFirestoreData);
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

    // Suscribirse a cambios en eventos activos
    const eventosRef = collection(db, 'eventos');
    const qEvento = query(eventosRef, where('activo', '==', true));

    const unsubscribeEventos = onSnapshot(
      qEvento,
      async eventoSnapshot => {
        if (eventoSnapshot.empty) {
          callback([]);
          return;
        }

        const eventoActivo = eventoSnapshot.docs[0];
        const eventoId = eventoActivo.id;
        // Suscribirse a cambios en alumnos de la colección específica de ese evento
        const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
        const unsubscribeAlumnos = onSnapshot(
          alumnosRef,
          alumnosSnapshot => {
            const alumnos = alumnosSnapshot.docs.map(mapFirestoreData);
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

        // Retornar función para cancelar ambas suscripciones
        return () => {
          unsubscribeAlumnos();
        };
      },
      error => {
        console.error('Error en onSnapshot evento activo:', error);
        if (errorCallback) errorCallback(error);
      }
    );

    return unsubscribeEventos;
  } catch (error) {
    if (errorCallback) errorCallback(error);
  }
};

// Buscar alumno por RUT en evento específico
export const buscarAlumnoPorRutEnEvento = async (rut, eventoId) => {
  try {
    const alumnosRef = collection(db, `eventos/${eventoId}/alumnos`);
    const q = query(alumnosRef, where('RUT', '==', rut));
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
    const docRef = await addDoc(alumnosRef, {
      Nombres: alumno.nombres ?? null,
      Apellidos: alumno.apellidos ?? null,
      'Nombre Completo': alumno.nombre,
      RUT: alumno.rut,
      Carrera: alumno.carrera,
      Institución: alumno.institucion,
      Departamento: alumno.departamento ?? null,
      Observación: alumno.observacion ?? null,
      asiste: parseBooleanField(alumno.asiste) ?? false,
      presente: alumno.presente ?? false,
      asiento: alumno.asiento ?? null,
      grupo: alumno.grupo ?? null,
      numeroLista: alumno.numeroLista ?? null,
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

    // Función para verificar si un valor está vacío
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
        .replace(/[\u0300-\u036f]/g, '');

    const normalizarAlias = lista => lista.map(normalizarClave);

    const aliasCampos = {
      nombres: normalizarAlias([
        'nombres',
        'nombre',
        'nombre(s)',
        'name',
        'primer nombre',
        'nombres del alumno',
        'nombre del alumno',
      ]),
      apellidos: normalizarAlias([
        'apellidos',
        'apellido',
        'second name',
        'segundo nombre',
        'apellidos del alumno',
        'apellido del alumno',
      ]),
      nombreCompleto: normalizarAlias([
        'nombre completo',
        'nombrecompleto',
        'nombre y apellido',
        'nombre y apellidos',
        'full name',
      ]),
      rut: normalizarAlias([
        'rut',
        'r.u.t',
        'r.u.t.',
        'documento',
        'dni',
        'cedula',
        'cédula',
        'id',
        'identificacion',
        'identificación',
        'numero documento',
        'nro documento',
        'numero de documento',
        'nro de documento',
      ]),
      carrera: normalizarAlias([
        'carrera',
        'programa',
        'curso',
        'especialidad',
        'carrera profesional',
        'programa de estudios',
      ]),
      institucion: normalizarAlias([
        'institucion',
        'institución',
        'institucion de origen',
        'institución de origen',
        'sede',
        'universidad',
        'colegio',
        'centro',
        'instituto',
        'casa de estudios',
      ]),
      asiento: normalizarAlias([
        'asiento',
        'nro asiento',
        'numero asiento',
        'seat',
      ]),
      grupo: normalizarAlias([
        'grupo',
        'grupo nro',
        'grupo numero',
        'group',
      ]),
      numeroLista: normalizarAlias([
        'n° de lista',
        'n de lista',
        'n. de lista',
        'numero de lista',
        'nro de lista',
        'numero lista',
        'nro lista',
        'lista',
        'n lista',
        'num lista',
        'numero de lista',
        'n° lista',
        'n lista',
      ]),
      estado: normalizarAlias([
        'estado',
        'presente',
        'asistencia',
        'presente (si,no)',
      ]),
      asiste: normalizarAlias([
        'asiste',
        'asiste (si,no)',
        'asiste (si/no)',
        'asiste (sí/no)',
        'asiste (si o no)',
        'asiste (sí o no)',
        'confirmación',
        'confirmacion',
        'preconfirmacion',
        'pre confirmacion',
        'pre-confirmacion',
        'confirmacion asistencia',
        'confirmación asistencia',
        'confirma asistencia',
        'pre asistencia',
      ]),
      departamento: normalizarAlias([
        'departamento',
        'área',
        'area',
        'unidad',
        'dependencia',
        'departamento/area',
        'area/departamento',
      ]),
      observacion: normalizarAlias([
        'observacion',
        'observación',
        'obs',
        'nota',
        'notas',
        'comentario',
        'comentarios',
      ]),
    };

    const obtenerValorCampo = (fila, alias) => {
      for (const clave of alias) {
        if (Object.prototype.hasOwnProperty.call(fila, clave)) {
          return fila[clave];
        }
      }
      return null;
    };

    const esEventoTrabajadores = tipoEvento === 'trabajadores';

    let successCount = 0;
    let errorCount = 0;

    for (const alumno of jsonData) {
      try {
        // Normalizar claves de la fila para permitir cualquier nombre de columna
        const filaNormalizada = Object.entries(alumno).reduce(
          (acc, [clave, valor]) => {
            acc[normalizarClave(clave)] = valor;
            return acc;
          },
          {}
        );

        const nombres = obtenerValorCampo(filaNormalizada, aliasCampos.nombres);
        const apellidos = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.apellidos
        );
        let nombreCompleto = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.nombreCompleto
        );

        // Si no hay nombre completo pero sí nombres y apellidos, lo armo
        if (!nombreCompleto && nombres && apellidos) {
          nombreCompleto = `${nombres} ${apellidos}`;
        }

        // Validar que exista nombre (ya sea completo o compuesto)
        if (
          (estaVacio(nombres) || estaVacio(apellidos)) &&
          estaVacio(nombreCompleto)
        ) {
          errorCount++;
          continue;
        }

        const rut = obtenerValorCampo(filaNormalizada, aliasCampos.rut);

        // Validar campos obligatorios
        if (estaVacio(rut)) {
          errorCount++;
          continue;
        }

        const carrera = obtenerValorCampo(filaNormalizada, aliasCampos.carrera);
        const institucion = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.institucion
        );
        const asiento = obtenerValorCampo(filaNormalizada, aliasCampos.asiento);
        const grupo = obtenerValorCampo(filaNormalizada, aliasCampos.grupo);
        const numeroLista = obtenerValorCampo(filaNormalizada, aliasCampos.numeroLista);
        const estado = obtenerValorCampo(filaNormalizada, aliasCampos.estado);
        const presente = parseBooleanField(estado);
        const departamento = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.departamento
        );
        const observacion = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.observacion
        );
        const asisteValor = obtenerValorCampo(
          filaNormalizada,
          aliasCampos.asiste
        );
        const asiste = parseBooleanField(asisteValor);

        // Para eventos de trabajadores, solo usamos departamento; institución ya no aplica
        const departamentoFinal = esEventoTrabajadores
          ? (departamento ?? null)
          : departamento;

        const carreraFinal = estaVacio(carrera)
          ? esEventoTrabajadores
            ? 'Colaboradores Santo Tomás'
            : null
          : carrera;
        const institucionFinal = estaVacio(institucion) ? null : institucion;

        if (
          !esEventoTrabajadores &&
          (estaVacio(carreraFinal) || estaVacio(institucionFinal))
        ) {
          errorCount++;
          continue;
        }

        // Guardar el RUT tal como viene (sin puntos ni guión)
        await agregarAlumno(
          {
            nombres,
            apellidos,
            nombre: nombreCompleto,
            rut: String(rut),
            carrera: carreraFinal || 'Sin definir',
            institucion: esEventoTrabajadores
              ? null
              : institucionFinal || 'Sin definir',
            asiento: esEventoTrabajadores ? null : asiento,
            grupo: esEventoTrabajadores ? null : grupo,
            numeroLista: esEventoTrabajadores ? null : numeroLista,
            presente: presente ?? false,
            departamento: esEventoTrabajadores ? departamentoFinal : null,
            observacion: esEventoTrabajadores ? (observacion ?? null) : null,
            asiste: asiste ?? false,
          },
          eventoId
        );

        successCount++;
      } catch (error) {
        console.error('Error al importar alumno:', error);
        errorCount++;
      }
    }

    if (successCount === 0 && errorCount > 0) {
      throw new Error(
        `No se pudo importar ningún alumno. Verifica el formato del archivo.`
      );
    }

    return {
      successCount,
      errorCount,
      message: `Importación completada: ${successCount} exitosos, ${errorCount} errores`,
    };
  } catch (error) {
    console.error('Error en importarAlumnosDesdeExcel:', error);
    throw new Error(`Error al procesar el archivo: ${error.message}`);
  }
};
