import React, { useState } from 'react';
import { agregarAlumno } from '../../services/alumnosService';
import * as XLSX from 'xlsx';

function ImportExcel({ onImportComplete }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || !['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'].includes(selectedFile.type)) {
      setMessage('Por favor selecciona un archivo Excel válido (.xlsx, .xls, .csv)');
      return;
    }
    setLoading(true);
    setMessage('Importando datos...');
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      let successCount = 0;
      let errorCount = 0;
      for (const alumno of jsonData) {
        try {
          if (!alumno["Nombre Completo"] || !alumno["RUT"] || !alumno["Carrera"] || !alumno["Institución"]) {
            errorCount++;
            continue;
          }
          await agregarAlumno({
            nombre: alumno["Nombre Completo"],
            rut: alumno["RUT"],
            carrera: alumno["Carrera"],
            institucion: alumno["Institución"]
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
      setMessage(`Importación completada: ${successCount} exitosos, ${errorCount} errores`);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setMessage('Error: El archivo no es un Excel válido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md mx-auto">
      <h3 className="text-xl font-bold text-green-800 mb-4">Importar Datos Excel</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
        />
      </div>
      {message && (
        <div className={`p-3 rounded-md mb-4 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
      )}
      <div className="text-xs text-gray-500">
        <p><strong>Formato esperado:</strong></p>
        <pre className="bg-gray-50 p-2 rounded mt-1">
{`Nombre Completo | RUT | Carrera | Institución
Juan Pérez      | 12.345.678-9 | Técnico en Enfermería | CFT`}
        </pre>
        <p className="mt-2">Asegúrate de que la primera fila del Excel tenga los nombres de las columnas como en el ejemplo.</p>
      </div>
    </div>
  );
}

export default ImportExcel; 