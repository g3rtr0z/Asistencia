import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';


export const exportarAExcel = (alumnos) => {
    // Mapeo para mostrar "Presente" o "Ausente" y separar nombres y apellidos
    const alumnosFormateados = alumnos.map((al) => {
        let nombres = al.nombres;
        let apellidos = al.apellidos;
        if (!nombres || !apellidos) {
            // Si no existen, intentar separar el nombre completo
            if (al.nombre) {
                const partes = al.nombre.split(' ');
                nombres = partes.slice(0, -2).join(' ') || partes[0] || '';
                apellidos = partes.slice(-2).join(' ') || '';
            } else {
                nombres = '';
                apellidos = '';
            }
        }
        return {
            "Nombres": nombres,
            "Apellidos": apellidos,
            "RUT": al.rut,
            "Carrera": al.carrera,
            "Institución": al.institucion,
            "Estado": al.presente ? "Presente" : "Ausente",
            "Asiento": al.asiento,
            "Grupo": al.grupo ?? ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(alumnosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'AlumnosPresentes.xlsx');
};