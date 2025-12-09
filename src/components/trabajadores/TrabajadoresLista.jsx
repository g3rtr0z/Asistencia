import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FixedSizeList } from "react-window";

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

  const gridTemplateColumns = useMemo(() => {
    const cols = [];
    if (columnasVisibles.asiste) cols.push("90px");
    if (columnasVisibles.estado) cols.push("120px");
    if (columnasVisibles.rut) cols.push("160px");
    if (columnasVisibles.nombres) cols.push("1.3fr");
    if (columnasVisibles.apellidos) cols.push("1.3fr");
    if (columnasVisibles.observacion) cols.push("1.2fr");
    return cols.join(" ");
  }, [columnasVisibles]);

  const Row = ({ index, style, data }) => {
    const { items, columnasVisibles, gridTemplateColumns } = data;
    const trabajador = items[index];
    const zebra = index % 2 === 0 ? 'bg-slate-50' : 'bg-white';

    return (
      <div
        style={{ ...style, display: "grid", gridTemplateColumns, alignItems: "center" }}
        className={`${zebra} border-b border-slate-100 px-4 text-sm text-slate-800`}
      >
        {columnasVisibles.asiste && (
          <div className="flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${
                trabajador.asiste ? 'bg-green-500' : 'bg-gray-300'
              }`}
              title={trabajador.asiste ? 'Confirma asistencia previa' : 'No confirma asistencia previa'}
            />
          </div>
        )}
        {columnasVisibles.estado && (
          <div className="flex justify-center">
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
          </div>
        )}
        {columnasVisibles.rut && (
          <div className="font-mono text-slate-700 truncate">{trabajador.rut}</div>
        )}
        {columnasVisibles.nombres && (
          <div className="font-medium truncate" title={trabajador.nombres ?? trabajador.nombre ?? '-'}>
            {trabajador.nombres ?? trabajador.nombre ?? '-'}
          </div>
        )}
        {columnasVisibles.apellidos && (
          <div className="font-medium truncate" title={trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}>
            {trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}
          </div>
        )}
        {columnasVisibles.observacion && (
          <div className="text-slate-700 truncate" title={trabajador.observacion ?? '-'}>
            {trabajador.observacion ?? '-'}
          </div>
        )}
      </div>
    );
  };

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

      {/* Lista virtualizada */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-full sm:max-w-4xl md:max-w-5xl mx-auto overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white">
          <div className="bg-gradient-to-r from-green-800 to-emerald-600 text-white sticky top-0 z-10">
            <div className="bg-gradient-to-r from-green-900 to-emerald-700 py-2 px-4 text-sm font-medium">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Confirman asistencia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <span>Pendientes</span>
                </div>
              </div>
            </div>
            <div
              className="grid items-center py-3 px-4 text-sm font-semibold"
              style={{ gridTemplateColumns }}
            >
              {columnasVisibles.asiste && (
                <div className="text-center">Confirmación</div>
              )}
              {columnasVisibles.estado && (
                <div className="text-center">Estado</div>
              )}
              {columnasVisibles.rut && (
                <div className="text-left">RUT</div>
              )}
              {columnasVisibles.nombres && (
                <button
                  className="text-left hover:text-slate-100 transition-colors flex items-center gap-1"
                  onClick={() => handleOrdenarPor("nombre")}
                >
                  <span>Nombres</span>
                  {ordenCampo === "nombre" && (
                    <span aria-label={ordenAlfabetico === "asc" ? "Ascendente" : "Descendente"}>
                      {ordenAlfabetico === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              )}
              {columnasVisibles.apellidos && (
                <button
                  className="text-left hover:text-slate-100 transition-colors flex items-center gap-1"
                  onClick={() => handleOrdenarPor("apellidos")}
                >
                  <span>Apellidos</span>
                  {ordenCampo === "apellidos" && (
                    <span aria-label={ordenAlfabetico === "asc" ? "Ascendente" : "Descendente"}>
                      {ordenAlfabetico === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              )}
              {columnasVisibles.observacion && (
                <div className="text-left">Observación</div>
              )}
            </div>
          </div>

          {trabajadoresOrdenados.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
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
              </div>
            </div>
          ) : (
            <FixedSizeList
              height={Math.min(560, Math.max(240, trabajadoresOrdenados.length * 64))}
              itemCount={trabajadoresOrdenados.length}
              itemSize={64}
              width="100%"
              itemData={{ items: trabajadoresOrdenados, columnasVisibles, gridTemplateColumns }}
              overscanCount={8}
            >
              {Row}
            </FixedSizeList>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrabajadoresLista;
