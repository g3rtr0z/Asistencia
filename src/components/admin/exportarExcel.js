import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportarAExcel(alumnos) {
  // Mapeo para mostrar "Presente" o "Ausente" y eliminar el campo id, además renombrar la columna a 'Estado'
  const alumnosFormateados = alumnos.map(({ id, presente, ...rest }) => ({
    ...rest,
    Estado: presente ? "Presente" : "Ausente"
  }));

  const worksheet = XLSX.utils.json_to_sheet(alumnosFormateados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'AlumnosPresentes.xlsx');
} 