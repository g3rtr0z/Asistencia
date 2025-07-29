import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportarAExcel } from '../admin/exportarAExcel';

function EventoInfo({ eventoActivo, totalAlumnos, alumnos }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!eventoActivo) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    const now = new Date();
    const start = new Date(eventoActivo.fechaInicio);
    const end = new Date(eventoActivo.fechaFin);

    if (!eventoActivo.activo) return 'bg-gray-500';
    if (now < start) return 'bg-yellow-500';
    if (now >= start && now <= end) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    const now = new Date();
    const start = new Date(eventoActivo.fechaInicio);
    const end = new Date(eventoActivo.fechaFin);

    if (!eventoActivo.activo) return 'Inactivo';
    if (now < start) return 'Próximamente';
    if (now >= start && now <= end) return 'En Curso';
    return 'Finalizado';
  };

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-slate-800">
            {eventoActivo.nombre}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
            {getStatusText()}
          </span>

          {alumnos && alumnos.length > 0 && (
            <motion.button
              onClick={() => exportarAExcel(alumnos)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </motion.button>
          )}
        </div>
      </div>

      {/* Información básica siempre visible */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Inicio:</span>
          <span className="font-medium text-slate-700">{formatDate(eventoActivo.fechaInicio)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Alumnos:</span>
          <span className="font-medium text-slate-700">{totalAlumnos}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Estado:</span>
          <span className="font-medium text-slate-700">{getStatusText()}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default EventoInfo;
