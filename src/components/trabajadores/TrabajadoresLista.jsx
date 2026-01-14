import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';

const TrabajadoresLista = ({
  trabajadores = [],
  trabajadoresCompletos,
  soloPresentes,
  setSoloPresentes,
  filtroRUT,
  setFiltroRUT,
  onAgregarTrabajadores,
  onEliminarTrabajadores,
  updateTrabajador,
  esAdmin = false,
  eventoNombre = 'Evento',
  tipoEvento = 'trabajadores',
}) => {
  // Use trabajadoresCompletos for stats, fallback to trabajadores
  const trabajadoresParaStats = trabajadoresCompletos || trabajadores;

  // Local state for filters
  const [localRUT, setLocalRUT] = useState('');
  const [localObservacion, setLocalObservacion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const rut = filtroRUT !== undefined ? filtroRUT : localRUT;
  const setRUT = setFiltroRUT || setLocalRUT;

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
  }, [rut, localObservacion, soloPresentes, busqueda]);

  // Edit states
  const [trabajadorAEditar, setTrabajadorAEditar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleEditarClick = (trabajador) => {
    setEditFormData({
      nombres: trabajador.nombres || '',
      apellidos: trabajador.apellidos || '',
      nombre: trabajador.nombre || '',
      rut: trabajador.rut || '',
      observacion: trabajador.observacion || '',
    });
    setTrabajadorAEditar(trabajador);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!trabajadorAEditar || !updateTrabajador) return;

    setIsSaving(true);
    try {
      await updateTrabajador(trabajadorAEditar.eventoId, trabajadorAEditar.id, editFormData);
      setTrabajadorAEditar(null);
    } catch (error) {
      console.error('Error al actualizar trabajador:', error);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  // Detect which columns have data
  const columnasConDatos = useMemo(() => {
    if (trabajadores.length === 0) {
      return {
        estado: true, rut: true, nombres: true, apellidos: true,
        observacion: true, asiste: true,
      };
    }

    return {
      estado: true, // Always visible
      rut: trabajadores.some(t => t.rut != null && String(t.rut).trim() !== ''),
      nombres: trabajadores.some(t => (t.nombres != null && String(t.nombres).trim() !== '') || (t.nombre != null && String(t.nombre).trim() !== '')),
      apellidos: trabajadores.some(t => t.apellidos != null && String(t.apellidos).trim() !== ''),
      observacion: trabajadores.some(t => t.observacion != null && String(t.observacion).trim() !== ''),
      asiste: true, // Always visible
    };
  }, [trabajadores]);

  // Column visibility config
  const [columnasVisibles, setColumnasVisibles] = useState({
    estado: true,
    rut: true,
    nombres: true,
    apellidos: true,
    observacion: true,
    asiste: true,
  });

  // Sync visibility with presence of data
  useEffect(() => {
    if (trabajadores.length > 0) {
      setColumnasVisibles(columnasConDatos);
    }
  }, [columnasConDatos, trabajadores.length]);

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
      rut: true,
      nombres: true,
      apellidos: true,
      observacion: true,
      asiste: true,
    });
  }

  // Statistics
  const totalPresentes = trabajadoresParaStats.filter(t => t.presente).length;
  const totalAusentes = trabajadoresParaStats.filter(t => !t.presente).length;
  const totalConfirmados = trabajadoresParaStats.filter(t => t.asiste).length;

  // Filtering
  const trabajadoresFiltrados = useMemo(() => {
    return trabajadores.filter(trabajador => {
      let cumpleFiltro = true;

      // Filter by attendance status
      if (soloPresentes === 'presentes') {
        cumpleFiltro = trabajador.presente;
      } else if (soloPresentes === 'ausentes') {
        cumpleFiltro = !trabajador.presente;
      } else if (soloPresentes === 'confirmados') {
        cumpleFiltro = trabajador.asiste;
      }

      // Unified search (RUT, Nombres, Apellidos)
      const busquedaLower = busqueda.toLowerCase();
      const cumpleBusqueda =
        !busquedaLower ||
        trabajador.rut.toLowerCase().includes(busquedaLower) ||
        (trabajador.nombres ?? trabajador.nombre ?? '').toLowerCase().includes(busquedaLower) ||
        (trabajador.apellidos ?? '').toLowerCase().includes(busquedaLower);

      // Advanced filters
      const cumpleRut = !rut || trabajador.rut.toLowerCase().startsWith(rut.toLowerCase());
      const cumpleObservacion =
        !localObservacion ||
        (trabajador.observacion ?? '').toLowerCase().includes(localObservacion.toLowerCase());

      return cumpleFiltro && cumpleBusqueda && cumpleRut && cumpleObservacion;
    });
  }, [trabajadores, soloPresentes, rut, localObservacion, busqueda]);

  const trabajadoresOrdenados = useMemo(() => {
    return [...trabajadoresFiltrados].sort((a, b) => {
      let campoA, campoB;
      if (ordenCampo === 'apellidos') {
        campoA = (a.apellidos ?? (a.nombre ? a.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
        campoB = (b.apellidos ?? (b.nombre ? b.nombre.split(' ').slice(1).join(' ') : '')).toLowerCase();
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
  }, [trabajadoresFiltrados, ordenCampo, ordenAlfabetico]);

  // Pagination
  const totalPaginas = Math.max(1, Math.ceil(trabajadoresOrdenados.length / itemsPerPage));
  const paginaActual = Math.min(currentPage, totalPaginas);
  const trabajadoresPagina = useMemo(() => {
    const start = (paginaActual - 1) * itemsPerPage;
    return trabajadoresOrdenados.slice(start, start + itemsPerPage);
  }, [trabajadoresOrdenados, paginaActual, itemsPerPage]);

  // Excel Export Function
  const exportarAExcel = (datos, nombreEvento, tipoEvento, filtro) => {
    let datosFiltrados = datos;
    let sufijo = '';

    if (filtro === 'presentes') {
      datosFiltrados = datos.filter(t => t.presente);
      sufijo = '_Presentes';
    } else if (filtro === 'ausentes') {
      datosFiltrados = datos.filter(t => !t.presente);
      sufijo = '_Ausentes';
    }

    const datosExcel = datosFiltrados.map(t => {
      const fila = {};
      if (columnasVisibles.rut) fila['RUT'] = t.rut || '';
      if (columnasVisibles.nombres) fila['Nombres'] = t.nombres || t.nombre || '';
      if (columnasVisibles.apellidos) fila['Apellidos'] = t.apellidos || '';
      if (columnasVisibles.observacion) fila['Observación'] = t.observacion || '';
      if (columnasVisibles.estado) fila['Estado'] = t.presente ? 'Presente' : 'Ausente';
      if (columnasVisibles.asiste) fila['Confirmación Previa'] = t.asiste ? 'Sí' : 'No';
      return fila;
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionarios');

    const fileName = `${nombreEvento || 'Evento'}_Funcionarios${sufijo}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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
          {itemsPerPage * (currentPage - 1) + 1}-{Math.min(itemsPerPage * currentPage, trabajadoresOrdenados.length)} de {trabajadoresOrdenados.length}
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
            <span className="text-xs font-bold text-slate-500">{Math.max(1, totalPaginas)}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPaginas, p + 1))}
            disabled={currentPage >= totalPaginas}
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
      {/* Statistics Cards */}
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
            <p className={`text-2xl font-bold leading-none mb-1 ${soloPresentes === '' ? 'text-white' : 'text-slate-800'}`}>{trabajadoresParaStats.length}</p>
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

        <button
          onClick={() => setSoloPresentes && setSoloPresentes('confirmados')}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${soloPresentes === 'confirmados' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soloPresentes === 'confirmados' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-2xl font-bold leading-none mb-1 ${soloPresentes === 'confirmados' ? 'text-white' : 'text-slate-800'}`}>{totalConfirmados}</p>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${soloPresentes === 'confirmados' ? 'text-white/70' : 'text-slate-400'}`}>Confirmados</p>
          </div>
        </button>
      </div>

      {/* Optimized Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-row items-center gap-2 md:gap-3">
          {/* Unified Search Bar */}
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              placeholder="Buscar por RUT, nombres o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-st-verde focus:border-transparent transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className="flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-5 py-2.5 md:py-3 rounded-2xl font-bold text-sm bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm shrink-0"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden md:inline text-xs md:text-sm">Filtros</span>
            {(rut || localObservacion) && (
              <span className="hidden md:inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-st-verde rounded-full">
                {[rut, localObservacion].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Export Button */}
          <div className="relative shrink-0">
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
                  onClick={() => { exportarAExcel(trabajadoresParaStats, eventoNombre, tipoEvento, ''); setExportDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-st-verde"></div>
                  Todos ({trabajadoresParaStats.length})
                </button>
                <button
                  onClick={() => { exportarAExcel(trabajadoresParaStats, eventoNombre, tipoEvento, 'presentes'); setExportDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-st-verde"></div>
                  Presentes ({totalPresentes})
                </button>
                <button
                  onClick={() => { exportarAExcel(trabajadoresParaStats, eventoNombre, tipoEvento, 'ausentes'); setExportDropdownOpen(false); }}
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

      {/* Advanced Filters */}
      {filtrosAbiertos && (
        <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-top-2 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Observación</label>
              <input
                type="text"
                placeholder="Buscar observación..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm"
                value={localObservacion}
                onChange={(e) => setLocalObservacion(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Columnas</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm  focus:outline-none focus:ring-4 focus:ring-st-verde/10 focus:border-st-verde transition-all shadow-sm appearance-none cursor-pointer"
                value=""
                onChange={(e) => {
                  if (e.target.value === 'mostrar-todas') {
                    mostrarTodasLasColumnas();
                  } else if (e.target.value) {
                    toggleColumna(e.target.value);
                  }
                  e.target.value = '';
                }}
              >
                <option value="">Configurar...</option>
                {Object.entries({
                  estado: 'Estado',
                  rut: 'RUT',
                  nombres: 'Nombres',
                  apellidos: 'Apellidos',
                  asiste: 'Confirmación',
                  observacion: 'Observación',
                }).map(([key, label]) => (
                  <option key={key} value={key}>
                    {columnasVisibles[key] ? '❌' : '✅'} {label}
                  </option>
                ))}
                <option value="mostrar-todas">🔄 Todas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setRUT('');
                setLocalObservacion('');
                setBusqueda('');
                if (setSoloPresentes) setSoloPresentes('');
                mostrarTodasLasColumnas();
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-300 text-sm hover:bg-slate-200 transition-all flex items-center gap-2 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <PaginationControls />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-st-verde text-white">
              <tr>
                {columnasVisibles.asiste && (
                  <th className="py-4 px-4 text-center font-semibold min-w-24">
                    Confirmación
                  </th>
                )}
                {columnasVisibles.estado && (
                  <th className="py-4 px-4 text-center font-semibold min-w-28">
                    Estado
                  </th>
                )}
                {esAdmin && <th className="py-4 px-4 text-center font-semibold min-w-20">Acciones</th>}
                {columnasVisibles.rut && (
                  <th className="py-4 px-4 text-left font-semibold min-w-32">
                    RUT
                  </th>
                )}
                {columnasVisibles.nombres && (
                  <th
                    className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-[#004b30] transition-colors min-w-36 flex-1"
                    onClick={() => handleOrdenarPor('nombre')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Nombres</span>
                      {ordenCampo === 'nombre' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d={ordenAlfabetico === 'asc' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                {columnasVisibles.apellidos && (
                  <th
                    className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-[#004b30] transition-colors min-w-36 flex-1"
                    onClick={() => handleOrdenarPor('apellidos')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Apellidos</span>
                      {ordenCampo === 'apellidos' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d={ordenAlfabetico === 'asc' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                {columnasVisibles.observacion && (
                  <th className="py-4 px-4 text-left font-semibold min-w-36">
                    Observación
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {trabajadoresPagina.length === 0 ? (
                <tr>
                  <td
                    colSpan={Object.values(columnasVisibles).filter(Boolean).length}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="text-center">
                        <div className="text-slate-500 font-semibold text-lg mb-1">
                          Sin funcionarios encontrados
                        </div>
                        <div className="text-slate-400 text-sm">
                          No hay funcionarios que coincidan con los filtros aplicados
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                trabajadoresPagina.map((trabajador, idx) => (
                  <tr
                    key={trabajador.rut}
                    className={`${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-st-pastel transition-colors border-b border-slate-100 ${trabajador.asiste ? 'border-l-4 border-l-st-verde' : 'border-l-4 border-l-gray-300'}`}
                  >
                    {columnasVisibles.asiste && (
                      <td className="py-4 px-4 text-center">
                        <div
                          className={`w-3 h-3 rounded-full mx-auto transition-transform hover:scale-110 ${trabajador.asiste ? 'bg-st-verde shadow-st-verde/30 shadow-md' : 'bg-gray-300'}`}
                          title={trabajador.asiste ? '✅ Confirma asistencia previa' : '❌ No confirma asistencia previa'}
                        ></div>
                      </td>
                    )}
                    {columnasVisibles.estado && (
                      <td className="py-4 px-4 text-center">
                        {trabajador.presente ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-st-verde border border-st-verde/30">
                            <div className="w-2 h-2 bg-st-verde rounded-full"></div>
                            Presente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Ausente
                          </span>
                        )}
                      </td>
                    )}
                    {columnasVisibles.rut && (
                      <td className="py-4 px-4 font-mono text-slate-700">
                        {trabajador.rut}
                      </td>
                    )}
                    {columnasVisibles.nombres && (
                      <td className="py-4 px-4 text-slate-800 font-medium">
                        <div className="truncate uppercase" title={trabajador.nombres ?? trabajador.nombre ?? '-'}>
                          {trabajador.nombres ?? trabajador.nombre ?? '-'}
                        </div>
                      </td>
                    )}
                    {columnasVisibles.apellidos && (
                      <td className="py-4 px-4 text-slate-800 font-medium">
                        <div className="truncate uppercase" title={trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}>
                          {trabajador.apellidos ?? (trabajador.nombre ? trabajador.nombre.split(' ').slice(1).join(' ') : '-')}
                        </div>
                      </td>
                    )}
                    {columnasVisibles.observacion && (
                      <td className="py-4 px-4 text-slate-700">
                        <div className="truncate max-w-xs" title={trabajador.observacion ?? '-'}>
                          {trabajador.observacion ?? '-'}
                        </div>
                      </td>
                    )}
                    {esAdmin && (
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleEditarClick(trabajador)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls />
      </div>

      {/* Edit Modal */}
      {trabajadorAEditar && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-st-verde px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-white">Editar Funcionario</h3>
              <button onClick={() => setTrabajadorAEditar(null)} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-1">
              {/* RUT - Always visible */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">RUT</label>
                <input type="text" required value={editFormData.rut} onChange={e => setEditFormData({ ...editFormData, rut: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all bg-slate-50" />
              </div>

              {/* Nombres */}
              {columnasVisibles.nombres && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nombres</label>
                  <input type="text" value={editFormData.nombres} onChange={e => setEditFormData({ ...editFormData, nombres: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                </div>
              )}

              {/* Apellidos */}
              {columnasVisibles.apellidos && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Apellidos</label>
                  <input type="text" value={editFormData.apellidos} onChange={e => setEditFormData({ ...editFormData, apellidos: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all" />
                </div>
              )}

              {/* Observación */}
              {columnasVisibles.observacion && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Observación</label>
                  <textarea value={editFormData.observacion} onChange={e => setEditFormData({ ...editFormData, observacion: e.target.value })} rows={3} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-st-verde focus:border-transparent outline-none transition-all resize-none" />
                </div>
              )}

              <div className="sm:col-span-2 pt-4 flex gap-3 justify-end border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setTrabajadorAEditar(null)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
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

export default TrabajadoresLista;
