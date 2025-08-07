import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
const AlumnosLista = ({
  alumnos = [],
  soloPresentes,
  setSoloPresentes,
  filtroCarrera,
  setFiltroCarrera,
  filtroInstitucion,
  setFiltroInstitucion,
  filtroRUT,
  setFiltroRUT,
  setFiltroGrupo,
  filtroGrupo
}) => {
  // Si no vienen por props, usar estado local (para compatibilidad con admin)
  const [localCarrera, setLocalCarrera] = useState("");
  const [localRUT, setLocalRUT] = useState("");
  const [localInstitucion, setLocalInstitucion] = useState("");
  const [localGrupo, setLocalGrupo] = useState("");

  const carrera = filtroCarrera !== undefined ? filtroCarrera : localCarrera;
  const setCarrera = setFiltroCarrera || setLocalCarrera;
  const institucion = filtroInstitucion !== undefined ? filtroInstitucion : localInstitucion;
  const setInstitucion = setFiltroInstitucion || setLocalInstitucion;
  const rut = filtroRUT !== undefined ? filtroRUT : localRUT;
  const setRUT = setFiltroRUT || setLocalRUT;
  const grupo = filtroGrupo !== undefined ? filtroGrupo : localGrupo;
  const setGrupo = setFiltroGrupo || setLocalGrupo;

  const [ordenAlfabetico, setOrdenAlfabetico] = useState("asc");
  const [ordenCampo, setOrdenCampo] = useState("nombre");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Configuración de columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState({
    grupo: true,
    asiento: true,
    nombres: true,
    apellidos: true,
    carrera: true,
    rut: true,
    institucion: true,
    estado: true
  });

  function handleOrdenarPor(campo) {
    if (ordenCampo === campo) {
      setOrdenAlfabetico(ordenAlfabetico === "asc" ? "desc" : "asc");
    } else {
      setOrdenCampo(campo);
      setOrdenAlfabetico("asc");
    }
  }

  function toggleColumna(columna) {
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna]
    }));
  }

  function mostrarTodasLasColumnas() {
    setColumnasVisibles({
      grupo: true,
      asiento: true,
      nombres: true,
      apellidos: true,
      carrera: true,
      rut: true,
      institucion: true,
      estado: true
    });
  }

  // Generar opciones dinámicamente desde los datos
  const opcionesInstituciones = useMemo(() => {
    return [...new Set(alumnos.map(a => a.institucion))].sort();
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

  // Filtrado simplificado
  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter(alumno => {
      const cumplePresente = !soloPresentes ||
        (soloPresentes === "presentes" ? alumno.presente : !alumno.presente);
      const cumpleCarrera = !carrera || alumno.carrera === carrera;
      const cumpleRut = !rut || alumno.rut.startsWith(rut);
      const cumpleInstitucion = !institucion || alumno.institucion === institucion;
      const cumpleGrupo = !grupo || Number(alumno.grupo) === Number(grupo);

      return cumplePresente && cumpleCarrera && cumpleRut && cumpleInstitucion && cumpleGrupo;
    });
  }, [alumnos, soloPresentes, carrera, rut, institucion, grupo]);

  const alumnosOrdenados = useMemo(() => {
    return [...alumnosFiltrados].sort((a, b) => {
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
  }, [alumnosFiltrados, ordenCampo, ordenAlfabetico]);

  return (
    <div className="flex flex-col items-center w-full">

      {/* Filtros Desplegables */}
      <motion.div
        className="mb-6 w-full max-w-7xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header del filtro */}
          <motion.button
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            whileHover={{ backgroundColor: '#f8fafc' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-emerald-800 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Filtros de Búsqueda</h3>
              <span className="text-sm text-slate-500">
                ({alumnosFiltrados.length} de {alumnos.length} alumnos)
              </span>
            </div>
            <motion.div
              animate={{ rotate: filtrosAbiertos ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.button>

          {/* Contenido desplegable */}
          <AnimatePresence>
            {filtrosAbiertos && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">RUT</label>
                      <input
                        type="text"
                        placeholder="Buscar RUT..."
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={rut}
                        onChange={e => setRUT(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Carrera</label>
                      <select
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={carrera}
                        onChange={e => setCarrera(e.target.value)}
                      >
                        <option value="">Todas</option>
                        {Object.entries(carrerasPorInstitucion).map(([institucion, carreras]) => (
                          <optgroup key={institucion} label={getInstitucionLabel(institucion)}>
                            {carreras.map(carrera => (
                              <option key={carrera} value={carrera}>{carrera}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Institución</label>
                      <select
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={institucion}
                        onChange={e => setInstitucion(e.target.value)}
                      >
                        <option value="">Todas</option>
                        {opcionesInstituciones.map(inst => (
                          <option key={inst} value={inst}>{getInstitucionLabel(inst)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Grupo</label>
                      <select
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={grupo}
                        onChange={e => setGrupo(e.target.value)}
                      >
                        <option value="">Todos</option>
                        {gruposUnicos.map(gr => (
                          <option key={gr} value={gr}>{`G${gr}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Columnas</label>
                      <select
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value=""
                        onChange={(e) => {
                          if (e.target.value === "mostrar-todas") {
                            mostrarTodasLasColumnas();
                          } else if (e.target.value) {
                            toggleColumna(e.target.value);
                          }
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="">Configurar...</option>
                        {Object.entries({
                          grupo: "Grupo",
                          asiento: "Asiento",
                          nombres: "Nombres",
                          apellidos: "Apellidos",
                          carrera: "Carrera",
                          rut: "RUT",
                          institucion: "Institución",
                          estado: "Estado"
                        }).map(([key, label]) => (
                          <option key={key} value={key}>
                            {columnasVisibles[key] ? "❌" : "✅"} {label}
                          </option>
                        ))}
                        <option value="mostrar-todas">🔄 Todas</option>
                      </select>
                      <div className="text-xs text-slate-500">
                        {Object.values(columnasVisibles).filter(Boolean).length}/{Object.keys(columnasVisibles).length}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <motion.button
                      onClick={() => {
                        setCarrera("");
                        setInstitucion("");
                        setRUT("");
                        setGrupo("")
                        if (setSoloPresentes) setSoloPresentes("");
                        mostrarTodasLasColumnas(); // Resetear columnas también
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 text-sm hover:bg-slate-200 transition-all duration-200 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar Filtros
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>



      {/* Tabla Simplificada */}
      <div className="w-full flex justify-center">
        <motion.div
          className="w-full overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-green-800 to-emerald-600 text-white sticky top-0 z-10">
                <tr>
                  {columnasVisibles.grupo && (
                    <th className="py-4 px-4 text-left font-semibold">Grupo</th>
                  )}
                  {columnasVisibles.asiento && (
                    <th className="py-4 px-4 text-left font-semibold">Asiento</th>
                  )}
                  {columnasVisibles.nombres && (
                    <th
                      className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                      onClick={() => handleOrdenarPor("nombre")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Nombres</span>
                        {ordenCampo === "nombre" && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d={ordenAlfabetico === "asc" ? "M7 14l5-5 5 5z" : "M7 10l5 5 5-5z"} />
                          </svg>
                        )}
                      </div>
                    </th>
                  )}
                  {columnasVisibles.apellidos && (
                    <th
                      className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                      onClick={() => handleOrdenarPor("apellidos")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Apellidos</span>
                        {ordenCampo === "apellidos" && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d={ordenAlfabetico === "asc" ? "M7 14l5-5 5 5z" : "M7 10l5 5 5-5z"} />
                          </svg>
                        )}
                      </div>
                    </th>
                  )}
                  {columnasVisibles.carrera && (
                    <th className="py-4 px-4 text-left font-semibold">Carrera</th>
                  )}
                  {columnasVisibles.rut && (
                    <th className="py-4 px-4 text-left font-semibold">RUT</th>
                  )}
                  {columnasVisibles.institucion && (
                    <th className="py-4 px-4 text-left font-semibold">Institución</th>
                  )}
                  {columnasVisibles.estado && (
                    <th className="py-4 px-4 text-center font-semibold">Estado</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {alumnosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(columnasVisibles).filter(Boolean).length} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="text-slate-500 font-medium">No hay alumnos para mostrar</div>
                        <div className="text-slate-400 text-sm">Intenta ajustar los filtros de búsqueda</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alumnosOrdenados.map((alumno, idx) => (
                    <tr
                      key={alumno.rut}
                      className={`${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-green-50 transition-all duration-200 border-b border-slate-100`}
                    >
                      {columnasVisibles.grupo && (
                        <td className="py-4 px-4 font-semibold text-slate-700 text-center">
                          <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">
                            {alumno.grupo ?? '-'}
                          </span>
                        </td>
                      )}
                      {columnasVisibles.asiento && (
                        <td className="py-4 px-4 font-semibold text-slate-700 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                            {alumno.asiento ?? '-'}
                          </span>
                        </td>
                      )}
                      {columnasVisibles.nombres && (
                        <td className="py-4 px-4 text-slate-800 font-medium">{alumno.nombres ?? alumno.nombre ?? '-'}</td>
                      )}
                      {columnasVisibles.apellidos && (
                        <td className="py-4 px-4 text-slate-800 font-medium">{alumno.apellidos ?? (alumno.nombre ? alumno.nombre.split(' ').slice(1).join(' ') : '-')}</td>
                      )}
                      {columnasVisibles.carrera && (
                        <td className="py-4 px-4 text-slate-700">{alumno.carrera}</td>
                      )}
                      {columnasVisibles.rut && (
                        <td className="py-4 px-4 font-mono text-slate-700">{alumno.rut}</td>
                      )}
                      {columnasVisibles.institucion && (
                        <td className="py-4 px-4 text-slate-700">{getInstitucionLabel(alumno.institucion)}</td>
                      )}
                      {columnasVisibles.estado && (
                        <td className="py-4 px-4 text-center">
                          {alumno.presente ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                              <div className="w-2 h-2 bg-green-800 rounded-full"></div>
                              Presente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Ausente
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AlumnosLista;
