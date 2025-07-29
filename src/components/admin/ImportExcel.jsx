import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { importarAlumnosDesdeExcel } from '../../services/alumnosService';

function ImportExcel({ onImportComplete, eventoId = null, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo Excel');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await importarAlumnosDesdeExcel(file, eventoId);
      setSuccess('Alumnos importados correctamente');
      setFile(null);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setError('Error al importar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header del Modal */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Importar Datos Excel</h3>
                <p className="text-blue-100 text-sm">Sube tu archivo Excel con los datos de alumnos</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Área de subida de archivo */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <div className="space-y-4">
                <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra tu archivo aquí
                  </p>
                  <p className="text-xs text-slate-500">Solo archivos Excel (.xlsx, .xls)</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  Seleccionar Archivo
                </label>
              </div>
            </div>

            {/* Archivo seleccionado */}
            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">{file.name}</p>
                    <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="bg-green-50 border border-green-200 rounded-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              </motion.div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Volver
              </motion.button>
              <motion.button
                type="submit"
                disabled={!file || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Importando...' : 'Importar'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ImportExcel;
