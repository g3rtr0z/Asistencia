import React from 'react';
import { motion } from 'framer-motion';

function EstadisticasPanel({ alumnos, soloPresentes, setSoloPresentes, alumnosCompletos }) {
  // Usar alumnosCompletos para las estadísticas fijas (no cambian con filtros)
  const datosParaEstadisticas = alumnosCompletos || alumnos;

  const total = datosParaEstadisticas.length;
  const presentes = datosParaEstadisticas.filter(a => a.presente).length;
  const ausentes = datosParaEstadisticas.filter(a => !a.presente).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <h3 className="text-lg font-semibold text-slate-800">Estadísticas de Asistencia</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.button
          onClick={() => setSoloPresentes && setSoloPresentes("")}
          className={`p-3 rounded-lg border transition-all duration-200 ${soloPresentes === ""
            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-800">{total}</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setSoloPresentes && setSoloPresentes("presentes")}
          className={`p-3 rounded-lg border transition-all duration-200 ${soloPresentes === "presentes"
            ? "bg-green-50 border-green-300 ring-2 ring-green-200"
            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-1">Presentes</div>
            <div className="text-2xl font-bold text-green-600">{presentes}</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setSoloPresentes && setSoloPresentes("ausentes")}
          className={`p-3 rounded-lg border transition-all duration-200 ${soloPresentes === "ausentes"
            ? "bg-red-50 border-red-300 ring-2 ring-red-200"
            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-1">Ausentes</div>
            <div className="text-2xl font-bold text-red-600">{ausentes}</div>
          </div>
        </motion.button>

        <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-1">Porcentaje</div>
            <div className="text-2xl font-bold text-slate-800">{porcentaje}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EstadisticasPanel;
