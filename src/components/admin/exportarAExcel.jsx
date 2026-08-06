import * as XLSX from 'xlsx';

// Función helper para formatear fecha de Firestore
const formatearFecha = fecha => {
  if (!fecha) return '';

  try {
    // Si es un Timestamp de Firestore, convertir a Date
    const fechaDate = fecha.toDate ? fecha.toDate() : new Date(fecha);

    // Formatear como DD/MM/YYYY HH:MM:SS
    const dia = String(fechaDate.getDate()).padStart(2, '0');
    const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const año = fechaDate.getFullYear();
    const horas = String(fechaDate.getHours()).padStart(2, '0');
    const minutos = String(fechaDate.getMinutes()).padStart(2, '0');
    const segundos = String(fechaDate.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

const formatearSiNo = valor => {
  return valor ? 'Sí' : 'No';
};

// Normaliza textos para evitar duplicados por espacios o mayúsculas/minúsculas
const normalizarTexto = valor => {
  if (typeof valor !== 'string') return valor || '';
  // Elimina espacios dobles, recorta y aplica Title Case simple
  const limpio = valor.replace(/\s+/g, ' ').trim().toLowerCase();
  return limpio
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

// Mapeo específico para unificar nombres de carrera
const normalizarCarrera = valor => {
  const base = normalizarTexto(valor);
  const llave = base.toLowerCase();
  const mapaCarreras = {
    'ingenieria en informatica': 'Ingenieria en Informatica',
    'ingeniera en informatica': 'Ingenieria en Informatica',
    'ingenieria en informática': 'Ingenieria en Informatica',
    'ingeniera en informática': 'Ingenieria en Informatica'
  };
  return mapaCarreras[llave] || base;
};

export const exportarAExcel = (
  alumnos,
  nombreEvento = 'Evento',
  tipoEvento = 'alumnos',
  filtroEstado = ''
) => {
  try {
    const esFuncionarios = tipoEvento === 'trabajadores';

    // Aplicar filtro de estado si existe
    let alumnosFiltrados = alumnos;
    if (filtroEstado) {
      switch (filtroEstado) {
        case 'presentes':
          alumnosFiltrados = alumnos.filter(a => a.presente);
          break;
        case 'ausentes':
          alumnosFiltrados = alumnos.filter(a => !a.presente);
          break;
        case 'confirmados':
          alumnosFiltrados = alumnos.filter(a => a.asiste);
          break;
        case 'pendientes':
          alumnosFiltrados = alumnos.filter(a => !a.asiste);
          break;
        default:
          alumnosFiltrados = alumnos;
      }
    }

    if (!alumnosFiltrados || alumnosFiltrados.length === 0) return false;

    // 1. Mapear cada fila con sus datos reales existentes
    const todosLosDatosMapeados = alumnosFiltrados.map(alumno => {
      const fila = {};

      // Estado / Presente
      fila['Estado'] = alumno.presente ? 'Presente' : 'Ausente';

      // RUT
      if (alumno.rut) fila['RUT'] = alumno.rut;

      // Nombre Completo
      const nombreCompleto = alumno.nombre || `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim();
      if (nombreCompleto) {
        fila['Nombre Completo'] = nombreCompleto;
      }

      // Nombres y Apellidos (solo si existen por separado)
      if (alumno.nombres && alumno.apellidos) {
        fila['Nombres'] = alumno.nombres;
        fila['Apellidos'] = alumno.apellidos;
      }

      // Teléfono
      if (alumno.telefono) fila['Teléfono'] = alumno.telefono;

      // Correo electrónico
      if (alumno.correo) fila['Correo electrónico'] = alumno.correo;

      // Establecimiento
      if (alumno.establecimiento) {
        fila['Establecimiento'] = alumno.establecimiento;
      }

      // Cargo
      if (alumno.cargo) fila['Cargo'] = alumno.cargo;

      // Comuna del Establecimiento
      if (alumno.comuna) fila['Comuna del Establecimiento'] = alumno.comuna;

      // Carrera
      if (alumno.carrera && alumno.carrera !== 'General' && alumno.carrera !== 'Colaboradores Santo Tomás') {
        fila['Carrera'] = alumno.carrera;
      }

      // Institución (solo si es distinta de establecimiento)
      if (alumno.institucion && alumno.institucion !== alumno.establecimiento) {
        fila['Institución'] = alumno.institucion;
      }

      // Asiento, Grupo, N° Lista
      if (alumno.asiento) fila['Asiento'] = alumno.asiento;
      if (alumno.grupo) fila['Grupo'] = alumno.grupo;
      if (alumno.numeroLista) fila['N° de Lista'] = alumno.numeroLista;

      // Distinción & Reconocimiento (solo si tienen valor real)
      if (alumno.distincion && alumno.distincion !== 'No' && alumno.distincion !== false) {
        fila['Distinción'] = typeof alumno.distincion === 'string' && alumno.distincion !== 'true'
          ? alumno.distincion
          : 'Distinción Máxima';
      }
      if (alumno.reconocimiento && alumno.reconocimiento !== 'No' && alumno.reconocimiento !== false) {
        fila['Reconocimiento'] = typeof alumno.reconocimiento === 'string' && alumno.reconocimiento !== 'true'
          ? alumno.reconocimiento
          : 'Sí';
      }

      // Departamento / Observación
      if (alumno.departamento) fila['Departamento'] = alumno.departamento;
      if (alumno.observacion) fila['Observación'] = alumno.observacion;

      // Confirmación previa (solo si existe información explícita de confirmación previa)
      const hayConfirmacion = alumnosFiltrados.some(a => a.asiste === true);
      if (hayConfirmacion) {
        fila['Confirmación Previa'] = alumno.asiste ? 'Sí' : 'No';
      }

      // Fecha y hora de registro (si está presente)
      if (alumno.presente) {
        const fecha = formatearFecha(alumno.fechaRegistro) || formatearFecha(alumno.ultimaActualizacion);
        if (fecha) fila['Fecha y Hora de Registro'] = fecha;
      }

      // Datos Extra dinámicos
      if (alumno.datosExtra && typeof alumno.datosExtra === 'object') {
        Object.entries(alumno.datosExtra).forEach(([k, v]) => {
          if (v != null && String(v).trim() !== '') {
            fila[k] = String(v).trim();
          }
        });
      }

      return fila;
    });

    // 2. Identificar únicamente las columnas que tienen datos en al menos 1 fila del conjunto
    const columnasConDatos = [];
    todosLosDatosMapeados.forEach(fila => {
      Object.keys(fila).forEach(col => {
        if (!columnasConDatos.includes(col)) {
          columnasConDatos.push(col);
        }
      });
    });

    // 3. Crear matriz final para exportar con solo las columnas activas
    const datosParaExportar = todosLosDatosMapeados.map(fila => {
      const nuevaFila = {};
      columnasConDatos.forEach(col => {
        nuevaFila[col] = fila[col] !== undefined && fila[col] !== null ? fila[col] : '';
      });
      return nuevaFila;
    });

    // 4. Generar hoja Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);

    // Ajustar ancho de columnas
    const widthsConfig = {
      'Nombre Completo': 28,
      'RUT': 15,
      'Nombres': 20,
      'Apellidos': 20,
      'Cargo': 22,
      'Comuna del Establecimiento': 25,
      'Establecimiento': 28,
      'Teléfono': 16,
      'Correo electrónico': 26,
      'Carrera': 25,
      'Institución': 22,
      'Asiento': 10,
      'Grupo': 10,
      'N° de Lista': 12,
      'Distinción': 20,
      'Reconocimiento': 20,
      'Estado': 12,
      'Fecha y Hora de Registro': 25,
      'Confirmación Previa': 20,
      'Observación': 30
    };

    worksheet['!cols'] = columnasConDatos.map(col => ({ wch: widthsConfig[col] || Math.max(col.length + 4, 15) }));

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      esFuncionarios ? 'Funcionarios' : 'Participantes'
    );

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${nombreEvento}_${esFuncionarios ? 'Funcionarios' : 'Participantes'}_${fecha}.xlsx`;

    XLSX.writeFile(workbook, nombreArchivo);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};
