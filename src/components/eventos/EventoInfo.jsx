import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
    if (now >= start && now <= end) return 'bg-green-800';
    return 'bg-red-800';
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
      {/* Header con título y estado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-3 h-3 bg-green-800 rounded-full flex-shrink-0"></div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
            {eventoActivo.nombre}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap ${getStatusColor()}`}>
            {getStatusText()}
          </span>

        </div>
      </div>

      {/* Información organizada en secciones */}
      <div className="space-y-3">
        {/* Fecha de inicio */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Fecha de Inicio</span>
          </div>
          <span className="text-sm text-slate-600 font-medium">{formatDate(eventoActivo.fechaInicio)}</span>
        </div>

        {/* Total de alumnos */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Total de Alumnos</span>
          </div>
          <span className="text-sm text-slate-600 font-medium">{totalAlumnos}</span>
        </div>

        {/* Estado del evento */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Estado del Evento</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default EventoInfo;
