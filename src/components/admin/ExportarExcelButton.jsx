import React from 'react';
import { exportarAExcel } from './exportarExcel';

const ExportarExcelButton = ({ alumnos }) => (
  <button
    onClick={() => exportarAExcel(alumnos)}
    className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-green-700 text-base"
  >
    Exportar a Excel
  </button>
);

export default ExportarExcelButton; 