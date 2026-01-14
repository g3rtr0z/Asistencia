import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

function EventoActivoInfo({ eventoActivo }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
      className='bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className='flex flex-col sm:flex-row items-stretch'>
        {/* Barra lateral de color establecido */}
        <div className='w-full sm:w-2 bg-st-verde'></div>

        <div className='flex-1'>
          {/* Header clickeable para colapsar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/50 transition-colors group'
          >
            <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
              <span className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-st-verde text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100'>
                <div className='w-1.5 h-1.5 bg-st-verde rounded-full animate-pulse'></div>
                Evento Activo
              </span>
              <h3 className='text-lg md:text-xl font-bold text-slate-800 leading-tight'>
                {eventoActivo.nombre}
              </h3>
            </div>

            <div className={`p-1 rounded-lg bg-slate-100 text-slate-400 group-hover:text-st-verde group-hover:bg-st-pastel transition-all transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Contenido desplegable */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className='px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-slate-50'>
                  <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4'>
                    <div>
                      <p className='text-slate-500 text-sm max-w-2xl'>
                        {eventoActivo.descripcion || 'Gestión de asistencia para este evento.'}
                      </p>
                      {eventoActivo.tipo === 'trabajadores' && (
                        <span className='inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100'>
                          Staff
                        </span>
                      )}
                    </div>

                    <div className='flex flex-wrap items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100'>
                      <div className='flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100'>
                        <div className='p-1.5 bg-white rounded-lg shadow-sm text-slate-400'>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-tight'>Inicio</p>
                          <p className='text-sm font-semibold text-slate-700'>{formatDate(eventoActivo.fechaInicio)}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100'>
                        <div className='p-1.5 bg-white rounded-lg shadow-sm text-slate-400'>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-tight'>Fin</p>
                          <p className='text-sm font-semibold text-slate-700'>{formatDate(eventoActivo.fechaFin)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default EventoActivoInfo;
