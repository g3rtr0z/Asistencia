import React, { useState, useMemo, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
// import { motion, AnimatePresence } from 'framer-motion';
import { updateAlumno } from '../../services/alumnosService';
import { createPortal } from 'react-dom';

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
  esAdmin = false,
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [carrera, institucion, grupo, rut, numeroLista, asiento, nombres, apellidos, soloPresentes]);

  // Estados para edición
  const [alumnoAEditar, setAlumnoAEditar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleEditarClick = (alumno) => {
    setEditFormData({
      nombres: alumno.nombres || '',
      apellidos: alumno.apellidos || '',
      rut: alumno.rut || '',
      carrera: alumno.carrera || '',
      institucion: alumno.institucion || '',
      grupo: alumno.grupo || '',
      asiento: alumno.asiento || '',
    });
    setAlumnoAEditar(alumno);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!alumnoAEditar) return;
    setIsSaving(true);
    try {
      await updateAlumno(alumnoAEditar.eventoId, alumnoAEditar.id, editFormData);
      setAlumnoAEditar(null);
      // El cambio se reflejará automáticamente por el suscriptor
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el alumno');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Configuración de columnas visibles - habilitadas por defecto
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    rut: true, // Prioridad 1
    nombres: true, // Prioridad 2
    apellidos: true, // Prioridad 3
    asiento: true, // Prioridad 4
    grupo: true, // Prioridad 5
    carrera: true, // Prioridad 6
    institucion: true, // Prioridad 7
  });

  // useEffect eliminado para que siempre se muestren las columnas por defecto, o lo que elija el usuario.

  // Resetear el filtro de grupo cuando cambia la carrera o institución para evitar estados inconsistentes
  useEffect(() => {
    setGrupo('');
  }, [carrera, institucion]);

  function handleOrdenarPor(campo) {
    if (ordenCampo === campo) {
      setOrdenAlfabetico(ordenAlfabetico === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenCampo(campo);
      setOrdenAlfabetico('asc');
    }
  }

  function toggleColumna(columna) {
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna],
    }));
  }

  function mostrarTodasLasColumnas() {
    setColumnasVisibles({
      estado: true,
      grupo: true,
      asiento: true,
      nombres: true,
      apellidos: true,
      carrera: true,
      rut: true,
      institucion: true,
    });
  }

  // 1. Filtrar base de alumnos para las opciones
  // Si está marcado "soloPresentes", las opciones solo deben mostrar datos de alumnos presentes.
  const alumnosParaOpciones = useMemo(() => {
    if (!soloPresentes) return alumnos;
    return alumnos.filter(alumno =>
      soloPresentes === 'presentes' ? alumno.presente : !alumno.presente
    );
  }, [alumnos, soloPresentes]);

  // Generar opciones dinámicamente desde los datos (usando la base filtrada)
  const opcionesInstituciones = useMemo(() => {
    return [...new Set(alumnosParaOpciones.map(a => a.institucion))].sort();
  }, [alumnosParaOpciones]);

  // Agrupar carreras por institución
  const carrerasPorInstitucion = useMemo(() => {
    const grupos = {};
    alumnosParaOpciones.forEach(alumno => {
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
  }, [alumnosParaOpciones]);

  // Obtener los grupos únicos presentes en los alumnos, filtrados por carrera/institución
  const gruposUnicos = useMemo(() => {
    const set = new Set();

    // Filtrar alumnos para mostrar solo los grupos coherentes con los filtros actuales
    const alumnosParaGrupos = alumnosParaOpciones.filter(a => {
      const matchCarrera = !carrera || a.carrera === carrera;
      const matchInstitucion = !institucion || a.institucion === institucion;
      return matchCarrera && matchInstitucion;
    });

    alumnosParaGrupos.forEach(a => {
      if (a.grupo) {
        // Normalizar: convertir a string y quitar espacios
        set.add(String(a.grupo).trim());
      }
    });
    return Array.from(set).sort((a, b) => {
      // Intentar ordenar con lógica natural
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [alumnosParaOpciones, carrera, institucion]);

  // Obtener los asientos únicos presentes en los alumnos
  const asientosUnicos = useMemo(() => {
    const set = new Set();
    alumnosParaOpciones.forEach(a => {
      if (a.asiento) set.add(String(a.asiento).trim());
    });
    return Array.from(set).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [alumnosParaOpciones]);

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

      // Comparación normalizada para grupo
      const grupoAlumno = alumno.grupo ? String(alumno.grupo).trim() : '';
      const grupoFiltro = grupo ? String(grupo).trim() : '';
      const cumpleGrupo = !grupoFiltro || grupoAlumno === grupoFiltro;

      const cumpleAsiento = !asiento || String(alumno.asiento).trim() === String(asiento).trim();
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
        cumpleAsiento &&
        cumpleNombres &&
        cumpleApellidos
      );
    });
  }, [alumnos, soloPresentes, carrera, rut, institucion, grupo, asiento, nombres, apellidos]);

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

  // Componente reutilizable de paginación
  const PaginationControls = () => (
    <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-y border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>por página</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 hidden sm:inline">
          {itemsPerPage * (currentPage - 1) + 1} - {Math.min(itemsPerPage * currentPage, alumnosOrdenados.length)} de {alumnosOrdenados.length}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-medium text-slate-700">
            Pág. {currentPage} / {Math.max(1, Math.ceil(alumnosOrdenados.length / itemsPerPage))}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(alumnosOrdenados.length / itemsPerPage), p + 1))}
            disabled={currentPage >= Math.ceil(alumnosOrdenados.length / itemsPerPage)}
            className="p-2 rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col items-center w-full'>
      <div className='mb-6 w-full flex justify-center'>
        <div className='w-full mx-auto flex flex-col gap-4'>
          <div
            className='w-full'
          >
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'>
              <button
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className='w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-st-verde rounded-lg flex items-center justify-center'>
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
                <div
                  className={`transform transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`}
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
                </div>
              </button>

              {filtrosAbiertos && (
                <div
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
                          className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
                          value={rut}
                          onChange={e => setRUT(e.target.value)}
                        />
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-slate-700'>
                          Carrera
                        </label>
                        <select
                          className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
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
                          className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
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
                            className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
                            value={grupo}
                            onChange={e => setGrupo(e.target.value)}
                          >
                            <option value=''>Todos</option>
                            {gruposUnicos.map(gr => (
                              <option key={gr} value={gr}>{gr}</option>
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
                            className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
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
                          className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
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
                          className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
                          value={apellidos}
                          onChange={e => setApellidos(e.target.value)}
                        />
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-slate-700'>
                          Columnas
                        </label>
                        <select
                          className='w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all duration-200'
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
                      <button
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
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Tabla Simplificada */}
      <div className='w-full flex justify-center'>
        <div
          className='w-full mx-auto overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white'
        >
          {/* Listado en parte superior */}
          <PaginationControls />

          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gradient-to-r from-green-800 to-emerald-600 text-white sticky top-0 z-10'>
                <tr>
                  {columnasVisibles.estado && (
                    <th className='py-4 px-4 text-center font-semibold w-24'>
                      Estado
                    </th>
                  )}
                  {columnasVisibles.rut && (
                    <th className='py-4 px-4 text-left font-semibold w-32'>
                      RUT
                    </th>
                  )}
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
                  {columnasVisibles.asiento && (
                    <th className='py-4 px-4 text-left font-semibold w-24'>
                      Asiento
                    </th>
                  )}
                  {columnasVisibles.grupo && (
                    <th className='py-4 px-4 text-left font-semibold w-24 whitespace-nowrap'>
                      Grupo
                    </th>
                  )}
                  {columnasVisibles.carrera && (
                    <th className='py-4 px-4 text-left font-semibold'>
                      Carrera
                    </th>
                  )}
                  {columnasVisibles.institucion && (
                    <th className='py-4 px-4 text-left font-semibold'>
                      Institución
                    </th>
                  )}
                  {esAdmin && (
                    <th className='py-4 px-4 text-center font-semibold w-20'>
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {alumnosOrdenados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Object.values(columnasVisibles).filter(Boolean).length + 1}
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
                  alumnosOrdenados
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((alumno, idx) => {
                      // Crear una clave única
                      const uniqueKey = alumno.id
                        ? `alumno-${alumno.id}`
                        : `alumno-${alumno.rut}-${idx}-${alumno.nombres || ''}-${alumno.apellidos || ''}`;

                      return (
                        <tr
                          key={uniqueKey}
                          className={`${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-green-50 transition-all duration-200 border-b border-slate-100`}
                        >
                          {columnasVisibles.estado && (
                            <td className='py-4 px-4 text-center w-24'>
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
                                title={alumno.apellidos ?? '-'}
                              >
                                {alumno.apellidos ?? '-'}
                              </div>
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
                            <td className='py-4 px-4 font-semibold text-slate-700 text-center w-24 whitespace-nowrap'>
                              <span className='bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold'>
                                {alumno.grupo ?? '-'}
                              </span>
                            </td>
                          )}

                          {columnasVisibles.carrera && (
                            <td className='py-4 px-4 text-slate-600 text-xs'>
                              <div className='truncate' title={alumno.carrera ?? '-'}>
                                {alumno.carrera ?? '-'}
                              </div>
                            </td>
                          )}

                          {columnasVisibles.institucion && (
                            <td className='py-4 px-4 text-slate-600 text-xs'>
                              <div className='truncate' title={alumno.institucion ?? '-'}>
                                {alumno.institucion ?? '-'}
                              </div>
                            </td>
                          )}

                          {esAdmin && (
                            <td className='py-4 px-4 text-center'>
                              <button
                                onClick={() => handleEditarClick(alumno)}
                                className='text-slate-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-50'
                                title='Editar'
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                            </td>
                          )}

                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          <PaginationControls />
        </div>
      </div >

      {/* Modal de Edición */}
      {
        alumnoAEditar && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Editar Alumno</h3>
                <button
                  onClick={() => setAlumnoAEditar(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGuardarEdicion} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nombres</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nombres}
                    onChange={e => setEditFormData({ ...editFormData, nombres: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={editFormData.apellidos}
                    onChange={e => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">RUT</label>
                  <input
                    type="text"
                    required
                    value={editFormData.rut}
                    onChange={e => setEditFormData({ ...editFormData, rut: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all bg-slate-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Carrera</label>
                  <input
                    type="text"
                    value={editFormData.carrera}
                    onChange={e => setEditFormData({ ...editFormData, carrera: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Institución</label>
                  <select
                    value={editFormData.institucion}
                    onChange={e => setEditFormData({ ...editFormData, institucion: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {INSTITUCIONES.map(inst => (
                      <option key={inst.value} value={inst.value}>{inst.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Grupo</label>
                  <input
                    type="text"
                    value={editFormData.grupo}
                    onChange={e => setEditFormData({ ...editFormData, grupo: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Asiento</label>
                  <input
                    type="text"
                    value={editFormData.asiento}
                    onChange={e => setEditFormData({ ...editFormData, asiento: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2 pt-4 flex gap-3 justify-end border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setAlumnoAEditar(null)}
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-st-verde text-white font-bold rounded-lg hover:bg-[#004b30] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
};

export default AlumnosLista;
