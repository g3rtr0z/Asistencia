import * as XLSX from 'xlsx';

// Función helper para formatear fecha de Firestore
const formatearFecha = (fecha) => {
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

const formatearSiNo = (valor) => {
  return valor ? 'Sí' : 'No';
};

export const exportarAExcel = (alumnos, nombreEvento = 'Evento', tipoEvento = 'alumnos', filtroEstado = '') => {
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

    // Preparar los datos para exportar
    const datosParaExportar = esFuncionarios
      ? alumnosFiltrados.map(alumno => ({
          'Asiste (Pre confirmación)': formatearSiNo(alumno.asiste),
          'Presente': alumno.presente ? 'Sí' : 'No',
          'RUT': alumno.rut || '',
          'Nombres': alumno.nombres || '',
          'Apellidos': alumno.apellidos || '',
          'Departamento': alumno.departamento || '',
          'Observación': alumno.observacion || '',
          'Fecha y Hora de Registro': formatearFecha(alumno.fechaRegistro) || formatearFecha(alumno.ultimaActualizacion) || ''
        }))
      : alumnosFiltrados.map(alumno => ({
          'RUT': alumno.rut || '',
          'Nombres': alumno.nombres || '',
          'Apellidos': alumno.apellidos || '',
          'Nombre Completo': alumno.nombre || '',
          'Carrera': alumno.carrera || '',
          'Institución': alumno.institucion || '',
          'Asiento': alumno.asiento || '',
          'N° de Lista': alumno.grupo || '',
          'Presente': alumno.presente ? 'Sí' : 'No',
          'Fecha y Hora de Registro': formatearFecha(alumno.fechaRegistro) || formatearFecha(alumno.ultimaActualizacion) || ''
        }));

    // Crear el workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);

    // Ajustar el ancho de las columnas
    const columnWidths = esFuncionarios
      ? [
          { wch: 20 }, // Asiste (Pre confirmación)
          { wch: 10 }, // Presente
          { wch: 15 }, // RUT
          { wch: 20 }, // Nombres
          { wch: 20 }, // Apellidos
          { wch: 25 }, // Departamento
          { wch: 30 }, // Observación
          { wch: 25 }  // Fecha y Hora de Registro
        ]
      : [
          { wch: 15 }, // RUT
          { wch: 20 }, // Nombres
          { wch: 20 }, // Apellidos
          { wch: 30 }, // Nombre Completo
          { wch: 25 }, // Carrera
          { wch: 20 }, // Institución
          { wch: 10 }, // Asiento
          { wch: 12 }, // N° de Lista
          { wch: 10 }, // Presente
          { wch: 25 }  // Fecha y Hora de Registro
        ];
    worksheet['!cols'] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, esFuncionarios ? 'Funcionarios' : 'Alumnos');

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