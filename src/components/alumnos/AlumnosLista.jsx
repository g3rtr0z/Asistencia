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
  const [busqueda, setBusqueda] = useState('');

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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [carrera, institucion, grupo, rut, numeroLista, asiento, nombres, apellidos, soloPresentes, busqueda]);

  // Edit states
  const [alumnoAEditar, setAlumnoAEditar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleEditarClick = (alumno) => {
    setEditFormData({
      nombres: alumno.nombres || '',
      apellidos: alumno.apellidos || '',
      nombre: alumno.nombre || '', // Cargar nombre completo
      rut: alumno.rut || '',
      carrera: alumno.carrera || '',
      institucion: alumno.institucion || '',
      numeroLista: alumno.numeroLista || '',
      grupo: alumno.grupo || '',
      asiento: alumno.asiento || '',
      // Guardar datos originales para sincronización en alumnosService
      originalData: {
        nombres: alumno.nombres,
        apellidos: alumno.apellidos,
        nombre: alumno.nombre
      }
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

  // Detect which columns have data - Hide empty columns but keep basic ones
  const columnasConDatos = useMemo(() => {
    if (alumnos.length === 0) {
      return {
        estado: true, rut: true, nombres: true, apellidos: true,
        carrera: true, institucion: true, numeroLista: true,
        grupo: true, asiento: true,
      };
    }

    return {
      estado: true, // Siempre visible
      rut: alumnos.some(a => a.rut != null && String(a.rut).trim() !== ''),
      nombres: alumnos.some(a => (a.nombres != null && String(a.nombres).trim() !== '') || (a.nombre != null && String(a.nombre).trim() !== '')),
      apellidos: alumnos.some(a => a.apellidos != null && String(a.apellidos).trim() !== ''),
      carrera: alumnos.some(a => a.carrera != null && String(a.carrera).trim() !== ''),
      institucion: alumnos.some(a => a.institucion != null && String(a.institucion).trim() !== ''),
      numeroLista: alumnos.some(a => a.numeroLista != null && String(a.numeroLista).trim() !== ''),
      grupo: alumnos.some(a => a.grupo != null && String(a.grupo).trim() !== ''),
      asiento: alumnos.some(a => a.asiento != null && String(a.asiento).trim() !== ''),
    };
  }, [alumnos]);

  // Column visibility config
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    rut: true,
    nombres: true,
    apellidos: true,
    carrera: true,
    institucion: true,
    numeroLista: true,
    asiento: false,
    grupo: false,
  });

  // Sync visibility with presence of data
  useEffect(() => {
    if (alumnos.length > 0) {
      setColumnasVisibles(columnasConDatos);
    }
  }, [columnasConDatos, alumnos.length]);

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
      estado: true, rut: true, nombres: true, apellidos: true,
      carrera: true, institucion: true, numeroLista: true,
      asiento: true, grupo: true,
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
    setBusqueda('');
    if (setSoloPresentes) setSoloPresentes('');
    // No llamamos a mostrarTodasLasColumnas() para mantener la visibilidad basada en datos
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
      const searchLower = busqueda.toLowerCase();
      const cumpleBusqueda = !busqueda ||
        (alumno.rut && alumno.rut.toLowerCase().startsWith(searchLower)) ||
        (alumno.nombres && alumno.nombres.toLowerCase().includes(searchLower)) ||
        (alumno.nombre && alumno.nombre.toLowerCase().includes(searchLower)) ||
        (alumno.apellidos && alumno.apellidos.toLowerCase().includes(searchLower));

      const cumplePresente = !soloPresentes || (soloPresentes === 'presentes' ? alumno.presente : !alumno.presente);
      const cumpleCarrera = !carrera || alumno.carrera === carrera;
      const cumpleRut = !rut || alumno.rut.toLowerCase().startsWith(rut.toLowerCase());
      const cumpleInstitucion = !institucion || alumno.institucion === institucion;
      const grupoAlumno = alumno.grupo ? String(alumno.grupo).trim() : '';
      const grupoFiltro = grupo ? String(grupo).trim() : '';
      const cumpleGrupo = !grupoFiltro || grupoAlumno === grupoFiltro;
      const cumpleAsiento = !asiento || String(alumno.asiento).trim() === String(asiento).trim();
      const cumpleNombres = !nombres || (alumno.nombres && alumno.nombres.toLowerCase().includes(nombres.toLowerCase())) || (alumno.nombre && alumno.nombre.toLowerCase().includes(nombres.toLowerCase()));
      const cumpleApellidos = !apellidos || (alumno.apellidos && alumno.apellidos.toLowerCase().includes(apellidos.toLowerCase()));
      return cumpleBusqueda && cumplePresente && cumpleCarrera && cumpleRut && cumpleInstitucion && cumpleGrupo && cumpleAsiento && cumpleNombres && cumpleApellidos;
    });
  }, [alumnos, soloPresentes, carrera, rut, institucion, grupo, asiento, nombres, apellidos, busqueda]);

  // Sorted students
  const alumnosOrdenados = useMemo(() => {
    return [...alumnosFiltrados].sort((a, b) => {
      let campoA, campoB;
      if (ordenCampo === 'apellidos') {
        campoA = (a.apellidos ?? (a.nombre ? a.nombre.split(' ').slice(1).join(' ') : '')).trim().toLowerCase();
        campoB = (b.apellidos ?? (b.nombre ? b.nombre.split(' ').slice(1).join(' ') : '')).trim().toLowerCase();
      } else {
        campoA = (a.nombres ?? a.nombre ?? '').trim().toLowerCase();
        campoB = (b.nombres ?? b.nombre ?? '').trim().toLowerCase();
      }
      return ordenAlfabetico === 'asc'
        ? campoA.localeCompare(campoB, 'es', { sensitivity: 'accent' })
        : campoB.localeCompare(campoA, 'es', { sensitivity: 'accent' });
    });
  }, [alumnosFiltrados, ordenCampo, ordenAlfabetico]);

  // Stats - use alumnosParaStats so they don't change when filtering
  const totalPresentes = alumnosParaStats.filter(a => a.presente).length;
  const totalAusentes = alumnosParaStats.filter(a => !a.presente).length;

  // Pagination component
  const PaginationControls = () => (
    <div className="px-4 py-3 bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-200">
      <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
        <span className="hidden xs:inline">Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-st-verde"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="hidden sm:inline">por página</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 hidden md:inline">
          {itemsPerPage * (currentPage - 1) + 1}-{Math.min(itemsPerPage * currentPage, alumnosOrdenados.length)} de {alumnosOrdenados.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors text-slate-600 border border-transparent hover:border-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-xs font-bold text-st-verde">{currentPage}</span>
            <span className="text-xs font-medium text-slate-400 mx-1">/</span>
            <span className="text-xs font-bold text-slate-500">{Math.max(1, Math.ceil(alumnosOrdenados.length / itemsPerPage))}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(alumnosOrdenados.length / itemsPerPage), p + 1))}
            disabled={currentPage >= Math.ceil(alumnosOrdenados.length / itemsPerPage)}
            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors text-slate-600 border border-transparent hover:border-slate-200"
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
      {/* Tarjetas de Estadísticas Simplificadas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setSoloPresentes && setSoloPresentes('')}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${soloPresentes === '' ? 'bg-st-verde text-white border-st-verde shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soloPresentes === '' ? 'bg-white/20' : 'bg-st-pastel text-st-verde'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-2xl font-bold leading-none mb-1 ${soloPresentes === '' ? 'text-white' : 'text-slate-800'}`}>{alumnosParaStats.length}</p>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${soloPresentes === '' ? 'text-white/70' : 'text-slate-400'}`}>Total</p>
          </div>
        </button>

        <button
          onClick={() => setSoloPresentes && setSoloPresentes('presentes')}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${soloPresentes === 'presentes' ? 'bg-st-verde text-white border-st-verde shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soloPresentes === 'presentes' ? 'bg-white/20' : 'bg-st-pastel text-st-verde'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-2xl font-bold leading-none mb-1 ${soloPresentes === 'presentes' ? 'text-white' : 'text-slate-800'}`}>{totalPresentes}</p>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${soloPresentes === 'presentes' ? 'text-white/70' : 'text-slate-400'}`}>Presentes</p>
          </div>
        </button>

        <button
          onClick={() => setSoloPresentes && setSoloPresentes('ausentes')}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${soloPresentes === 'ausentes' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soloPresentes === 'ausentes' ? 'bg-white/20' : 'bg-rose-50 text-rose-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-2xl font-bold leading-none mb-1 ${soloPresentes === 'ausentes' ? 'text-white' : 'text-slate-800'}`}>{totalAusentes}</p>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${soloPresentes === 'ausentes' ? 'text-white/70' : 'text-slate-400'}`}>Ausentes</p>
          </div>
        </button>

        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{[...new Set(alumnosParaStats.map(a => a.institucion))].length}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Instituciones</p>
          </div>
        </div>
      </div>

      {/* Toolbar Unificado */}
      <div className="flex flex-row items-center gap-2 md:gap-4 mb-6">
        <div className="flex-1 min-w-0 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-st-verde transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 md:pl-11 pr-4 py-2.5 md:py-3 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className={`flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-5 py-2.5 md:py-3 rounded-2xl font-bold text-sm transition-all border ${filtrosAbiertos ? 'bg-st-verde text-white border-st-verde shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
            title="Filtros"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span className="hidden md:inline text-xs md:text-sm">Filtros</span>
            {alumnosFiltrados.length !== alumnos.length && (
              <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${filtrosAbiertos ? 'bg-white/20' : 'bg-st-verde text-white'}`}>
                {alumnosFiltrados.length}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-2xl font-bold text-sm bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              title="Exportar"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline text-xs md:text-sm">Exportar</span>
              <svg className={`hidden md:block w-4 h-4 text-slate-400 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20">
                <p className='px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1'>Formato Excel</p>
                <button
                  onClick={() => { exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, ''); setExportDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-st-verde"></div>
                  Todos ({alumnosParaStats.length})
                </button>
                <button
                  onClick={() => { exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, 'presentes'); setExportDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Presentes ({totalPresentes})
                </button>
                <button
                  onClick={() => { exportarAExcel(alumnosParaStats, eventoNombre, tipoEvento, 'ausentes'); setExportDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  Ausentes ({totalAusentes})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros Expandidos Simplificados */}
      {filtrosAbiertos && (
        <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-top-2 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Carrera / Área</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                  value={carrera}
                  onChange={e => setCarrera(e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {Object.entries(carrerasPorInstitucion).map(([inst, carreras]) => (
                    <optgroup key={inst} label={getInstitucionLabel(inst)}>
                      {carreras.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Institución</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                  value={institucion}
                  onChange={e => setInstitucion(e.target.value)}
                >
                  <option value="">Cualquier institución</option>
                  {opcionesInstituciones.map(inst => (
                    <option key={inst} value={inst}>{getInstitucionLabel(inst)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {columnasConDatos.grupo && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Grupo</label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                    value={grupo}
                    onChange={e => setGrupo(e.target.value)}
                  >
                    <option value="">Todos los grupos</option>
                    {gruposUnicos.map(gr => <option key={gr} value={gr}>{gr}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {columnasConDatos.asiento && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Asiento</label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                    value={asiento}
                    onChange={e => setAsiento(e.target.value)}
                  >
                    <option value="">Todos los asientos</option>
                    {asientosUnicos.map(as => <option key={as} value={as}>{as}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Visualización</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                  value=""
                  onChange={e => {
                    if (e.target.value === 'mostrar-todas') mostrarTodasLasColumnas();
                    else if (e.target.value) toggleColumna(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">Configurar columnas...</option>
                  {Object.entries({
                    estado: 'Estado', rut: 'RUT', nombres: 'Nombres', apellidos: 'Apellidos',
                    carrera: 'Carrera', institucion: 'Institución', numeroLista: 'N° de Lista',
                    grupo: 'Grupo', asiento: 'Asiento'
                  }).map(([key, label]) => (
                    <option key={key} value={key}>{columnasVisibles[key] ? '❌ Ocultar' : '✅ Mostrar'} {label}</option>
                  ))}
                  <option value="mostrar-todas" className="font-bold border-t border-slate-100 mt-1">🔄 Restaurar todas</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar todos los filtros
            </button>
          </div>
        </div>
      )}

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
                {columnasVisibles.carrera && <th className="py-3 px-4 text-left font-semibold">Carrera</th>}
                {columnasVisibles.institucion && <th className="py-3 px-4 text-left font-semibold">Institución</th>}
                {columnasVisibles.numeroLista && <th className="py-3 px-4 text-center font-semibold text-xs leading-tight">N° de<br />Lista</th>}
                {columnasVisibles.asiento && <th className="py-3 px-4 text-center font-semibold">Asiento</th>}
                {columnasVisibles.grupo && <th className="py-3 px-4 text-center font-semibold">Grupo</th>}
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-st-verde/10 text-st-verde">
                              <div className="w-1.5 h-1.5 bg-st-verde rounded-full"></div>
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
                      {columnasVisibles.numeroLista && (
                        <td className="py-3 px-4 text-center">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {alumno.numeroLista ?? '-'}
                          </span>
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
      {
        alumnoAEditar && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-st-verde px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold text-white">Editar Participante</h3>
                <button onClick={() => setAlumnoAEditar(null)} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGuardarEdicion} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-1">
                {/* RUT - Always visible as it's the identifier */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">RUT</label>
                  <input type="text" required value={editFormData.rut} onChange={e => setEditFormData({ ...editFormData, rut: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all bg-slate-50" />
                </div>

                {/* Nombres - Only if visible */}
                {columnasVisibles.nombres && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nombres</label>
                    <input type="text" value={editFormData.nombres} onChange={e => setEditFormData({ ...editFormData, nombres: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

                {/* Apellidos - Only if visible */}
                {columnasVisibles.apellidos && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Apellidos</label>
                    <input type="text" value={editFormData.apellidos} onChange={e => setEditFormData({ ...editFormData, apellidos: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

                {/* Carrera - Only if visible */}
                {columnasVisibles.carrera && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Carrera</label>
                    <input type="text" value={editFormData.carrera} onChange={e => setEditFormData({ ...editFormData, carrera: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

                {/* Institución - Only if visible */}
                {columnasVisibles.institucion && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Institución</label>
                    <select value={editFormData.institucion} onChange={e => setEditFormData({ ...editFormData, institucion: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all">
                      <option value="">Seleccionar...</option>
                      {INSTITUCIONES.map(inst => <option key={inst.value} value={inst.value}>{inst.label}</option>)}
                    </select>
                  </div>
                )}

                {/* N° de Lista - Only if visible */}
                {columnasVisibles.numeroLista && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">N° de Lista</label>
                    <input type="text" value={editFormData.numeroLista} onChange={e => setEditFormData({ ...editFormData, numeroLista: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

                {/* Grupo - Only if visible */}
                {columnasVisibles.grupo && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Grupo</label>
                    <input type="text" value={editFormData.grupo} onChange={e => setEditFormData({ ...editFormData, grupo: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

                {/* Asiento - Only if visible */}
                {columnasVisibles.asiento && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Asiento</label>
                    <input type="text" value={editFormData.asiento} onChange={e => setEditFormData({ ...editFormData, asiento: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                  </div>
                )}

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
        )
      }
    </div >
  );
};

export default AlumnosLista;
