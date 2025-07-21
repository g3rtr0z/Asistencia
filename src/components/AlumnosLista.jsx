import React, { useState, useMemo } from "react";

const INSTITUCIONES = [
  { value: "CFT", label: "Centro de Formación Técnica" },
  { value: "IP", label: "Instituto Profesional" },
  { value: "Universidad", label: "Universidad" },
];

function getInstitucionLabel(value) {
  const found = INSTITUCIONES.find(i => i.value === value);
  return found ? found.label : value;
}

const AlumnosLista = ({ alumnos = [], soloPresentes = false }) => {
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroRUT, setFiltroRUT] = useState("");
  const [filtroInstitucion, setFiltroInstitucion] = useState("");

  // Generar opciones dinámicamente desde los datos
<<<<<<< HEAD
=======
  const opcionesCarreras = useMemo(() => {
    const carreras = [...new Set(alumnos.map(a => a.carrera))].sort();
    return carreras;
  }, [alumnos]);
>>>>>>> 701dd767d30aedfb87c8cdefde72c02e201a3120

  const opcionesInstituciones = useMemo(() => {
    const instituciones = [...new Set(alumnos.map(a => a.institucion))].sort();
    return instituciones;
  }, [alumnos]);

  // Agrupar carreras por institución
  const carrerasPorInstitucion = useMemo(() => {
    const grupos = {};
    alumnos.forEach(alumno => {
      if (!grupos[alumno.institucion]) {
        grupos[alumno.institucion] = new Set();
      }
      grupos[alumno.institucion].add(alumno.carrera);
    });
    // Convertir Sets a Arrays y ordenar
    Object.keys(grupos).forEach(inst => {
      grupos[inst] = [...grupos[inst]].sort();
    });
    return grupos;
  }, [alumnos]);

  const alumnosFiltrados = alumnos.filter(alumno =>
    (!soloPresentes || alumno.presente) &&
    (filtroCarrera === "" || alumno.carrera === filtroCarrera) &&
    (filtroRUT === "" || alumno.rut.includes(filtroRUT)) &&
    (filtroInstitucion === "" || alumno.institucion === filtroInstitucion)
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full max-w-4xl items-center justify-center">
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
          value={filtroCarrera}
          onChange={e => setFiltroCarrera(e.target.value)}
        >
          <option value="">Todas las carreras</option>
          {Object.entries(carrerasPorInstitucion).map(([institucion, carreras]) => (
            <optgroup key={institucion} label={getInstitucionLabel(institucion)}>
              {carreras.map(carrera => (
                <option key={carrera} value={carrera}>{carrera}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
          value={filtroInstitucion}
          onChange={e => setFiltroInstitucion(e.target.value)}
        >
          <option value="">Todas las instituciones</option>
          {opcionesInstituciones.map(inst => (
            <option key={inst} value={inst}>{getInstitucionLabel(inst)}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por RUT"
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
          value={filtroRUT}
          onChange={e => setFiltroRUT(e.target.value)}
        />
        <button
          onClick={() => {
            setFiltroCarrera("");
            setFiltroInstitucion("");
            setFiltroRUT("");
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 text-sm font-medium hover:bg-gray-200 transition"
        >
          Limpiar Filtros
        </button>
      </div>
      {/* Tabla */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-5xl overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-green-100 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-left font-bold text-green-900">Nombre</th>
                <th className="py-3 px-4 text-left font-bold text-green-900">Carrera</th>
                <th className="py-3 px-4 text-left font-bold text-green-900">RUT</th>
                <th className="py-3 px-4 text-left font-bold text-green-900">Institución</th>
                <th className="py-3 px-4 text-center font-bold text-green-900">Estado</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No hay alumnos para mostrar</td>
                </tr>
              )}
              {alumnosFiltrados.map((alumno, idx) => (
                <tr
                  key={alumno.rut}
                  className={
                    `${idx % 2 === 0 ? 'bg-green-50' : 'bg-white'} hover:bg-green-100 transition`}
                >
                  <td className="py-3 px-4 text-green-900 font-medium">{alumno.nombre}</td>
                  <td className="py-3 px-4">{alumno.carrera}</td>
                  <td className="py-3 px-4">{alumno.rut}</td>
                  <td className="py-3 px-4">{getInstitucionLabel(alumno.institucion)}</td>
                  <td className="py-3 px-4 text-center">
                    {alumno.presente ? (
                      <span className="inline-block px-4 py-1 text-xs font-bold rounded-full bg-green-200 text-green-900 border border-green-700">Presente</span>
                    ) : (
                      <span className="inline-block px-4 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-green-300">Ausente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlumnosLista;
