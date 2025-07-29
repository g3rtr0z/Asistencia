import React, { useState, useEffect } from 'react';
import { agregarAlumno } from '../../services/alumnosService';
import { getEventoActivo } from '../../services/eventosService';
import * as XLSX from 'xlsx';

function ImportExcel({ onImportComplete, eventoId = null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [eventoActivo, setEventoActivo] = useState(null);

  useEffect(() => {
    const obtenerEvento = async () => {
      try {
        if (eventoId) {
          // Si se proporciona un eventoId específico, usarlo
          setEventoActivo({ id: eventoId });
        } else {
          // Si no se proporciona eventoId, obtener el evento activo
          const evento = await getEventoActivo();
          setEventoActivo(evento);
        }
      } catch (error) {
        console.error('Error al obtener evento:', error);
      }
    };
    obtenerEvento();
  }, [eventoId]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setMessage('Por favor selecciona un archivo Excel válido (.xlsx, .xls, .csv)');
      return;
    }

    if (!eventoActivo) {
      setMessage('Error: No hay un evento disponible para importar alumnos.');
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
          const nombres = alumno["Nombres"] ?? null;
          const apellidos = alumno["Apellidos"] ?? null;
          let nombreCompleto = alumno["Nombre Completo"] ?? null;
          // Si no hay nombre completo pero sí nombres y apellidos, lo armo solo para compatibilidad
          if (!nombreCompleto && nombres && apellidos) {
            nombreCompleto = `${nombres} ${apellidos}`;
          }
          if (!(nombres && apellidos) && !nombreCompleto) {
            errorCount++;
            continue;
          }
          if (!alumno["RUT"] || !alumno["Carrera"] || !alumno["Institución"]) {
            errorCount++;
            continue;
          }
          // Guardar el RUT tal como viene (sin puntos ni guión)
          await agregarAlumno({
            nombres,
            apellidos,
            nombre: nombreCompleto,
            rut: String(alumno["RUT"]),
            carrera: alumno["Carrera"],
            institucion: alumno["Institución"],
            asiento: alumno["asiento"] ?? alumno["Asiento"] ?? null,
            grupo: alumno["grupo"] ?? alumno["Grupo"] ?? null
          }, eventoActivo.id); // Pasar el eventoId
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
      
      {eventoActivo && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Evento:</strong> {eventoId ? 'Nuevo evento' : 'Evento activo'}
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={loading || !eventoActivo}
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
Gerson Uziel Valdebenito | 203550618 | Ing. En Informatica | IP ST`}
        </pre>
        <p className="mt-2">El RUT debe ir sin puntos ni guión, solo números y dígito verificador.</p>
        {!eventoActivo && (
          <p className="mt-2 text-red-600">
            <strong>Importante:</strong> Necesitas tener un evento disponible para importar alumnos.
          </p>
        )}
      </div>
    </div>
  );
}

export default ImportExcel; 