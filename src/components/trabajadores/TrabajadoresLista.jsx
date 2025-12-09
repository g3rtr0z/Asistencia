import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TrabajadoresLista = ({
  trabajadores = [],
  soloPresentes,
  setSoloPresentes,
  filtroRUT,
  setFiltroRUT
}) => {
  // Si no vienen por props, usar estado local
  const [localRUT, setLocalRUT] = useState("");
  const [localNombres, setLocalNombres] = useState("");
  const [localApellidos, setLocalApellidos] = useState("");
  const [localObservacion, setLocalObservacion] = useState("");
  const [pagina, setPagina] = useState(1);
  const pageSize = 100;

  const rut = filtroRUT !== undefined ? filtroRUT : localRUT;
  const setRUT = setFiltroRUT || setLocalRUT;

  const [ordenAlfabetico, setOrdenAlfabetico] = useState("asc");
  const [ordenCampo, setOrdenCampo] = useState("nombre");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Configuración de columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    rut: true,
    nombres: true,
    apellidos: true,
    observacion: true,
    asiste: true
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
      estado: true,
      rut: true,
      nombres: true,
      apellidos: true,
      observacion: true,
      asiste: true
    });
  }

  // Filtrado
  const trabajadoresFiltrados = useMemo(() => {
    return trabajadores.filter(trabajador => {
      let cumpleFiltro = true;

      // Filtro por estado de asistencia
      if (soloPresentes === "presentes") {
        cumpleFiltro = trabajador.presente;
      } else if (soloPresentes === "ausentes") {
        cumpleFiltro = !trabajador.presente;
      } else if (soloPresentes === "confirmados") {
        cumpleFiltro = trabajador.asiste;
      } else if (soloPresentes === "pendientes") {
        cumpleFiltro = !trabajador.asiste;
      }

      // Filtros de texto (case insensitive)
      const cumpleRut = !rut || trabajador.rut.toLowerCase().includes(rut.toLowerCase());
      const cumpleNombres = !localNombres || (trabajador.nombres ?? trabajador.nombre ?? '').toLowerCase().includes(localNombres.toLowerCase());
      const cumpleApellidos = !localApellidos || (trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '') ?? '').toLowerCase().includes(localApellidos.toLowerCase());
      const cumpleObservacion = !localObservacion || (trabajador.observacion ?? '').toLowerCase().includes(localObservacion.toLowerCase());

          return cumpleFiltro && cumpleRut && cumpleNombres && cumpleApellidos && cumpleObservacion;
    });
  }, [trabajadores, soloPresentes, rut, localNombres, localApellidos, localObservacion]);

  const trabajadoresOrdenados = useMemo(() => {
    return [...trabajadoresFiltrados].sort((a, b) => {
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
  }, [trabajadoresFiltrados, ordenCampo, ordenAlfabetico]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(trabajadoresOrdenados.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const trabajadoresPagina = useMemo(() => {
    const start = (paginaActual - 1) * pageSize;
    return trabajadoresOrdenados.slice(start, start + pageSize);
  }, [trabajadoresOrdenados, paginaActual]);

  // Reset página cuando cambian filtros/orden
  React.useEffect(() => {
    setPagina(1);
  }, [soloPresentes, rut, localNombres, localApellidos, localObservacion, ordenCampo, ordenAlfabetico]);

  return (
    <div className="flex flex-col items-center w-full">

      {/* Filtros Desplegables */}
      <motion.div
        className="mb-6 w-full max-w-full sm:max-w-4xl md:max-w-5xl mx-auto"
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
                ({trabajadoresFiltrados.length} de {trabajadores.length} funcionarios)
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">RUT</label>
                      <input
                        type="text"
                        placeholder="Buscar RUT..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={rut}
                        onChange={e => setRUT(e.target.value)}
                      />
                    </div>


                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Nombres</label>
                      <input
                        type="text"
                        placeholder="Buscar nombres..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={localNombres}
                        onChange={e => setLocalNombres(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Apellidos</label>
                      <input
                        type="text"
                        placeholder="Buscar apellidos..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={localApellidos}
                        onChange={e => setLocalApellidos(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Observación</label>
                      <input
                        type="text"
                        placeholder="Buscar observación..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200"
                        value={localObservacion}
                        onChange={e => setLocalObservacion(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Columnas</label>
                      <select
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200"
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
                          estado: "Estado",
                          rut: "RUT",
                          nombres: "Nombres",
                          apellidos: "Apellidos",
                          asiste: "Confirmación",
                          observacion: "Observación"
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
                        setRUT("");
                        setLocalNombres("");
                        setLocalApellidos("");
                        setLocalObservacion("");
                        if (setSoloPresentes) setSoloPresentes("");
                        mostrarTodasLasColumnas();
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
          className="w-full max-w-full sm:max-w-4xl md:max-w-5xl mx-auto overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gradient-to-r from-green-800 to-emerald-600 text-white sticky top-0 z-10">
                {/* Indicadores de estado de asistencia */}
                <tr className="bg-gradient-to-r from-green-900 to-emerald-700">
                  <th colSpan={Object.values(columnasVisibles).filter(Boolean).length} className="py-2 px-4 text-left text-sm font-medium">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Confirman asistencia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Pendientes</span>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr>
                  {columnasVisibles.asiste && (
                    <th className="py-4 px-4 text-center font-semibold min-w-24">Confirmación</th>
                  )}
                  {columnasVisibles.estado && (
                    <th className="py-4 px-4 text-center font-semibold min-w-28">Estado</th>
                  )}
                  {columnasVisibles.rut && (
                    <th className="py-4 px-4 text-left font-semibold min-w-32">RUT</th>
                  )}
                  {columnasVisibles.nombres && (
                    <th
                      className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors min-w-36 flex-1"
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
                      className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors min-w-36 flex-1"
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
                  {columnasVisibles.observacion && (
                    <th className="py-4 px-4 text-left font-semibold min-w-36">Observación</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {trabajadoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(columnasVisibles).filter(Boolean).length} className="py-16 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="relative">
                          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">?</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-500 font-semibold text-lg mb-1">Sin funcionarios encontrados</div>
                          <div className="text-slate-400 text-sm max-w-md">
                            No hay funcionarios que coincidan con los filtros aplicados.
                            <br />
                            <span className="text-green-600 font-medium">Prueba ajustando los filtros de búsqueda.</span>
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  trabajadoresPagina.map((trabajador, idx) => (
                    <tr
                      key={trabajador.rut}
                      className={`${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border-b border-slate-100 group ${trabajador.asiste ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-gray-300'}`}
                    >
                      {columnasVisibles.asiste && (
                        <td className="py-4 px-4 text-center min-w-24">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto cursor-help transition-transform duration-200 hover:scale-110 ${
                              trabajador.asiste ? 'bg-green-500 shadow-green-200 shadow-md' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            title={`${trabajador.asiste ? '✅ Confirma asistencia previa' : '❌ No confirma asistencia previa'}`}
                          ></div>
                        </td>
                      )}
                      {columnasVisibles.estado && (
                        <td className="py-4 px-4 text-center min-w-28">
                          {trabajador.presente ? (
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
                      {columnasVisibles.rut && (
                        <td className="py-4 px-4 font-mono text-slate-700 min-w-32">{trabajador.rut}</td>
                      )}
                      {columnasVisibles.nombres && (
                        <td className="py-4 px-4 text-slate-800 font-medium min-w-36 flex-1">
                          <div className="truncate" title={trabajador.nombres ?? trabajador.nombre ?? '-'}>
                            {trabajador.nombres ?? trabajador.nombre ?? '-'}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.apellidos && (
                        <td className="py-4 px-4 text-slate-800 font-medium min-w-36 flex-1">
                          <div className="truncate" title={trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}>
                            {trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.observacion && (
                        <td className="py-4 px-4 text-slate-700 min-w-36">
                          <div className="truncate max-w-xs" title={trabajador.observacion ?? '-'}>
                            {trabajador.observacion ?? '-'}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {trabajadoresOrdenados.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-700">
              <div>
                Mostrando {(paginaActual - 1) * pageSize + 1} - {Math.min(paginaActual * pageSize, trabajadoresOrdenados.length)} de {trabajadoresOrdenados.length} funcionarios
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 rounded border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Anterior
                </button>
                <span className="px-2">
                  Página {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 rounded border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrabajadoresLista;
