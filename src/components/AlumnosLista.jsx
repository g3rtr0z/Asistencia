import React, { useState, useMemo } from "react";
import { FaFilter } from "react-icons/fa";

const INSTITUCIONES = [
  { value: "CFT", label: "Centro de Formación Técnica" },
  { value: "IP", label: "Instituto Profesional" },
  { value: "Universidad", label: "Universidad" },
];

function getInstitucionLabel(value) {
  const found = INSTITUCIONES.find(i => i.value === value);
  return found ? found.label : value;
}

// Recibe los filtros y setters como props (opcional)
const AlumnosLista = ({ alumnos = [], soloPresentes, setSoloPresentes, filtroCarrera, setFiltroCarrera, filtroInstitucion, setFiltroInstitucion, filtroRUT, setFiltroRUT, setFiltroGrupo, filtroGrupo }) => {
  // Si no vienen por props, usar estado local (para compatibilidad con admin)
  const [localCarrera, setLocalCarrera] = useState("");
  const [localRUT, setLocalRUT] = useState("");
  const [localInstitucion, setLocalInstitucion] = useState("");
  const carrera = filtroCarrera !== undefined ? filtroCarrera : localCarrera;
  const setCarrera = setFiltroCarrera || setLocalCarrera;
  const institucion = filtroInstitucion !== undefined ? filtroInstitucion : localInstitucion;
  const setInstitucion = setFiltroInstitucion || setLocalInstitucion;
  const rut = filtroRUT !== undefined ? filtroRUT : localRUT;
  const setRUT = setFiltroRUT || setLocalRUT;
  const [ordenAlfabetico, setOrdenAlfabetico] = useState("asc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const grupo = filtroGrupo !== undefined ? filtroGrupo : "";
  const setGrupo = setFiltroGrupo || (() => { });

  const opcionesGrupos = useMemo(() => {
    const grupos = [...new Set(alumnos.map(a => a.grupo).filter(Boolean))].sort();
    return grupos;
  }, [alumnos]);


  // Generar opciones dinámicamente desde los datos

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
    (
      soloPresentes === "presentes" ? alumno.presente :
        soloPresentes === "ausentes" ? !alumno.presente :
          true
    ) &&
    (carrera === "" || alumno.carrera === carrera) &&
    (rut === "" || alumno.rut.startsWith(rut)) &&
    (institucion === "" || alumno.institucion === institucion) &&
    (grupo === "" || alumno.grupo === grupo)
  );

  const alumnosOrdenados = [...alumnosFiltrados].sort((a, b) => {
    if (ordenAlfabetico === "asc") {
      return a.nombre.localeCompare(b.nombre);
    } else {
      return b.nombre.localeCompare(a.nombre);
    }
  });

  return (
    <div className="flex flex-col items-center w-full">

      <div className="relative mb-4 w-full max-w-4xl flex justify-end gap-2">
        <input
          type="text"
          placeholder="Buscar por RUT"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
          value={rut}
          onChange={e => setRUT(e.target.value)}
        />
        {/*Mostrar Filtros*/}
        <button
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <FaFilter />
          Filtros
        </button>

        {mostrarFiltros && (
          <div className="absolute top-full right-0 mt-2 w-full sm:w-[600px] bg-white shadow-lg rounded border border-gray-200 z-50 p-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 h-10"
                value={grupo}
                onChange={e => setGrupo(e.target.value)}
              >
                <option value="">Todos los grupos</option>
                {opcionesGrupos.map(grupo => (
                  <option key={grupo} value={grupo}>{grupo}</option>
                ))}
              </select>
              {/*Filtrar por Carrera*/}
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                value={carrera}
                onChange={e => setCarrera(e.target.value)}
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
              {/*Filtrar por Institución*/}
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                value={institucion}
                onChange={e => setInstitucion(e.target.value)}
              >
                <option value="">Todas las instituciones</option>
                {opcionesInstituciones.map(inst => (
                  <option key={inst} value={inst}>{getInstitucionLabel(inst)}</option>
                ))}
              </select>
              {/* Orden Alfabetico */}
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                value={ordenAlfabetico}
                onChange={e => setOrdenAlfabetico(e.target.value)}
              >
                <option value="asc">Nombre A - Z</option>
                <option value="desc">Nombre Z - A</option>
              </select>
              {/* Limpiar Filtros*/}
              <button
                onClick={() => {
                  setCarrera("");
                  setInstitucion("");
                  setRUT("");
                  setGrupo("")
                  if (setSoloPresentes) setSoloPresentes("");
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 text-sm hover:bg-gray-200 transition w-full sm:w-auto"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
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
              {alumnosOrdenados.map((alumno, idx) => (
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
