import React, { useState, useEffect, useRef } from 'react';
import AlumnosLista from '../alumnos/AlumnosLista';
import EstadisticasPanel from '../alumnos/EstadisticasPanel';
import EventosPanel from '../eventos/EventosPanel';
import EventoActivoInfo from '../eventos/EventoActivoInfo';
import EventoInfo from '../eventos/EventoInfo';
import {
  agregarAlumno,
  deleteAlumnoPorRut,
  importarAlumnosDesdeExcel,
} from '../../services/alumnosService';
import useEventos from '../../hooks/useEventos';
import useAlumnosEvento from '../../hooks/useAlumnosEvento';
import TrabajadoresLista from '../trabajadores/TrabajadoresLista';
import TrabajadoresResumen from '../trabajadores/TrabajadoresResumen';

function AdminPanel({ onSalir }) {
  const [tab, setTab] = useState('eventos');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState('add');
  const deleteFormRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hook para eventos
  const {
    eventos,
    eventoActivo,
  } = useEventos();

  // Hook para alumnos del evento activo
  const {
    alumnos,
  } = useAlumnosEvento();

  // Estado para agregar/eliminar alumnos
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    carrera: '',
    institucion: '',
    asiento: '',
    grupo: '',
    departamento: '',
    observacion: '',
  });
  const [rutEliminar, setRutEliminar] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Filtros globales para sincronizar con AlumnosLista y EstadisticasPanel
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [soloPresentes, setSoloPresentes] = useState('');

  // Filtrado simplificado
  const alumnosFiltrados = alumnos.filter(alumno => {
    const cumpleCarrera = !filtroCarrera || alumno.carrera === filtroCarrera;
    const cumpleInstitucion =
      !filtroInstitucion || alumno.institucion === filtroInstitucion;
    const cumpleGrupo =
      !filtroGrupo || Number(alumno.grupo) === Number(filtroGrupo);
    const cumplePresente =
      !soloPresentes ||
      (soloPresentes === 'presentes' ? alumno.presente : !alumno.presente);

    return cumpleCarrera && cumpleInstitucion && cumpleGrupo && cumplePresente;
  });

  const esEventoTrabajadores = eventoActivo?.tipo === 'trabajadores';

  async function handleAgregarAlumno(e) {
    e.preventDefault();
    try {
      const payload = {
        nombres: nuevoAlumno.nombres,
        apellidos: nuevoAlumno.apellidos,
        nombre: `${nuevoAlumno.nombres} ${nuevoAlumno.apellidos}`.trim(),
        rut: nuevoAlumno.rut,
      };

      if (esEventoTrabajadores) {
        payload.departamento = nuevoAlumno.departamento;
        payload.observacion = nuevoAlumno.observacion;
      } else {
        payload.carrera = nuevoAlumno.carrera;
        payload.institucion = nuevoAlumno.institucion;
        payload.asiento = nuevoAlumno.asiento;
        payload.grupo = nuevoAlumno.grupo;
      }

      await agregarAlumno(payload, eventoActivo?.id); // Pasar el eventoId
      setMensajeAdmin('Alumno agregado correctamente');
      setNuevoAlumno({
        nombres: '',
        apellidos: '',
        rut: '',
        carrera: '',
        institucion: '',
        asiento: '',
        grupo: '',
        departamento: '',
        observacion: '',
      });
    } catch (err) {
      console.error(err);
      setMensajeAdmin(`Error al agregar: ${err.message}`);
    }
  }

  async function handleEliminarAlumno(e) {
    e.preventDefault();
    try {
      await deleteAlumnoPorRut(rutEliminar);
      setMensajeAdmin('Alumno eliminado correctamente');
      setRutEliminar('');
    } catch (_err) {
      setMensajeAdmin('Error al eliminar alumno');
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setMensajeAdmin('Procesando archivo...');
      if (!eventoActivo) {
        setMensajeAdmin('Error: No hay evento activo');
        return;
      }

      await importarAlumnosDesdeExcel(
        file,
        eventoActivo.id,
        eventoActivo.tipo
      );

      setMensajeAdmin('Datos importados correctamente');
      // Limpiar input
      e.target.value = '';
    } catch (error) {
      console.error(error);
      setMensajeAdmin(`Error: ${error.message}`);
      e.target.value = '';
    }
  }

  useEffect(() => {
    if (
      showAdminModal &&
      adminModalMode === 'delete' &&
      deleteFormRef.current
    ) {
      deleteFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [showAdminModal, adminModalMode]);

  const abrirModalAgregar = () => {
    setAdminModalMode('add');
    setShowAdminModal(true);
  };

  const abrirModalEliminar = () => {
    setAdminModalMode('delete');
    setShowAdminModal(true);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Renderizado del contenido principal según la pestaña
  const renderContent = () => {
    if (tab === 'eventos') {
      return (
        <EventosPanel
          eventos={eventos}
          eventoActivo={eventoActivo}
        />
      );
    }

    if (tab === 'alumnos') {
      const esEventoTrabajadores = eventoActivo?.tipo === 'trabajadores';
      return (
        <div className='space-y-8'>
          {eventoActivo ? (
            esEventoTrabajadores ? (
              <>
                <EventoInfo
                  eventoActivo={eventoActivo}
                  totalAlumnos={alumnos.length}
                  alumnos={alumnos}
                />

                {/* Toolbar Minimalista */}
                <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-slate-200'>
                  <div>
                    <h3 className='text-xl font-bold text-slate-800'>Funcionarios</h3>
                    <p className='text-sm text-slate-500 mt-1'>Gestión de nómina y asistencia</p>
                  </div>
                  <div className='flex items-center gap-3 w-full sm:w-auto'>
                    <button
                      onClick={abrirModalAgregar}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-st-verde text-white rounded-lg hover:bg-st-verde/90 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Nuevo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      Importar
                    </button>
                    <button
                      onClick={abrirModalEliminar}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Eliminar
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <TrabajadoresResumen
                    trabajadores={alumnos}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    trabajadoresCompletos={alumnos}
                    eventoActivo={eventoActivo}
                  />
                  <TrabajadoresLista
                    trabajadores={alumnos}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                  />
                </div>
              </>
            ) : (
              <>
                <EventoInfo
                  eventoActivo={eventoActivo}
                  totalAlumnos={alumnos.length}
                  alumnos={alumnosFiltrados}
                />

                {/* Toolbar Minimalista */}
                <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-slate-200'>
                  <div>
                    <h3 className='text-xl font-bold text-slate-800'>Lista de Alumnos</h3>
                    <p className='text-sm text-slate-500 mt-1'>Gestión de asistencia y participantes</p>
                  </div>
                  <div className='flex items-center gap-3 w-full sm:w-auto'>
                    <button
                      onClick={abrirModalAgregar}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-st-verde text-white rounded-lg hover:bg-st-verde/90 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Nuevo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      Importar
                    </button>
                    <button
                      onClick={abrirModalEliminar}
                      className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Eliminar
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <EstadisticasPanel
                    alumnos={alumnosFiltrados}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    alumnosCompletos={alumnos}
                    eventoActivo={eventoActivo}
                  />
                  <AlumnosLista
                    alumnos={alumnosFiltrados}
                    filtroCarrera={filtroCarrera}
                    setFiltroCarrera={setFiltroCarrera}
                    filtroInstitucion={filtroInstitucion}
                    setFiltroInstitucion={setFiltroInstitucion}
                    filtroGrupo={filtroGrupo}
                    setFiltroGrupo={setFiltroGrupo}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    onAgregarAlumnos={abrirModalAgregar}
                    onEliminarAlumnos={abrirModalEliminar}
                    esAdmin={true}
                  />
                </div>
              </>
            )
          ) : (
            <div className='flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-st-verde/30 min-h-[400px]'>
              <div className='w-20 h-20 bg-st-pastel rounded-full flex items-center justify-center mb-4'>
                <svg className="w-10 h-10 text-st-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <h3 className='text-xl font-bold text-slate-800 mb-2'>No hay evento seleccionado</h3>
              <p className='text-slate-500 max-w-sm mx-auto mb-6'>Selecciona o crea un evento desde el menú "Eventos" para comenzar a gestionar los participantes.</p>
              <button
                onClick={() => setTab('eventos')}
                className='px-6 py-3 bg-st-verde text-white rounded-xl hover:bg-st-verdeClaro transition shadow-lg shadow-st-verde/20 font-medium'
              >
                Ir a Mis Eventos
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className='min-h-screen w-full bg-slate-50 flex'>

      {/* Sidebar Desktop */}
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-st-verde text-white shadow-2xl z-20 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'
          }`}
      >
        <div className='p-4 flex flex-col gap-4'>
          {/* Header & Toggle */}
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className='flex items-center gap-3 overflow-hidden'>
                <div className='h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <span className='font-bold text-white text-sm'>ST</span>
                </div>
                <div className='whitespace-nowrap'>
                  <h1 className='text-sm font-bold leading-tight'>Panel Admin</h1>
                  <p className='text-white/60 text-[10px]'>Santo Tomás</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
            >
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <nav className='flex-1 px-3 space-y-2 mt-4'>
          <button
            onClick={() => setTab('eventos')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium ${tab === 'eventos'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${!sidebarOpen && 'justify-center'}`}
            title={!sidebarOpen ? 'Eventos' : ''}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Eventos
            </span>
          </button>

          <button
            onClick={() => setTab('alumnos')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium ${tab === 'alumnos'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${!sidebarOpen && 'justify-center'}`}
            title={!sidebarOpen ? 'Participantes' : ''}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Participantes
            </span>
          </button>
        </nav>

        <div className='p-3 mt-auto border-t border-white/10'>
          <button
            onClick={onSalir}
            className={`w-full flex items-center gap-3 px-3 py-3 text-red-100 hover:bg-white/10 rounded-lg transition text-sm font-medium ${!sidebarOpen && 'justify-center'}`}
            title={!sidebarOpen ? 'Cerrar Sesión' : ''}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 h-screen overflow-hidden flex flex-col'>
        {/* Mobile Header */}
        <header className='md:hidden h-16 bg-st-verde flex items-center justify-between px-4 text-white z-10'>
          <span className='font-bold text-lg'>Panel Admin</span>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className='p-2'>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className='md:hidden absolute top-16 left-0 right-0 bg-st-verde text-white p-4 shadow-xl z-50 rounded-b-2xl border-t border-white/10'
          >
            <nav className='flex flex-col gap-2'>
              <button onClick={() => { setTab('eventos'); setMobileMenuOpen(false); }} className={`p-3 rounded-lg text-left font-medium ${tab === 'eventos' ? 'bg-white text-st-verde' : 'text-white/80'}`}>Eventos</button>
              <button onClick={() => { setTab('alumnos'); setMobileMenuOpen(false); }} className={`p-3 rounded-lg text-left font-medium ${tab === 'alumnos' ? 'bg-white text-st-verde' : 'text-white/80'}`}>Participantes</button>
              <div className='h-px bg-white/20 my-2'></div>
              <button onClick={onSalir} className='p-3 text-red-200 text-left hover:bg-white/10 rounded-lg'>Cerrar Sesión</button>
            </nav>
          </div>
        )}

        {/* Content Scrollable */}
        <div className='flex-1 overflow-y-auto p-4 md:p-8'>
          <div className='max-w-[1400px] mx-auto'>
            {/* Header Simplified */}
            <div className='mb-8'>
              <h2 className='text-3xl font-bold text-slate-800 tracking-tight'>
                {tab === 'eventos' ? 'Mis Eventos' : (eventoActivo ? eventoActivo.nombre : 'Participantes')}
              </h2>
              <p className='text-slate-500 mt-1'>
                {tab === 'eventos' ? 'Administra tus eventos y monitorea su estado.' : 'Gestiona la asistencia y el registro de participantes.'}
              </p>
            </div>

            {renderContent()}
          </div>
        </div>
      </main>

      {/* Modal para agregar y eliminar alumnos */}
      {showAdminModal && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4'
        >
          <div
            className='bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col relative overflow-y-auto max-h-[90vh]'
          >
            <button
              onClick={() => setShowAdminModal(false)}
              className='absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition'
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className='mb-6'>
              <h3 className='text-lg font-bold text-slate-800'>
                {adminModalMode === 'delete' ? 'Eliminar Registro' : 'Nuevo Registro'}
              </h3>
              <p className='text-slate-500 text-sm mt-1'>
                {adminModalMode === 'delete'
                  ? 'Esta acción eliminará el participante del evento actual.'
                  : 'Ingresa los datos para añadir un participante manualmente.'}
              </p>
            </div>

            {adminModalMode === 'add' ? (
              <form
                className='flex flex-col gap-4'
                onSubmit={handleAgregarAlumno}
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Nombres</label>
                    <input
                      className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                      placeholder='Ej: Juan Andrés'
                      value={nuevoAlumno.nombres}
                      onChange={e => setNuevoAlumno(a => ({ ...a, nombres: e.target.value }))}
                      required
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Apellidos</label>
                    <input
                      className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                      placeholder='Ej: Pérez Gonzalez'
                      value={nuevoAlumno.apellidos}
                      onChange={e => setNuevoAlumno(a => ({ ...a, apellidos: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>RUT</label>
                  <input
                    className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                    placeholder='Ej: 12345678k'
                    value={nuevoAlumno.rut}
                    onChange={e => setNuevoAlumno(a => ({ ...a, rut: e.target.value }))}
                    required
                  />
                </div>

                {esEventoTrabajadores ? (
                  <>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Departamento</label>
                      <input
                        className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                        placeholder='Ej: RRHH'
                        value={nuevoAlumno.departamento}
                        onChange={e => setNuevoAlumno(a => ({ ...a, departamento: e.target.value }))}
                        required
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Observación</label>
                      <input
                        className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                        placeholder='Opcional'
                        value={nuevoAlumno.observacion}
                        onChange={e => setNuevoAlumno(a => ({ ...a, observacion: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Carrera</label>
                        <input
                          className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                          placeholder='Ej: Informática'
                          value={nuevoAlumno.carrera}
                          onChange={e => setNuevoAlumno(a => ({ ...a, carrera: e.target.value }))}
                          required
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Institución</label>
                        <input
                          className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                          placeholder='Ej: Santo Tomás'
                          value={nuevoAlumno.institucion}
                          onChange={e => setNuevoAlumno(a => ({ ...a, institucion: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Asiento</label>
                        <input
                          className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                          placeholder='Opcional'
                          value={nuevoAlumno.asiento}
                          onChange={e => setNuevoAlumno(a => ({ ...a, asiento: e.target.value }))}
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Grupo</label>
                        <input
                          className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-st-verde focus:bg-white focus:border-transparent transition outline-none'
                          placeholder='Opcional'
                          value={nuevoAlumno.grupo}
                          onChange={e => setNuevoAlumno(a => ({ ...a, grupo: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className='pt-4'>
                  <button
                    type='submit'
                    className='w-full bg-st-verde text-white h-10 rounded-lg font-medium hover:bg-st-verdeClaro transition-all'
                  >
                    Guardar Registro
                  </button>
                </div>
              </form>
            ) : (
              <form
                ref={deleteFormRef}
                className='flex flex-col gap-4'
                onSubmit={handleEliminarAlumno}
              >
                <div className='p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className='text-red-700 text-sm'>Esta acción es irreversible. Asegúrate de tener el RUT correcto.</p>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>RUT del alumno</label>
                  <input
                    className='w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent transition outline-none'
                    placeholder='Ej: 12345678k'
                    value={rutEliminar}
                    onChange={e => setRutEliminar(e.target.value)}
                    required
                  />
                </div>
                <button
                  type='submit'
                  className='w-full bg-red-600 text-white h-10 rounded-lg font-medium hover:bg-red-700 transition-all mt-2'
                >
                  Eliminar Definitivamente
                </button>
              </form>
            )}

            {mensajeAdmin && (
              <div className={`mt-4 px-4 py-2 rounded-lg text-sm text-center w-full ${mensajeAdmin.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {mensajeAdmin}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
