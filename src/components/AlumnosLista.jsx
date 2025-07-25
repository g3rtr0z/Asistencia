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
  const [ordenCampo, setOrdenCampo] = useState("nombre"); // 'nombre' o 'apellidos'
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [localGrupo, setLocalGrupo] = useState("");
  const grupo = filtroGrupo !== undefined ? filtroGrupo : localGrupo;
  const setGrupo = setFiltroGrupo || setLocalGrupo;

  function handleOrdenarPor(campo) {
    if (ordenCampo === campo) {
      setOrdenAlfabetico(ordenAlfabetico === "asc" ? "desc" : "asc");
    } else {
      setOrdenCampo(campo);
      setOrdenAlfabetico("asc");
    }
  }

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

  // Obtener los grupos únicos presentes en los alumnos
  const gruposUnicos = useMemo(() => {
    const set = new Set();
    alumnos.forEach(a => {
      if (a.grupo) set.add(a.grupo);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [alumnos]);

  // Método para filtrar por grupo
  function filtrarPorGrupo(alumnos, grupo) {
    if (!grupo) return alumnos;
    const grupoNum = Number(grupo);
    return alumnos.filter(alumno => Number(alumno.grupo) === grupoNum);
  }

  let alumnosFiltrados = alumnos.filter(alumno =>
    (
      soloPresentes === "presentes" ? alumno.presente :
        soloPresentes === "ausentes" ? !alumno.presente :
          true
    ) &&
    (carrera === "" || alumno.carrera === carrera) &&
    (rut === "" || alumno.rut.startsWith(rut)) &&
    (institucion === "" || alumno.institucion === institucion)
  );
  alumnosFiltrados = filtrarPorGrupo(alumnosFiltrados, grupo);

  const alumnosOrdenados = [...alumnosFiltrados].sort((a, b) => {
    let campoA, campoB;
    if (ordenCampo === "apellidos") {
      campoA = (a.apellidos ?? (a.nombre ? a.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
      campoB = (b.apellidos ?? (b.nombre ? b.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
    } else {
      campoA = (a.nombres ?? a.nombre ?? '').toLowerCase();
      campoB = (b.nombres ?? b.nombre ?? '').toLowerCase();
    }
    if (ordenAlfabetico === "asc") {
      return campoA.localeCompare(campoB);
    } else {
      return campoB.localeCompare(campoA);
    }
  });

  return (
    <div className="flex flex-col items-center w-full">

      <div className="mb-4 w-full max-w-7xl flex flex-wrap gap-2 items-center justify-center">
        <input
          type="text"
          placeholder="Buscar por RUT"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
          value={rut}
          onChange={e => setRUT(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
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
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
          value={grupo}
          onChange={e => setGrupo(e.target.value)}
        >
          <option value="">Todos los grupos</option>
          {gruposUnicos.map(gr => (
            <option key={gr} value={gr}>{`Grupo ${gr}`}</option>
          ))}
        </select>
        {/* El orden ahora se maneja haciendo click en los encabezados de Nombres y Apellidos */}
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
      {/* Tabla */}
      <div className="w-full flex justify-center">
        <div className="w-full overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-green-100 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-left font-bold text-green-900">Grupo</th>
                <th className="py-3 px-4 text-left font-bold text-green-900">Asiento</th>
                <th
                  className="py-3 px-4 text-left font-bold text-green-900 cursor-pointer select-none hover:bg-st-pastel"
                  onClick={() => handleOrdenarPor('nombre')}
                >
                  Nombres
                  {ordenCampo === 'nombre' && (
                    <span className="ml-1">{ordenAlfabetico === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th
                  className="py-3 px-4 text-left font-bold text-green-900 cursor-pointer select-none hover:bg-st-pastel"
                  onClick={() => handleOrdenarPor('apellidos')}
                >
                  Apellidos
                  {ordenCampo === 'apellidos' && (
                    <span className="ml-1">{ordenAlfabetico === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
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
                  <td className="py-3 px-4 font-bold text-green-800 text-center">{alumno.grupo ?? '-'}</td>
                  <td className="py-3 px-4 font-bold text-green-800 text-center">{alumno.asiento ?? '-'}</td>
                  <td className="py-3 px-4 text-green-900 font-medium">{alumno.nombres ?? alumno.nombre ?? '-'}</td>
                  <td className="py-3 px-4 text-green-900 font-medium">{alumno.apellidos ?? (alumno.nombre ? alumno.nombre.split(' ').slice(1).join(' ') : '-')}</td>
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
