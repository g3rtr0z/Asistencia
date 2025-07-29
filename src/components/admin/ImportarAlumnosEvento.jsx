import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { agregarAlumno } from '../../services/alumnosService';
import { getAlumnosEjemploPorEvento } from '../../services/eventosAlumnosService';

function ImportarAlumnosEvento({ eventos, onImportComplete }) {
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [alumnosEvento, setAlumnosEvento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);

  const handleEventoChange = (eventoId) => {
    setEventoSeleccionado(eventoId);
    if (eventoId) {
      const alumnos = getAlumnosEjemploPorEvento(eventoId);
      setAlumnosEvento(alumnos);
    } else {
      setAlumnosEvento([]);
    }
    setAlumnosSeleccionados([]);
  };

  const handleAlumnoToggle = (alumno) => {
    setAlumnosSeleccionados(prev => {
      const existe = prev.find(a => a.rut === alumno.rut);
      if (existe) {
        return prev.filter(a => a.rut !== alumno.rut);
      } else {
        return [...prev, alumno];
      }
    });
  };

  const handleSelectAll = () => {
    if (alumnosSeleccionados.length === alumnosEvento.length) {
      setAlumnosSeleccionados([]);
    } else {
      setAlumnosSeleccionados([...alumnosEvento]);
    }
  };

  const handleImportar = async () => {
    if (alumnosSeleccionados.length === 0) {
      setMensaje('Por favor selecciona al menos un alumno');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const promises = alumnosSeleccionados.map(alumno =>
        agregarAlumno({
          nombres: alumno.nombres,
          apellidos: alumno.apellidos,
          nombre: `${alumno.nombres} ${alumno.apellidos}`.trim(),
          rut: alumno.rut,
          carrera: alumno.carrera,
          institucion: alumno.institucion,
          asiento: alumno.asiento,
          grupo: alumno.grupo
        }, eventoSeleccionado) // Pasar el eventoId
      );

      await Promise.all(promises);
      setMensaje(`${alumnosSeleccionados.length} alumnos importados correctamente`);
      setAlumnosSeleccionados([]);
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setMensaje('Error al importar alumnos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-green-800 mb-4">Importar Alumnos desde Evento</h3>

      {/* Mensaje de estado */}
      {mensaje && (
        <motion.div
          className={`p-4 rounded-lg mb-4 ${
            mensaje.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {mensaje}
        </motion.div>
      )}

      {/* Selector de evento */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Evento
        </label>
        <select
          value={eventoSeleccionado}
          onChange={(e) => handleEventoChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Selecciona un evento</option>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de alumnos del evento */}
      {eventoSeleccionado && alumnosEvento.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Alumnos del Evento ({alumnosEvento.length})
            </h4>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {alumnosSeleccionados.length === alumnosEvento.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>

          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {alumnosEvento.map((alumno, index) => (
              <motion.div
                key={alumno.rut}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  alumnosSeleccionados.find(a => a.rut === alumno.rut)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => handleAlumnoToggle(alumno)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={alumnosSeleccionados.find(a => a.rut === alumno.rut) !== undefined}
                      onChange={() => handleAlumnoToggle(alumno)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {alumno.nombres} {alumno.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">
                        RUT: {alumno.rut} | {alumno.carrera} | Grupo: {alumno.grupo}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Asiento: {alumno.asiento}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Botón de importar */}
      {alumnosSeleccionados.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleImportar}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importando...' : `Importar ${alumnosSeleccionados.length} alumno(s)`}
          </button>
        </div>
      )}

      {/* Mensaje cuando no hay alumnos */}
      {eventoSeleccionado && alumnosEvento.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay alumnos registrados para este evento.</p>
        </div>
      )}
    </div>
  );
}

export default ImportarAlumnosEvento;
