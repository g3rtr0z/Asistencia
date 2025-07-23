import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';


export const exportarAExcel = (alumnos) => {
    // Mapeo para mostrar "Presente" o "Ausente" y ordenar las columnas
    const alumnosFormateados = alumnos.map(({ id, nombre, rut, carrera, institucion, presente }) => ({
        "Nombre Completo": nombre,
        "RUT": rut,
        "Carrera": carrera,
        "Institución": institucion,
        "Estado": presente ? "Presente" : "Ausente"
    }));

    const worksheet = XLSX.utils.json_to_sheet(alumnosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'AlumnosPresentes.xlsx');
};