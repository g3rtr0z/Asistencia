import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { exportarAExcel } from '../admin/exportarAExcel';

function TrabajadoresResumen({
  trabajadores,
  soloPresentes,
  setSoloPresentes,
  trabajadoresCompletos,
  eventoActivo,
}) {
  const datosParaEstadisticas = trabajadoresCompletos || trabajadores;

  const total = datosParaEstadisticas.length;
  const presentes = datosParaEstadisticas.filter(t => t.presente).length;
  const ausentes = datosParaEstadisticas.filter(t => !t.presente).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  const confirmados = datosParaEstadisticas.filter(t => t.asiste).length;
  const pendientesConfirmacion = datosParaEstadisticas.filter(
    t => !t.asiste
  ).length;
  // const porcentajeConfirmacion =
  //   total > 0 ? Math.round((confirmados / total) * 100) : 0;

  const handleExportarFiltrado = filtro => {
    if (eventoActivo && trabajadoresCompletos) {
      exportarAExcel(
        trabajadoresCompletos,
        eventoActivo.nombre,
        eventoActivo.tipo,
        filtro
      );
    }
  };

  const [statsOpen, setStatsOpen] = useState(true);

  return (
    <motion.div
      className='bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm max-w-full sm:max-w-4xl md:max-w-5xl mx-auto'
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className='flex items-center justify-between gap-2 mb-4 cursor-pointer'
        onClick={() => setStatsOpen(prev => !prev)}
      >
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <div className='w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full'></div>
          <h3 className='text-lg font-semibold text-slate-800'>
            Estadísticas de Asistencia y Confirmación
          </h3>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            setStatsOpen(prev => !prev);
          }}
          className='text-green-600 hover:text-green-700 transition-colors p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 flex-shrink-0 flex items-center justify-center h-8'
          aria-label={
            statsOpen ? 'Ocultar estadísticas' : 'Mostrar estadísticas'
          }
        >
          <span className='sr-only'>
            {statsOpen ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
          </span>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d={statsOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {statsOpen && (
          <motion.div
            key='stats-grid'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='mt-4'
          >
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 items-stretch'>
              <div className='relative'>
                <motion.button
                  onClick={() => setSoloPresentes && setSoloPresentes('')}
                  className={`p-3 rounded-lg border transition-all duration-200 w-full min-h-20 flex flex-col justify-center ${
                    soloPresentes === ''
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='text-center'>
                    <div className='text-sm text-slate-600 mb-1'>Total</div>
                    <div className='text-2xl font-bold text-slate-800'>
                      {total}
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => handleExportarFiltrado('')}
                  className='absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700 transition-colors shadow-md'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title='Exportar todos a Excel'
                >
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </motion.button>
              </div>

              <div className='relative'>
                <motion.button
                  onClick={() =>
                    setSoloPresentes && setSoloPresentes('presentes')
                  }
                  className={`p-3 rounded-lg border transition-all duration-200 w-full min-h-20 flex flex-col justify-center ${
                    soloPresentes === 'presentes'
                      ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='text-center'>
                    <div className='text-sm text-slate-600 mb-1'>Presentes</div>
                    <div className='text-2xl font-bold text-green-600'>
                      {presentes}
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => handleExportarFiltrado('presentes')}
                  className='absolute -top-1 -right-1 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-700 transition-colors shadow-md'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title='Exportar presentes a Excel'
                >
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </motion.button>
              </div>

              <div className='relative'>
                <motion.button
                  onClick={() =>
                    setSoloPresentes && setSoloPresentes('ausentes')
                  }
                  className={`p-3 rounded-lg border transition-all duration-200 w-full min-h-20 flex flex-col justify-center ${
                    soloPresentes === 'ausentes'
                      ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='text-center'>
                    <div className='text-sm text-slate-600 mb-1'>Ausentes</div>
                    <div className='text-2xl font-bold text-red-600'>
                      {ausentes}
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => handleExportarFiltrado('ausentes')}
                  className='absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors shadow-md'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title='Exportar ausentes a Excel'
                >
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </motion.button>
              </div>

              <div className='relative'>
                <motion.button
                  onClick={() =>
                    setSoloPresentes && setSoloPresentes('confirmados')
                  }
                  className={`p-3 rounded-lg border transition-all duration-200 w-full min-h-20 flex flex-col justify-center ${
                    soloPresentes === 'confirmados'
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='text-center'>
                    <div className='text-sm text-slate-600 mb-1'>
                      Confirmados
                    </div>
                    <div className='text-2xl font-bold text-indigo-600'>
                      {confirmados}
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => handleExportarFiltrado('confirmados')}
                  className='absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-indigo-700 transition-colors shadow-md'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title='Exportar confirmados a Excel'
                >
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </motion.button>
              </div>

              <div className='relative'>
                <motion.button
                  onClick={() =>
                    setSoloPresentes && setSoloPresentes('pendientes')
                  }
                  className={`p-3 rounded-lg border transition-all duration-200 w-full min-h-20 flex flex-col justify-center ${
                    soloPresentes === 'pendientes'
                      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='text-center'>
                    <div className='text-sm text-slate-600 mb-1'>
                      Pendientes
                    </div>
                    <div className='text-2xl font-bold text-orange-600'>
                      {pendientesConfirmacion}
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => handleExportarFiltrado('pendientes')}
                  className='absolute -top-1 -right-1 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-orange-700 transition-colors shadow-md'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title='Exportar pendientes a Excel'
                >
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </motion.button>
              </div>

              <div className='p-3 rounded-lg border bg-slate-50 border-slate-200 min-h-20 flex flex-col justify-center'>
                <div className='text-center'>
                  <div className='text-sm text-slate-600 mb-1'>Porcentaje</div>
                  <div className='text-2xl font-bold text-slate-800'>
                    {porcentaje}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TrabajadoresResumen;
