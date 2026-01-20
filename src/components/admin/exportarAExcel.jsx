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

    // Preparar los datos mapeados primero
    const todosLosDatosMapeados = esFuncionarios
      ? alumnosFiltrados.map(alumno => ({
        'Asiste (Pre confirmación)': formatearSiNo(alumno.asiste),
        Presente: alumno.presente ? 'Sí' : 'No',
        RUT: alumno.rut || '',
        Nombres: alumno.nombres || '',
        Apellidos: alumno.apellidos || '',
        Observación: alumno.observacion || '',
        'Fecha y Hora de Registro':
          alumno.presente
            ? (formatearFecha(alumno.fechaRegistro) ||
               formatearFecha(alumno.ultimaActualizacion) ||
               '')
            : '',
      }))
      : alumnosFiltrados.map(alumno => ({
        RUT: alumno.rut || '',
        Nombres: alumno.nombres || '',
        Apellidos: alumno.apellidos || '',
        Carrera: alumno.carrera || '',
        Institución: alumno.institucion || '',
        Asiento: alumno.asiento || '',
        Grupo: alumno.grupo || '',
        'N° de Lista': alumno.numeroLista || '',
        Presente: alumno.presente ? 'Sí' : 'No',
        'Fecha y Hora de Registro':
          alumno.presente
            ? (formatearFecha(alumno.fechaRegistro) ||
               formatearFecha(alumno.ultimaActualizacion) ||
               '')
            : '',
      }));

    // Identificar columnas que tienen al menos un dato no vacío
    if (todosLosDatosMapeados.length === 0) return false;

    const columnasConDatos = Object.keys(todosLosDatosMapeados[0]).filter(columna => {
      // Siempre mantener algunas columnas clave
      const columnasClave = ['RUT', 'Nombres', 'Apellidos', 'Presente'];
      if (columnasClave.includes(columna)) return true;

      // Para las demás, verificar si hay algún dato
      return todosLosDatosMapeados.some(fila => fila[columna] !== null && String(fila[columna]).trim() !== '');
    });

    // Crear nuevos objetos solo con las columnas que tienen datos
    const datosParaExportar = todosLosDatosMapeados.map(fila => {
      const nuevaFila = {};
      columnasConDatos.forEach(col => {
        nuevaFila[col] = fila[col];
      });
      return nuevaFila;
    });

    // Crear el workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);

    // Ajustar el ancho de las columnas dinámicamente
    const widthsConfig = {
      'RUT': 15,
      'Nombres': 20,
      'Apellidos': 20,
      'Carrera': 25,
      'Institución': 20,
      'Asiento': 10,
      'Grupo': 10,
      'N° de Lista': 12,
      'Presente': 10,
      'Fecha y Hora de Registro': 25,
      'Asiste (Pre confirmación)': 20,
      'Observación': 30
    };

    worksheet['!cols'] = columnasConDatos.map(col => ({ wch: widthsConfig[col] || 15 }));

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      esFuncionarios ? 'Funcionarios' : 'Alumnos'
    );

    // Generar el nombre del archivo con el nombre del evento
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nombreArchivo = `${nombreEvento}_${esFuncionarios ? 'Funcionarios' : 'Alumnos'}_${fecha}.xlsx`;

    // Exportar el archivo
    XLSX.writeFile(workbook, nombreArchivo);

    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};
