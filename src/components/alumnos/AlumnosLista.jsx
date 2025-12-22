import React, { useState, useMemo, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const INSTITUCIONES = [
  { value: 'CFT', label: 'Centro de Formación Técnica' },
  { value: 'IP', label: 'Instituto Profesional' },
  { value: 'Universidad', label: 'Universidad' },
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
  filtroGrupo,
  onAgregarAlumnos: _onAgregarAlumnos,
  onEliminarAlumnos: _onEliminarAlumnos,
}) => {
  // Si no vienen por props, usar estado local (para compatibilidad con admin)
  const [localCarrera, setLocalCarrera] = useState('');
  const [localRUT, setLocalRUT] = useState('');
  const [localInstitucion, setLocalInstitucion] = useState('');
  const [localGrupo, setLocalGrupo] = useState('');
  const [localNumeroLista, setLocalNumeroLista] = useState('');
  const [localAsiento, setLocalAsiento] = useState('');
  const [localNombres, setLocalNombres] = useState('');
  const [localApellidos, setLocalApellidos] = useState('');

  const carrera = filtroCarrera !== undefined ? filtroCarrera : localCarrera;
  const setCarrera = setFiltroCarrera || setLocalCarrera;
  const institucion =
    filtroInstitucion !== undefined ? filtroInstitucion : localInstitucion;
  const setInstitucion = setFiltroInstitucion || setLocalInstitucion;
  const rut = filtroRUT !== undefined ? filtroRUT : localRUT;
  const setRUT = setFiltroRUT || setLocalRUT;
  const grupo = filtroGrupo !== undefined ? filtroGrupo : localGrupo;
  const setGrupo = setFiltroGrupo || setLocalGrupo;
  const numeroLista = localNumeroLista;
  const setNumeroLista = setLocalNumeroLista;
  const asiento = localAsiento;
  const setAsiento = setLocalAsiento;
  const nombres = localNombres;
  const setNombres = setLocalNombres;
  const apellidos = localApellidos;
  const setApellidos = setLocalApellidos;

  const [ordenAlfabetico, setOrdenAlfabetico] = useState('asc');
  const [ordenCampo, setOrdenCampo] = useState('nombre');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Detectar qué columnas tienen datos en los alumnos
  const columnasConDatos = useMemo(() => {
    if (alumnos.length === 0) {
      return {
        estado: true,
        grupo: false,
        numeroLista: true, // Siempre mostrar N° de Lista
        asiento: false,
        nombres: true,
        apellidos: true,
        carrera: true,
        rut: true,
        institucion: true,
      };
    }

    // Verificar si algún alumno tiene valor no nulo para cada campo
    const tieneGrupo = alumnos.some(a => a.grupo != null && a.grupo !== '');
    const tieneNumeroLista = alumnos.some(
      a => a.numeroLista != null && a.numeroLista !== ''
    );
    const tieneAsiento = alumnos.some(
      a => a.asiento != null && a.asiento !== ''
    );
    const tieneNombres = alumnos.some(
      a =>
        (a.nombres != null && a.nombres !== '') ||
        (a.nombre != null && a.nombre !== '')
    );
    const tieneApellidos = alumnos.some(
      a => a.apellidos != null && a.apellidos !== ''
    );
    const tieneCarrera = alumnos.some(
      a => a.carrera != null && a.carrera !== ''
    );
    const tieneRut = alumnos.some(a => a.rut != null && a.rut !== '');
    const tieneInstitucion = alumnos.some(
      a => a.institucion != null && a.institucion !== ''
    );

    return {
      estado: true,
      grupo: tieneGrupo,
      numeroLista: true, // SIEMPRE mostrar N° de Lista - no depende de datos
      asiento: tieneAsiento,
      nombres: tieneNombres,
      apellidos: tieneApellidos,
      carrera: tieneCarrera,
      rut: tieneRut,
      institucion: tieneInstitucion,
    };
  }, [alumnos]);

  // Configuración de columnas visibles - inicializar basado en datos disponibles
  // numeroLista SIEMPRE debe estar visible
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    grupo: true,
    numeroLista: true, // SIEMPRE visible
    asiento: true,
    nombres: true,
    apellidos: true,
    carrera: true,
    rut: true,
    institucion: true,
  });

  // Actualizar columnas visibles cuando cambian los datos de alumnos
  // Ocultar automáticamente columnas que no tienen datos (excepto numeroLista que siempre se muestra)
  useEffect(() => {
    setColumnasVisibles(prev => {
      const nuevas = { ...prev };

      // Para cada columna, verificar si tiene datos
      Object.keys(columnasConDatos).forEach(columna => {
        // numeroLista siempre se muestra, incluso si no tiene datos
        if (columna === 'numeroLista') {
          nuevas[columna] = true; // Siempre visible, forzar true
        } else if (!columnasConDatos[columna]) {
          // Si no tiene datos, ocultarla automáticamente
          nuevas[columna] = false;
        } else {
          // Si tiene datos, mantener el estado actual o mostrarla por defecto
          nuevas[columna] = prev[columna] !== undefined ? prev[columna] : true;
        }
      });

      // Asegurar que numeroLista siempre esté visible
      nuevas.numeroLista = true;

      return nuevas;
    });
  }, [columnasConDatos]);

  function handleOrdenarPor(campo) {
    if (ordenCampo === campo) {
      setOrdenAlfabetico(ordenAlfabetico === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenCampo(campo);
      setOrdenAlfabetico('asc');
    }
  }

  function toggleColumna(columna) {
    // No permitir ocultar numeroLista
    if (columna === 'numeroLista') {
      return;
    }
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna],
    }));
  }

  function mostrarTodasLasColumnas() {
    setColumnasVisibles({
      estado: true,
      grupo: true,
      numeroLista: true,
      asiento: true,
      nombres: true,
      apellidos: true,
      carrera: true,
      rut: true,
      institucion: true,
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

  // Obtener los números de lista únicos presentes en los alumnos
  const numerosListaUnicos = useMemo(() => {
    const set = new Set();
    alumnos.forEach(a => {
      if (a.numeroLista) set.add(a.numeroLista);
    });
    return Array.from(set).sort((a, b) => {
      // Intentar ordenar numéricamente si es posible
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b));
    });
  }, [alumnos]);

  // Obtener los asientos únicos presentes en los alumnos
  const asientosUnicos = useMemo(() => {
    const set = new Set();
    alumnos.forEach(a => {
      if (a.asiento) set.add(a.asiento);
    });
    return Array.from(set).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b));
    });
  }, [alumnos]);

  // Filtrado simplificado
  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter(alumno => {
      const cumplePresente =
        !soloPresentes ||
        (soloPresentes === 'presentes' ? alumno.presente : !alumno.presente);
      const cumpleCarrera = !carrera || alumno.carrera === carrera;
      const cumpleRut = !rut || alumno.rut.toLowerCase().includes(rut.toLowerCase());
      const cumpleInstitucion =
        !institucion || alumno.institucion === institucion;
      const cumpleGrupo = !grupo || String(alumno.grupo) === String(grupo);
      const cumpleNumeroLista = !numeroLista || String(alumno.numeroLista) === String(numeroLista);
      const cumpleAsiento = !asiento || String(alumno.asiento) === String(asiento);
      const cumpleNombres = !nombres || 
        (alumno.nombres && alumno.nombres.toLowerCase().includes(nombres.toLowerCase())) ||
        (alumno.nombre && alumno.nombre.toLowerCase().includes(nombres.toLowerCase()));
      const cumpleApellidos = !apellidos || 
        (alumno.apellidos && alumno.apellidos.toLowerCase().includes(apellidos.toLowerCase()));

      return (
        cumplePresente &&
        cumpleCarrera &&
        cumpleRut &&
        cumpleInstitucion &&
        cumpleGrupo &&
        cumpleNumeroLista &&
        cumpleAsiento &&
        cumpleNombres &&
        cumpleApellidos
      );
    });
  }, [alumnos, soloPresentes, carrera, rut, institucion, grupo, numeroLista, asiento, nombres, apellidos]);

  const alumnosOrdenados = useMemo(() => {
    return [...alumnosFiltrados].sort((a, b) => {
      let campoA, campoB;
      if (ordenCampo === 'apellidos') {
        campoA = (
          a.apellidos ??
          (a.nombre ? a.nombre.split(' ').slice(1).join(' ') : '')
        ).toLowerCase();
        campoB = (
          b.apellidos ??
          (b.nombre ? b.nombre.split(' ').slice(1).join(' ') : '')
        ).toLowerCase();
      } else {
        campoA = (a.nombres ?? a.nombre ?? '').toLowerCase();
        campoB = (b.nombres ?? b.nombre ?? '').toLowerCase();
      }
      if (ordenAlfabetico === 'asc') {
        return campoA.localeCompare(campoB);
      } else {
        return campoB.localeCompare(campoA);
      }
    });
  }, [alumnosFiltrados, ordenCampo, ordenAlfabetico]);

  return (
    <div className='flex flex-col items-center w-full'>
      <div className='mb-6 w-full flex justify-center'>
        <div className='w-full max-w-full sm:max-w-4xl md:max-w-5xl mx-auto flex flex-col gap-4'>
          <motion.div
            className='w-full'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'>
              <motion.button
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className='w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors'
                whileHover={{ backgroundColor: '#f8fafc' }}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-green-800 to-emerald-800 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z'
                      />
                    </svg>
                  </div>
                  <div className='flex flex-row items-center gap-2 flex-wrap'>
                    <h3 className='text-lg font-semibold text-slate-800'>
                      Filtros de Búsqueda
                    </h3>
                    <span className='text-sm text-slate-500'>
                      ({alumnosFiltrados.length} de {alumnos.length} alumnos)
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: filtrosAbiertos ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    className='w-5 h-5 text-slate-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {filtrosAbiertos && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className='overflow-hidden'
                  >
                    <div className='p-3 border-t border-slate-200'>
                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-2'>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            RUT
                          </label>
                          <input
                            type='text'
                            placeholder='Buscar RUT...'
                            className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value={rut}
                            onChange={e => setRUT(e.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            Carrera
                          </label>
                          <select
                            className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value={carrera}
                            onChange={e => setCarrera(e.target.value)}
                          >
                            <option value=''>Todas</option>
                            {Object.entries(carrerasPorInstitucion).map(
                              ([institucion, carreras]) => (
                                <optgroup
                                  key={institucion}
                                  label={getInstitucionLabel(institucion)}
                                >
                                  {carreras.map(carrera => (
                                    <option key={carrera} value={carrera}>
                                      {carrera}
                                    </option>
                                  ))}
                                </optgroup>
                              )
                            )}
                          </select>
                        </div>

                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            Institución
                          </label>
                          <select
                            className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value={institucion}
                            onChange={e => setInstitucion(e.target.value)}
                          >
                            <option value=''>Todas</option>
                            {opcionesInstituciones.map(inst => (
                              <option key={inst} value={inst}>
                                {getInstitucionLabel(inst)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {columnasConDatos.grupo && (
                          <div className='space-y-2'>
                            <label className='block text-sm font-medium text-slate-700'>
                              Grupo
                            </label>
                            <select
                              className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                              value={grupo}
                              onChange={e => setGrupo(e.target.value)}
                            >
                              <option value=''>Todos</option>
                              {gruposUnicos.map(gr => (
                                <option key={gr} value={gr}>{`G${gr}`}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {columnasConDatos.numeroLista && (
                          <div className='space-y-2'>
                            <label className='block text-sm font-medium text-slate-700'>
                              N° de Lista
                            </label>
                            <select
                              className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                              value={numeroLista}
                              onChange={e => setNumeroLista(e.target.value)}
                            >
                              <option value=''>Todos</option>
                              {numerosListaUnicos.map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {columnasConDatos.asiento && (
                          <div className='space-y-2'>
                            <label className='block text-sm font-medium text-slate-700'>
                              Asiento
                            </label>
                            <select
                              className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                              value={asiento}
                              onChange={e => setAsiento(e.target.value)}
                            >
                              <option value=''>Todos</option>
                              {asientosUnicos.map(asi => (
                                <option key={asi} value={asi}>{asi}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            Nombres
                          </label>
                          <input
                            type='text'
                            placeholder='Buscar nombres...'
                            className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value={nombres}
                            onChange={e => setNombres(e.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            Apellidos
                          </label>
                          <input
                            type='text'
                            placeholder='Buscar apellidos...'
                            className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value={apellidos}
                            onChange={e => setApellidos(e.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-slate-700'>
                            Columnas
                          </label>
                          <select
                            className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all duration-200'
                            value=''
                            onChange={e => {
                              if (e.target.value === 'mostrar-todas') {
                                mostrarTodasLasColumnas();
                              } else if (e.target.value) {
                                toggleColumna(e.target.value);
                              }
                              e.target.value = ''; // Reset select
                            }}
                          >
                            <option value=''>Configurar...</option>
                            {Object.entries({
                              estado: 'Estado',
                              grupo: 'Grupo',
                              numeroLista: 'N° de Lista',
                              asiento: 'Asiento',
                              nombres: 'Nombres',
                              apellidos: 'Apellidos',
                              carrera: 'Carrera',
                              rut: 'RUT',
                              institucion: 'Institución',
                            }).map(([key, label]) => (
                              <option key={key} value={key}>
                                {columnasVisibles[key] ? '❌' : '✅'} {label}
                              </option>
                            ))}
                            <option value='mostrar-todas'>🔄 Todas</option>
                          </select>
                          <div className='text-xs text-slate-500'>
                            {
                              Object.values(columnasVisibles).filter(Boolean)
                                .length
                            }
                            /{Object.keys(columnasVisibles).length}
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-end'>
                        <motion.button
                          onClick={() => {
                            setCarrera('');
                            setInstitucion('');
                            setRUT('');
                            setGrupo('');
                            setNumeroLista('');
                            setAsiento('');
                            setNombres('');
                            setApellidos('');
                            if (setSoloPresentes) setSoloPresentes('');
                            mostrarTodasLasColumnas(); // Resetear columnas también
                          }}
                          className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 text-sm hover:bg-slate-200 transition-all duration-200 flex items-center gap-2'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
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
        </div>
      </div>

      {/* Tabla Simplificada */}
      <div className='w-full flex justify-center'>
        <motion.div
          className='w-full max-w-full sm:max-w-4xl md:max-w-5xl mx-auto overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gradient-to-r from-green-800 to-emerald-600 text-white sticky top-0 z-10'>
                <tr>
                  {columnasVisibles.estado && (
                    <th className='py-4 px-4 text-center font-semibold w-28'>
                      Estado
                    </th>
                  )}
                  {columnasVisibles.rut && (
                    <th className='py-4 px-4 text-left font-semibold w-32'>
                      RUT
                    </th>
                  )}
                  {columnasVisibles.asiento && (
                    <th className='py-4 px-4 text-left font-semibold w-24'>
                      Asiento
                    </th>
                  )}
                  {columnasVisibles.grupo && (
                    <th className='py-4 px-4 text-left font-semibold w-32 whitespace-nowrap'>
                      Grupo
                    </th>
                  )}
                  <th className='py-4 px-4 text-left font-semibold w-32 whitespace-nowrap'>
                    N° de Lista
                  </th>
                  {columnasVisibles.nombres && (
                    <th
                      className='py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors w-40'
                      onClick={() => handleOrdenarPor('nombre')}
                    >
                      <div className='flex items-center gap-2'>
                        <span>Nombres</span>
                        {ordenCampo === 'nombre' && (
                          <svg
                            className='w-4 h-4 text-white'
                            fill='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              d={
                                ordenAlfabetico === 'asc'
                                  ? 'M7 14l5-5 5 5z'
                                  : 'M7 10l5 5 5-5z'
                              }
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                  )}
                  {columnasVisibles.apellidos && (
                    <th
                      className='py-4 px-4 text-left font-semibold cursor-pointer hover:bg-green-700 transition-colors w-40'
                      onClick={() => handleOrdenarPor('apellidos')}
                    >
                      <div className='flex items-center gap-2'>
                        <span>Apellidos</span>
                        {ordenCampo === 'apellidos' && (
                          <svg
                            className='w-4 h-4 text-white'
                            fill='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              d={
                                ordenAlfabetico === 'asc'
                                  ? 'M7 14l5-5 5 5z'
                                  : 'M7 10l5 5 5-5z'
                              }
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                  )}
                  {columnasVisibles.carrera && (
                    <th className='py-4 px-4 text-left font-semibold w-48'>
                      Carrera
                    </th>
                  )}
                  {columnasVisibles.institucion && (
                    <th className='py-4 px-4 text-left font-semibold w-40'>
                      Institución
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {alumnosOrdenados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        // Contar todas las columnas visibles + numeroLista (que siempre está visible)
                        Object.values(columnasVisibles).filter(Boolean).length + 1
                      }
                      className='py-12 text-center'
                    >
                      <div className='flex flex-col items-center gap-3'>
                        <svg
                          className='w-12 h-12 text-slate-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                          />
                        </svg>
                        <div className='text-slate-500 font-medium'>
                          No hay alumnos para mostrar
                        </div>
                        <div className='text-slate-400 text-sm'>
                          Intenta ajustar los filtros de búsqueda
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alumnosOrdenados.map((alumno, idx) => {
                    // Crear una clave única: usar id si existe, sino combinar rut con índice
                    const uniqueKey = alumno.id 
                      ? `alumno-${alumno.id}` 
                      : `alumno-${alumno.rut}-${idx}-${alumno.nombres || ''}-${alumno.apellidos || ''}`;
                    
                    return (
                    <tr
                      key={uniqueKey}
                      className={`${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-green-50 transition-all duration-200 border-b border-slate-100`}
                    >
                      {columnasVisibles.estado && (
                        <td className='py-4 px-4 text-center w-28'>
                          {alumno.presente ? (
                            <span className='inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200'>
                              <div className='w-2 h-2 bg-green-800 rounded-full'></div>
                              Presente
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200'>
                              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                              Ausente
                            </span>
                          )}
                        </td>
                      )}
                      {columnasVisibles.rut && (
                        <td className='py-4 px-4 font-mono text-slate-700 w-32'>
                          {alumno.rut}
                        </td>
                      )}
                      {columnasVisibles.asiento && (
                        <td className='py-4 px-4 font-semibold text-slate-700 text-center w-24'>
                          <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold'>
                            {alumno.asiento ?? '-'}
                          </span>
                        </td>
                      )}
                      {columnasVisibles.grupo && (
                        <td className='py-4 px-4 font-semibold text-slate-700 text-center w-32 whitespace-nowrap'>
                          <span className='bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold'>
                            {alumno.grupo ?? '-'}
                          </span>
                        </td>
                      )}
                      <td className='py-4 px-4 font-semibold text-slate-700 text-center w-32 whitespace-nowrap'>
                        <span className='bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold'>
                          {alumno.numeroLista != null && alumno.numeroLista !== '' 
                            ? String(alumno.numeroLista) 
                            : '-'}
                        </span>
                      </td>
                      {columnasVisibles.nombres && (
                        <td className='py-4 px-4 text-slate-800 font-medium w-40'>
                          <div
                            className='truncate'
                            title={alumno.nombres ?? alumno.nombre ?? '-'}
                          >
                            {alumno.nombres ?? alumno.nombre ?? '-'}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.apellidos && (
                        <td className='py-4 px-4 text-slate-800 font-medium w-40'>
                          <div
                            className='truncate'
                            title={
                              alumno.apellidos ??
                              (alumno.nombre
                                ? alumno.nombre.split(' ').slice(1).join(' ')
                                : '-')
                            }
                          >
                            {alumno.apellidos ??
                              (alumno.nombre
                                ? alumno.nombre.split(' ').slice(1).join(' ')
                                : '-')}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.carrera && (
                        <td className='py-4 px-4 text-slate-700 w-48'>
                          <div className='truncate' title={alumno.carrera}>
                            {alumno.carrera}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.institucion && (
                        <td className='py-4 px-4 text-slate-700 w-40'>
                          <div
                            className='truncate'
                            title={getInstitucionLabel(alumno.institucion)}
                          >
                            {getInstitucionLabel(alumno.institucion)}
                          </div>
                        </td>
                      )}
                    </tr>
                    );
                  })
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
