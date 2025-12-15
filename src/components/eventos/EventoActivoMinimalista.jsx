import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

function EventoActivoMinimalista({ eventoActivo }) {
  if (!eventoActivo) {
    return null;
  }

  const getStatusColor = () => {
    const now = new Date();
    const start = new Date(eventoActivo.fechaInicio);
    const end = new Date(eventoActivo.fechaFin);

    // Si el evento no está activo, mostrar gris
    if (!eventoActivo.activo) return 'bg-gray-500';

    // Si está activo, usar la lógica de fechas
    if (now < start) return 'bg-yellow-500';
    if (now >= start && now <= end) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    const now = new Date();
    const start = new Date(eventoActivo.fechaInicio);
    const end = new Date(eventoActivo.fechaFin);

    // Si el evento no está activo, mostrar inactivo
    if (!eventoActivo.activo) return 'Inactivo';

    // Si está activo, usar la lógica de fechas
    if (now < start) return 'Próximo';
    if (now >= start && now <= end) return 'Activo';
    return 'Finalizado';
  };

  return (
    <motion.div
      className='fixed bottom-4 right-4 z-40'
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className='bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs'>
        <div className='flex items-center gap-2 mb-3'>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className='text-xs font-medium text-gray-600'>
            {getStatusText()}
          </span>
        </div>
        <h4 className='text-sm font-semibold text-gray-800 mb-2 leading-tight'>
          {eventoActivo.nombre}
        </h4>
        <p className='text-xs text-gray-500 line-clamp-2 leading-relaxed'>
          {eventoActivo.descripcion}
        </p>
      </div>
    </motion.div>
  );
}

export default EventoActivoMinimalista;
