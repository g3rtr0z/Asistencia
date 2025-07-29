import * as XLSX from 'xlsx';

export const exportarAExcel = (alumnos, nombreEvento = 'Evento') => {
  try {
    // Preparar los datos para exportar
    const datosParaExportar = alumnos.map(alumno => ({
      'RUT': alumno.rut || '',
      'Nombres': alumno.nombres || '',
      'Apellidos': alumno.apellidos || '',
      'Nombre Completo': alumno.nombre || '',
      'Carrera': alumno.carrera || '',
      'Institución': alumno.institucion || '',
      'Asiento': alumno.asiento || '',
      'Grupo': alumno.grupo || '',
      'Presente': alumno.presente ? 'Sí' : 'No',
      'Fecha de Registro': alumno.fechaRegistro ? new Date(alumno.fechaRegistro.toDate()).toLocaleString('es-ES') : ''
    }));

    // Crear el workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 15 }, // RUT
      { wch: 20 }, // Nombres
      { wch: 20 }, // Apellidos
      { wch: 30 }, // Nombre Completo
      { wch: 25 }, // Carrera
      { wch: 20 }, // Institución
      { wch: 10 }, // Asiento
      { wch: 10 }, // Grupo
      { wch: 10 }, // Presente
      { wch: 20 }  // Fecha de Registro
    ];
    worksheet['!cols'] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

    // Generar el nombre del archivo con el nombre del evento
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nombreArchivo = `${nombreEvento}_Alumnos_${fecha}.xlsx`;

    // Exportar el archivo
    XLSX.writeFile(workbook, nombreArchivo);

    console.log(`Archivo exportado: ${nombreArchivo}`);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};