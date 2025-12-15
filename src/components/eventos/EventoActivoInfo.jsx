import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

function EventoActivoInfo({ eventoActivo }) {
  if (!eventoActivo) {
    return null;
  }

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center gap-3 mb-3'>
        <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
        <h3 className='text-lg font-semibold text-green-800'>Evento Activo</h3>
      </div>
      <div className='ml-6'>
        <h4 className='text-xl font-bold text-gray-800 mb-3 leading-tight'>
          {eventoActivo.nombre}
        </h4>
        <p className='text-gray-600 mb-4 leading-relaxed'>
          {eventoActivo.descripcion}
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-green-700'>Inicio:</span>
            <span className='text-gray-600'>
              {formatDate(eventoActivo.fechaInicio)}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-green-700'>Fin:</span>
            <span className='text-gray-600'>
              {formatDate(eventoActivo.fechaFin)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EventoActivoInfo;
