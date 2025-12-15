import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { exportarAExcel } from '../admin/exportarAExcel';

function EstadisticasPanel({
  alumnos,
  soloPresentes,
  setSoloPresentes,
  alumnosCompletos,
  eventoActivo,
}) {
  // Las estadísticas siempre se calculan con TODOS los alumnos (alumnosCompletos)
  // para que los números no cambien al filtrar por estado
  // El prop 'alumnos' se usa solo para determinar el estado activo de los botones
  const datosParaEstadisticas = alumnosCompletos || alumnos;

  const total = datosParaEstadisticas.length;
  const presentes = datosParaEstadisticas.filter(a => a.presente).length;
  const ausentes = datosParaEstadisticas.filter(a => !a.presente).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  const handleExportarFiltrado = filtro => {
    if (eventoActivo && alumnosCompletos) {
      exportarAExcel(
        alumnosCompletos,
        eventoActivo.nombre,
        eventoActivo.tipo,
        filtro
      );
    }
  };

  return (
    <motion.div
      className='bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm mx-auto w-full max-w-full sm:max-w-4xl md:max-w-5xl'
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center gap-2 mb-4'>
        <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
        <h3 className='text-lg font-semibold text-slate-800'>
          Estadísticas de Asistencia
        </h3>
      </div>

      <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4'>
        <div className='relative'>
          <motion.button
            onClick={() => setSoloPresentes && setSoloPresentes('')}
            className={`p-3 rounded-lg border transition-all duration-200 w-full ${
              soloPresentes === ''
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className='text-center'>
              <div className='text-sm text-slate-600 mb-1'>Total</div>
              <div className='text-2xl font-bold text-slate-800'>{total}</div>
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
            onClick={() => setSoloPresentes && setSoloPresentes('presentes')}
            className={`p-3 rounded-lg border transition-all duration-200 w-full ${
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
            onClick={() => setSoloPresentes && setSoloPresentes('ausentes')}
            className={`p-3 rounded-lg border transition-all duration-200 w-full ${
              soloPresentes === 'ausentes'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className='text-center'>
              <div className='text-sm text-slate-600 mb-1'>Ausentes</div>
              <div className='text-2xl font-bold text-red-600'>{ausentes}</div>
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

        <div className='p-3 rounded-lg border bg-slate-50 border-slate-200'>
          <div className='text-center'>
            <div className='text-sm text-slate-600 mb-1'>Porcentaje</div>
            <div className='text-2xl font-bold text-slate-800'>
              {porcentaje}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EstadisticasPanel;
