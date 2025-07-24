import React from 'react';

function EstadisticasPanel({ alumnos, soloPresentes, setSoloPresentes }) {
  const total = alumnos.length;
  const presentes = alumnos.filter(a => a.presente).length;
  const ausentes = alumnos.filter(a => !a.presente).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return (
    <div className="w-full flex flex-col md:flex-row flex-wrap gap-4 mb-6 justify-center items-center">
      {/*Estudiantes Totales*/}
      <button
        onClick={() => setSoloPresentes("")}
        className={`bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 w-full md:w-auto text-center transition hover:bg-blue-100 ${soloPresentes === "" ? "ring-2 ring-blue-400" : ""
          }`}
      >
        <h3 className="text-blue-800 font-bold text-lg">Total</h3>
        <p className="text-blue-600 text-3xl font-bold">{total}</p>
      </button>
      {/*Estadisticas Presentes*/}
      <button
        onClick={() => setSoloPresentes("presentes")}
        className={`bg-green-50 p-3 md:p-4 rounded-lg border border-green-200 w-full md:w-auto text-center transition hover:bg-green-100 ${soloPresentes === "presentes" ? "ring-2 ring-green-400" : ""
          }`}
      >
        <h3 className="text-green-800 font-bold text-lg">Presentes</h3>
        <p className="text-green-600 text-3xl font-bold">{presentes}</p>
      </button>
      {/*Estadisticas Ausentes*/}
      <button
        onClick={() => setSoloPresentes("ausentes")}
        className={`bg-red-50 p-3 md:p-4 rounded-lg border border-red-200 w-full md:w-auto text-center transition hover:bg-red-100 ${soloPresentes === "ausentes" ? "ring-2 ring-red-400" : ""
          }`}
      >
        <h3 className="text-red-800 font-bold text-lg">Ausentes</h3>
        <p className="text-red-600 text-3xl font-bold">{ausentes}</p>
      </button>
      {/*Porcentaje*/}
      <div className="bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200 w-full md:w-auto text-center">
        <h3 className="text-purple-800 font-bold text-lg">Porcentaje</h3>
        <p className="text-purple-600 text-3xl font-bold">{porcentaje}%</p>
      </div>
    </div >

  );
}

export default EstadisticasPanel; 