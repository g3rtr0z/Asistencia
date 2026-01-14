import React, { useState, useMemo, useEffect } from 'react';
import { updateAlumno } from '../../services/alumnosService';
import { createPortal } from 'react-dom';
import { exportarAExcel } from '../admin/exportarAExcel';

const INSTITUCIONES = [
  { value: 'CFT', label: 'Centro de Formación Técnica' },
  { value: 'IP', label: 'Instituto Profesional' },
  { value: 'Universidad', label: 'Universidad' },
];

function getInstitucionLabel(value) {
  const found = INSTITUCIONES.find(i => i.value === value);
  return found ? found.label : value;
}

const AlumnosLista = ({
  alumnos = [],
  alumnosCompletos,
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
  eventoNombre = 'Evento',
  tipoEvento = 'alumnos',
}) => {
  // Use alumnosCompletos for stats, fallback to alumnos
  const alumnosParaStats = alumnosCompletos || alumnos;
  // Local state for filters (for compatibility with admin)
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
  const institucion = filtroInstitucion !== undefined ? filtroInstitucion : localInstitucion;
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [carrera, institucion, grupo, rut, numeroLista, asiento, nombres, apellidos, soloPresentes]);

  // Edit states
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
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el alumno');
    } finally {
      setIsSaving(false);
    }
  };

  // Detect which columns have data
  const columnasConDatos = useMemo(() => {
    if (alumnos.length === 0) {
      return {
        estado: true,
        grupo: false,
        numeroLista: true,
        asiento: false,
        nombres: true,
        apellidos: true,
        carrera: true,
        rut: true,
        institucion: true,
      };
    }

    return {
      estado: true,
      grupo: alumnos.some(a => a.grupo != null && a.grupo !== ''),
      numeroLista: true,
      asiento: alumnos.some(a => a.asiento != null && a.asiento !== ''),
      nombres: alumnos.some(a => (a.nombres != null && a.nombres !== '') || (a.nombre != null && a.nombre !== '')),
      apellidos: alumnos.some(a => a.apellidos != null && a.apellidos !== ''),
      carrera: alumnos.some(a => a.carrera != null && a.carrera !== ''),
      rut: alumnos.some(a => a.rut != null && a.rut !== ''),
      institucion: alumnos.some(a => a.institucion != null && a.institucion !== ''),
    };
  }, [alumnos]);

  // Column visibility config
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    rut: true,
    nombres: true,
    apellidos: true,
    asiento: true,
    grupo: true,
    carrera: true,
    institucion: true,
  });

  // Reset group filter when career/institution changes
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
    setColumnasVisibles(prev => ({ ...prev, [columna]: !prev[columna] }));
  }

  function mostrarTodasLasColumnas() {
    setColumnasVisibles({
      estado: true, grupo: true, asiento: true, nombres: true,
      apellidos: true, carrera: true, rut: true, institucion: true,
    });
  }

  function limpiarFiltros() {
    setCarrera('');
    setInstitucion('');
    setRUT('');
    setGrupo('');
    setNumeroLista('');
    setAsiento('');
    setNombres('');
    setApellidos('');
    if (setSoloPresentes) setSoloPresentes('');
    mostrarTodasLasColumnas();
  }

  // Filter base for options
  const alumnosParaOpciones = useMemo(() => {
    if (!soloPresentes) return alumnos;
    return alumnos.filter(alumno => soloPresentes === 'presentes' ? alumno.presente : !alumno.presente);
  }, [alumnos, soloPresentes]);

  const opcionesInstituciones = useMemo(() => {
    return [...new Set(alumnosParaOpciones.map(a => a.institucion))].sort();
  }, [alumnosParaOpciones]);

  const carrerasPorInstitucion = useMemo(() => {
    const grupos = {};
    alumnosParaOpciones.forEach(alumno => {
      if (!grupos[alumno.institucion]) grupos[alumno.institucion] = new Set();
      grupos[alumno.institucion].add(alumno.carrera);
    });
    Object.keys(grupos).forEach(inst => { grupos[inst] = [...grupos[inst]].sort(); });
    return grupos;
  }, [alumnosParaOpciones]);

  const gruposUnicos = useMemo(() => {
    const set = new Set();
    const alumnosParaGrupos = alumnosParaOpciones.filter(a => {
      const matchCarrera = !carrera || a.carrera === carrera;
      const matchInstitucion = !institucion || a.institucion === institucion;
      return matchCarrera && matchInstitucion;
    });
    alumnosParaGrupos.forEach(a => { if (a.grupo) set.add(String(a.grupo).trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [alumnosParaOpciones, carrera, institucion]);

  const asientosUnicos = useMemo(() => {
    const set = new Set();
    alumnosParaOpciones.forEach(a => { if (a.asiento) set.add(String(a.asiento).trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [alumnosParaOpciones]);

  // Filtered students
  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter(alumno => {
      const cumplePresente = !soloPresentes || (soloPresentes === 'presentes' ? alumno.presente : !alumno.presente);
      const cumpleCarrera = !carrera || alumno.carrera === carrera;
      const cumpleRut = !rut || alumno.rut.toLowerCase().includes(rut.toLowerCase());
      const cumpleInstitucion = !institucion || alumno.institucion === institucion;
      const grupoAlumno = alumno.grupo ? String(alumno.grupo).trim() : '';
      const grupoFiltro = grupo ? String(grupo).trim() : '';
      const cumpleGrupo = !grupoFiltro || grupoAlumno === grupoFiltro;
      const cumpleAsiento = !asiento || String(alumno.asiento).trim() === String(asiento).trim();
      const cumpleNombres = !nombres || (alumno.nombres && alumno.nombres.toLowerCase().includes(nombres.toLowerCase())) || (alumno.nombre && alumno.nombre.toLowerCase().includes(nombres.toLowerCase()));
      const cumpleApellidos = !apellidos || (alumno.apellidos && alumno.apellidos.toLowerCase().includes(apellidos.toLowerCase()));
      return cumplePresente && cumpleCarrera && cumpleRut && cumpleInstitucion && cumpleGrupo && cumpleAsiento && cumpleNombres && cumpleApellidos;
    });
  }, [alumnos, soloPresentes, carrera, rut, institucion, grupo, asiento, nombres, apellidos]);

  // Sorted students
  const alumnosOrdenados = useMemo(() => {
    return [...alumnosFiltrados].sort((a, b) => {
      let campoA, campoB;
      if (ordenCampo === 'apellidos') {
        campoA = (a.apellidos ?? (a.nombre ? a.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
        campoB = (b.apellidos ?? (b.nombre ? b.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
      } else {
        campoA = (a.nombres ?? a.nombre ?? '').toLowerCase();
        campoB = (b.nombres ?? b.nombre ?? '').toLowerCase();
      }
      return ordenAlfabetico === 'asc' ? campoA.localeCompare(campoB) : campoB.localeCompare(campoA);
    });
  }, [alumnosFiltrados, ordenCampo, ordenAlfabetico]);

  // Stats - use alumnosParaStats so they don't change when filtering
  const totalPresentes = alumnosParaStats.filter(a => a.presente).length;
  const totalAusentes = alumnosParaStats.filter(a => !a.presente).length;

  // Pagination component
  const PaginationControls = () => (
    <div className="px-4 py-3 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
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
            className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-slate-700 px-2">
            {currentPage} / {Math.max(1, Math.ceil(alumnosOrdenados.length / itemsPerPage))}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(alumnosOrdenados.length / itemsPerPage), p + 1))}
            disabled={currentPage >= Math.ceil(alumnosOrdenados.length / itemsPerPage)}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-st-verde/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-st-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{alumnosParaStats.length}</p>
              <p className="text-xs text-slate-500">Total Participantes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalPresentes}</p>
              <p className="text-xs text-slate-500">Presentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalAusentes}</p>
              <p className="text-xs text-slate-500">Ausentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{[...new Set(alumnosParaStats.map(a => a.institucion))].length}</p>
              <p className="text-xs text-slate-500">Instituciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Presence Filter Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setSoloPresentes && setSoloPresentes('')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${!soloPresentes ? 'bg-white text-st-verde shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSoloPresentes && setSoloPresentes('presentes')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${soloPresentes === 'presentes' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Presentes
            </button>
            <button
              onClick={() => setSoloPresentes && setSoloPresentes('ausentes')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${soloPresentes === 'ausentes' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Ausentes
            </button>
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${filtrosAbiertos ? 'bg-st-verde text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filtros Avanzados
            <span className={`px-2 py-0.5 rounded text-xs ${filtrosAbiertos ? 'bg-white/20' : 'bg-st-verde text-white'}`}>
              {alumnosFiltrados.length}
            </span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button
                onClick={() => exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, '')}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-st-verde"></div>
                Todos ({alumnosParaStats.length})
              </button>
              <button
                onClick={() => exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, 'presentes')}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Presentes ({totalPresentes})
              </button>
              <button
                onClick={() => exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, 'ausentes')}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Ausentes ({totalAusentes})
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {filtrosAbiertos && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
                <input
                  type="text"
                  placeholder="Buscar RUT..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value={rut}
                  onChange={e => setRUT(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombres</label>
                <input
                  type="text"
                  placeholder="Buscar nombres..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value={nombres}
                  onChange={e => setNombres(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  placeholder="Buscar apellidos..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value={apellidos}
                  onChange={e => setApellidos(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value={carrera}
                  onChange={e => setCarrera(e.target.value)}
                >
                  <option value="">Todas</option>
                  {Object.entries(carrerasPorInstitucion).map(([inst, carreras]) => (
                    <optgroup key={inst} label={getInstitucionLabel(inst)}>
                      {carreras.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institución</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value={institucion}
                  onChange={e => setInstitucion(e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcionesInstituciones.map(inst => (
                    <option key={inst} value={inst}>{getInstitucionLabel(inst)}</option>
                  ))}
                </select>
              </div>
              {columnasConDatos.grupo && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                    value={grupo}
                    onChange={e => setGrupo(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {gruposUnicos.map(gr => <option key={gr} value={gr}>{gr}</option>)}
                  </select>
                </div>
              )}
              {columnasConDatos.asiento && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asiento</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                    value={asiento}
                    onChange={e => setAsiento(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {asientosUnicos.map(asi => <option key={asi} value={asi}>{asi}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Columnas</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
                  value=""
                  onChange={e => {
                    if (e.target.value === 'mostrar-todas') mostrarTodasLasColumnas();
                    else if (e.target.value) toggleColumna(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">Configurar...</option>
                  {Object.entries({ estado: 'Estado', grupo: 'Grupo', asiento: 'Asiento', nombres: 'Nombres', apellidos: 'Apellidos', carrera: 'Carrera', rut: 'RUT', institucion: 'Institución' }).map(([key, label]) => (
                    <option key={key} value={key}>{columnasVisibles[key] ? '❌' : '✅'} {label}</option>
                  ))}
                  <option value="mostrar-todas">🔄 Todas</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <PaginationControls />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-st-verde text-white">
              <tr>
                {columnasVisibles.estado && <th className="py-3 px-4 text-center font-semibold">Estado</th>}
                {columnasVisibles.rut && <th className="py-3 px-4 text-left font-semibold">RUT</th>}
                {columnasVisibles.nombres && (
                  <th className="py-3 px-4 text-left font-semibold cursor-pointer hover:bg-[#004b30] transition-colors" onClick={() => handleOrdenarPor('nombre')}>
                    <div className="flex items-center gap-2">
                      Nombres
                      {ordenCampo === 'nombre' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d={ordenAlfabetico === 'asc' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                {columnasVisibles.apellidos && (
                  <th className="py-3 px-4 text-left font-semibold cursor-pointer hover:bg-[#004b30] transition-colors" onClick={() => handleOrdenarPor('apellidos')}>
                    <div className="flex items-center gap-2">
                      Apellidos
                      {ordenCampo === 'apellidos' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d={ordenAlfabetico === 'asc' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                {columnasVisibles.asiento && <th className="py-3 px-4 text-center font-semibold">Asiento</th>}
                {columnasVisibles.grupo && <th className="py-3 px-4 text-center font-semibold">Grupo</th>}
                {columnasVisibles.carrera && <th className="py-3 px-4 text-left font-semibold">Carrera</th>}
                {columnasVisibles.institucion && <th className="py-3 px-4 text-left font-semibold">Institución</th>}
                {esAdmin && <th className="py-3 px-4 text-center font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {alumnosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(columnasVisibles).filter(Boolean).length + (esAdmin ? 1 : 0)} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-slate-500 font-medium">No hay participantes para mostrar</p>
                      <p className="text-slate-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alumnosOrdenados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((alumno, idx) => {
                  const uniqueKey = alumno.id ? `alumno-${alumno.id}` : `alumno-${alumno.rut}-${idx}`;
                  return (
                    <tr key={uniqueKey} className={`${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-green-50/50 transition-colors border-b border-slate-100`}>
                      {columnasVisibles.estado && (
                        <td className="py-3 px-4 text-center">
                          {alumno.presente ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              Presente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              Ausente
                            </span>
                          )}
                        </td>
                      )}
                      {columnasVisibles.rut && <td className="py-3 px-4 font-mono text-slate-700">{alumno.rut}</td>}
                      {columnasVisibles.nombres && (
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          <div className="truncate max-w-[150px]" title={alumno.nombres ?? alumno.nombre ?? '-'}>
                            {alumno.nombres ?? alumno.nombre ?? '-'}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.apellidos && (
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          <div className="truncate max-w-[150px]" title={alumno.apellidos ?? '-'}>
                            {alumno.apellidos ?? '-'}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.asiento && (
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {alumno.asiento ?? '-'}
                          </span>
                        </td>
                      )}
                      {columnasVisibles.grupo && (
                        <td className="py-3 px-4 text-center">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {alumno.grupo ?? '-'}
                          </span>
                        </td>
                      )}
                      {columnasVisibles.carrera && (
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          <div className="truncate max-w-[120px]" title={alumno.carrera ?? '-'}>{alumno.carrera ?? '-'}</div>
                        </td>
                      )}
                      {columnasVisibles.institucion && (
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          <div className="truncate max-w-[100px]" title={alumno.institucion ?? '-'}>{alumno.institucion ?? '-'}</div>
                        </td>
                      )}
                      {esAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleEditarClick(alumno)}
                            className="text-slate-400 hover:text-st-verde transition-colors p-1.5 rounded-lg hover:bg-green-50"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
        <PaginationControls />
      </div>

      {/* Edit Modal */}
      {alumnoAEditar && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-st-verde to-emerald-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Editar Participante</h3>
              <button onClick={() => setAlumnoAEditar(null)} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nombres</label>
                <input type="text" required value={editFormData.nombres} onChange={e => setEditFormData({ ...editFormData, nombres: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Apellidos</label>
                <input type="text" required value={editFormData.apellidos} onChange={e => setEditFormData({ ...editFormData, apellidos: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">RUT</label>
                <input type="text" required value={editFormData.rut} onChange={e => setEditFormData({ ...editFormData, rut: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all bg-slate-50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Carrera</label>
                <input type="text" value={editFormData.carrera} onChange={e => setEditFormData({ ...editFormData, carrera: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Institución</label>
                <select value={editFormData.institucion} onChange={e => setEditFormData({ ...editFormData, institucion: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all">
                  <option value="">Seleccionar...</option>
                  {INSTITUCIONES.map(inst => <option key={inst.value} value={inst.value}>{inst.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Grupo</label>
                <input type="text" value={editFormData.grupo} onChange={e => setEditFormData({ ...editFormData, grupo: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Asiento</label>
                <input type="text" value={editFormData.asiento} onChange={e => setEditFormData({ ...editFormData, asiento: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
              </div>
              <div className="sm:col-span-2 pt-4 flex gap-3 justify-end border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setAlumnoAEditar(null)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-st-verde text-white font-bold rounded-lg hover:bg-[#004b30] transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
      )}
    </div>
  );
};

export default AlumnosLista;
