import React from 'react';

function EstadisticasPanel({ alumnos }) {
  const total = alumnos.length;
  const presentes = alumnos.filter(a => a.presente).length;
  const ausentes = alumnos.filter(a => !a.presente).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return (
    <div className="w-full flex flex-col md:flex-row flex-wrap gap-4 mb-6 justify-center items-center">
      <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 w-full md:w-auto text-center">
        <h3 className="text-blue-800 font-bold text-lg">Total</h3>
        <p className="text-blue-600 text-3xl font-bold">{total}</p>
      </div>
      <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200 w-full md:w-auto text-center">
        <h3 className="text-green-800 font-bold text-lg">Presentes</h3>
        <p className="text-green-600 text-3xl font-bold">{presentes}</p>
      </div>
      <div className="bg-red-50 p-3 md:p-4 rounded-lg border border-red-200 w-full md:w-auto text-center">
        <h3 className="text-red-800 font-bold text-lg">Ausentes</h3>
        <p className="text-red-600 text-3xl font-bold">{ausentes}</p>
      </div>
      <div className="bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200 w-full md:w-auto text-center">
        <h3 className="text-purple-800 font-bold text-lg">Porcentaje</h3>
        <p className="text-purple-600 text-3xl font-bold">{porcentaje}%</p>
      </div>
    </div>
  );
}

export default EstadisticasPanel; 