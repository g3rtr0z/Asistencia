import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import AlumnosLista from '../alumnos/AlumnosLista';
import EventosPanel from '../eventos/EventosPanel';
import EventoActivoInfo from '../eventos/EventoActivoInfo';
import {
  agregarAlumno,
  deleteAlumnoPorRut,
  importarAlumnosDesdeExcel,
} from '../../services/alumnosService';
import useEventos from '../../hooks/useEventos';
import useAlumnosEvento from '../../hooks/useAlumnosEvento';
import TrabajadoresLista from '../trabajadores/TrabajadoresLista';
import TrabajadoresResumen from '../trabajadores/TrabajadoresResumen';
import UsuariosPanel from './UsuariosPanel';

const INSTITUCIONES = [
  { value: 'CFT', label: 'Centro de Formación Técnica' },
  { value: 'IP', label: 'Instituto Profesional' },
  { value: 'Universidad', label: 'Universidad' },
];

function AdminPanel({ onSalir, onIrAsistencia, userRole = 'admin', userPermissions = null }) {
  const esSuperAdmin = userRole === 'admin';
  const permisos = userPermissions || (esSuperAdmin ? { eventos: true, participantes: true, asistencia: true, usuarios: true } : {});

  // Tab inicial según permisos
  const primerTab = esSuperAdmin || permisos.eventos
    ? 'eventos'
    : permisos.participantes
    ? 'alumnos'
    : permisos.usuarios
    ? 'usuarios'
    : 'eventos';

  const [tab, setTab] = useState(primerTab);

  // Asegurar que si el tab actual no está permitido para este usuario, cambie al primer tab válido
  useEffect(() => {
    if (esSuperAdmin) return;
    if (tab === 'eventos' && !permisos.eventos) {
      setTab(primerTab);
    } else if (tab === 'alumnos' && !permisos.participantes) {
      setTab(primerTab);
    } else if (tab === 'usuarios' && !permisos.usuarios) {
      setTab(primerTab);
    }
  }, [userRole, userPermissions, primerTab]);
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
    nombre: '',
    nombres: '',
    apellidos: '',
    rut: '',
    carrera: '',
    asiento: '',
    grupo: '',
    distincion: '',
    reconocimiento: '',
    presente: false,
  });
  const [rutEliminar, setRutEliminar] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Filtros globales para sincronizar con AlumnosLista y EstadisticasPanel
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [soloPresentes, setSoloPresentes] = useState('');

function esEventoTitulacion(nombre) {
  if (!nombre) return false;
  const n = String(nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return n.includes('titulacion');
}

  const esEventoTrabajadores = eventoActivo?.tipo === 'trabajadores';

  const soloInstitucion = useMemo(() => {
    if (esEventoTitulacion(eventoActivo?.nombre)) return true;
    if (!alumnos || alumnos.length === 0) return false;
    const tieneCamposColegio = alumnos.some(a =>
      (a.cargo != null && String(a.cargo).trim() !== '') ||
      (a.comuna != null && String(a.comuna).trim() !== '')
    );
    const tieneInstitucion = alumnos.some(a =>
      a.institucion != null && String(a.institucion).trim() !== '' && a.institucion !== 'General'
    );
    return tieneInstitucion && !tieneCamposColegio;
  }, [eventoActivo?.nombre, alumnos]);

  const columnasConDatos = useMemo(() => {
    if (!alumnos || alumnos.length === 0) {
      return {
        rut: true,
        nombreCompleto: false,
        nombres: true,
        apellidos: true,
        telefono: true,
        correo: true,
        establecimiento: !soloInstitucion,
        cargo: true,
        comuna: true,
        carrera: true,
        institucion: true,
        numeroLista: true,
        asiento: true,
        grupo: true,
        distincion: true,
        reconocimiento: true,
        departamento: true,
        observacion: true,
      };
    }

    const tieneCamposNuevos = alumnos.some(
      a =>
        (a.cargo != null && String(a.cargo).trim() !== '') ||
        (a.comuna != null && String(a.comuna).trim() !== '') ||
        (a.establecimiento != null && String(a.establecimiento).trim() !== '') ||
        (a.telefono != null && String(a.telefono).trim() !== '') ||
        (a.correo != null && String(a.correo).trim() !== '')
    );

    return {
      rut: true,
      nombreCompleto: false,
      nombres: true,
      apellidos: true,
      telefono: alumnos.some(a => a.telefono != null && String(a.telefono).trim() !== ''),
      correo: alumnos.some(a => a.correo != null && String(a.correo).trim() !== ''),
      establecimiento: !soloInstitucion && alumnos.some(a => a.establecimiento != null && String(a.establecimiento).trim() !== ''),
      cargo: alumnos.some(a => a.cargo != null && String(a.cargo).trim() !== ''),
      comuna: !soloInstitucion && alumnos.some(a => a.comuna != null && String(a.comuna).trim() !== ''),
      carrera: alumnos.some(a => a.carrera != null && String(a.carrera).trim() !== '' && a.carrera !== 'General'),
      institucion: soloInstitucion
        ? alumnos.some(a => a.institucion != null && String(a.institucion).trim() !== '' && a.institucion !== 'General')
        : (!tieneCamposNuevos && alumnos.some(a => a.institucion != null && String(a.institucion).trim() !== '' && a.institucion !== 'General')),
      numeroLista: alumnos.some(a => a.numeroLista != null && String(a.numeroLista).trim() !== ''),
      asiento: alumnos.some(a => a.asiento != null && String(a.asiento).trim() !== ''),
      grupo: alumnos.some(a => a.grupo != null && String(a.grupo).trim() !== ''),
      distincion: alumnos.some(a => Boolean(a.distincion) || (a.distincion != null && String(a.distincion).trim() !== '')),
      reconocimiento: alumnos.some(a => Boolean(a.reconocimiento) || (a.reconocimiento != null && String(a.reconocimiento).trim() !== '')),
      departamento: alumnos.some(a => a.departamento != null && String(a.departamento).trim() !== ''),
      observacion: alumnos.some(a => a.observacion != null && String(a.observacion).trim() !== ''),
    };
  }, [alumnos, soloInstitucion]);

  const opcionesUnicas = useMemo(() => {
    if (!alumnos || alumnos.length === 0) return {};
    const getOptions = (field) => {
      const values = alumnos.map(a => a[field]).filter(val => val != null && String(val).trim() !== '');
      return [...new Set(values)].sort();
    };
    return {
      establecimiento: getOptions('establecimiento'),
      institucion: getOptions('institucion'),
      carrera: getOptions('carrera'),
      cargo: getOptions('cargo'),
      comuna: getOptions('comuna'),
      departamento: getOptions('departamento'),
      grupo: getOptions('grupo'),
    };
  }, [alumnos]);

  const distincionesUnicas = useMemo(() => {
    if (!alumnos || alumnos.length === 0) return [];
    const set = new Set();
    alumnos.forEach(a => {
      if (a.distincion) {
        if (typeof a.distincion === 'string' && a.distincion !== 'true') {
          set.add(a.distincion.trim());
        } else {
          set.add('Distinción Máxima');
        }
      }
    });
    return Array.from(set).sort();
  }, [alumnos]);

  const [isGuardandoNuevo, setIsGuardandoNuevo] = useState(false);

  async function handleAgregarAlumno(e) {
    e.preventDefault();
    if (!eventoActivo?.id) {
      setMensajeAdmin('Error: No hay evento activo seleccionado');
      return;
    }
    setIsGuardandoNuevo(true);
    try {
      const nomLimpio = `${nuevoAlumno.nombres || ''} ${nuevoAlumno.apellidos || ''}`.trim() || nuevoAlumno.nombre || '';
      const payload = {
        nombres: nuevoAlumno.nombres || (nomLimpio ? nomLimpio.split(' ')[0] : ''),
        apellidos: nuevoAlumno.apellidos || (nomLimpio ? nomLimpio.split(' ').slice(1).join(' ') : ''),
        nombre: nomLimpio,
        rut: nuevoAlumno.rut,
        carrera: nuevoAlumno.carrera || null,
        grupo: nuevoAlumno.grupo || null,
        asiento: nuevoAlumno.asiento || null,
        distincion: nuevoAlumno.distincion || null,
        reconocimiento: nuevoAlumno.reconocimiento || null,
        presente: Boolean(nuevoAlumno.presente),
      };

      await agregarAlumno(payload, eventoActivo.id);
      setMensajeAdmin('Participante agregado correctamente');
      setNuevoAlumno({
        nombre: '',
        nombres: '',
        apellidos: '',
        rut: '',
        carrera: '',
        asiento: '',
        grupo: '',
        distincion: '',
        reconocimiento: '',
        presente: false,
      });
      setShowAdminModal(false);
    } catch (err) {
      console.error(err);
      setMensajeAdmin(`Error al agregar: ${err.message}`);
    } finally {
      setIsGuardandoNuevo(false);
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
    setMensajeAdmin('');
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
          userRole={userRole}
        />
      );
    }

    if (tab === 'alumnos') {
      return (
        <div className='space-y-8'>
          {eventoActivo ? (
            <>
              <EventoActivoInfo
                eventoActivo={eventoActivo}
              />

              {/* Si no hay datos importados en el evento activo */}
              {(!alumnos || alumnos.length === 0) ? (
                <div className='flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-st-verde/30 min-h-[350px] shadow-sm'>
                  <div className='w-20 h-20 bg-st-pastel rounded-full flex items-center justify-center mb-4'>
                    <svg className="w-10 h-10 text-st-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className='text-xl font-bold text-slate-800 mb-2'>Sin datos importados</h3>
                  <p className='text-slate-500 max-w-md mx-auto mb-6 text-sm font-medium'>
                    Primero se tienen que importar los datos para utilizar esta sección.
                  </p>
                  <button
                    onClick={() => setTab('eventos')}
                    className='px-6 py-2.5 bg-st-verde text-white rounded-xl hover:bg-[#004b30] transition shadow-md shadow-st-verde/20 font-bold text-sm flex items-center gap-2'
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ir a Eventos para importar
                  </button>
                </div>
              ) : (
                <>
                  {/* Header Integrado de Sección */}
                  <div className='bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm'>
                    <div>
                      <h2 className='text-xl font-bold text-slate-800 flex items-center gap-2'>
                        <div className='w-1.5 h-6 bg-st-verde rounded-full'></div>
                        Gestión de Asistencia y Alumnos
                      </h2>
                      <p className='text-xs text-slate-500 mt-1 font-medium'>Control centralizado de registros y validación en tiempo real</p>
                    </div>

                    <div className='flex items-center gap-1.5 md:gap-2'>
                      <button
                        onClick={abrirModalAgregar}
                        className='flex items-center justify-center gap-1.5 px-2.5 md:px-4 py-2 bg-st-verde text-white rounded-xl hover:bg-[#004b30] transition-all text-xs md:text-sm font-bold shadow-sm'
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo
                      </button>

                    </div>
                  </div>

                  <div className="space-y-6">
                    <AlumnosLista
                      alumnos={alumnos}
                      alumnosCompletos={alumnos}
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
                      eventoNombre={eventoActivo?.nombre || 'Evento'}
                      tipoEvento={eventoActivo?.tipo || 'alumnos'}
                    />
                  </div>
                </>
              )}
            </>
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

    if (tab === 'usuarios') {
      return <UsuariosPanel />;
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
          {(esSuperAdmin || permisos.eventos) && (
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
          )}

          {(esSuperAdmin || permisos.participantes) && (
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
          )}

          {(esSuperAdmin || permisos.usuarios) && (
            <button
              onClick={() => setTab('usuarios')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium ${tab === 'usuarios'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
                } ${!sidebarOpen && 'justify-center'}`}
              title={!sidebarOpen ? 'Usuarios' : ''}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Usuarios
              </span>
            </button>
          )}

          {/* Botón directo a vista de ingreso de RUT */}
          {onIrAsistencia && (esSuperAdmin || permisos.asistencia) && (
            <button
              onClick={onIrAsistencia}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 hover:text-white ${!sidebarOpen && 'justify-center'}`}
              title={!sidebarOpen ? 'Ingreso RUT' : ''}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Ingresar Asistencia
              </span>
            </button>
          )}
        </nav>

        <div className='p-3 mt-auto border-t border-white/10'>
          <button
            onClick={onSalir}
            className={`w-full flex items-center gap-3 px-3 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition text-sm font-medium ${!sidebarOpen && 'justify-center'}`}
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
        {/* Content Scrollable - with bottom padding on mobile for nav bar */}
        <div className='flex-1 overflow-y-auto p-4 pb-20 md:pb-8 md:p-8'>
          <div className='max-w-[1400px] mx-auto'>
            {/* Header Simplified - Solo se muestra en la lista de eventos para evitar redundancia con el nombre del evento activo */}
            {tab === 'eventos' && (
              <div className='mb-8'>
                <h2 className='text-3xl font-bold text-slate-800 tracking-tight'>
                  Mis Eventos
                </h2>
                <p className='text-slate-500 mt-1'>
                  Administra tus eventos y monitorea su estado.
                </p>
              </div>
            )}

            {renderContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-inset-bottom'>
        <div className='flex items-center justify-around h-16 px-2'>
          {(esSuperAdmin || permisos.eventos) && (
            <button
              onClick={() => setTab('eventos')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${tab === 'eventos' ? 'text-st-verde' : 'text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className='text-xs font-medium'>Eventos</span>
            </button>
          )}

          {(esSuperAdmin || permisos.participantes) && (
            <button
              onClick={() => setTab('alumnos')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${tab === 'alumnos' ? 'text-st-verde' : 'text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className='text-xs font-medium'>Participantes</span>
            </button>
          )}

          {(esSuperAdmin || permisos.usuarios) && (
            <button
              onClick={() => setTab('usuarios')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${tab === 'usuarios' ? 'text-st-verde' : 'text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className='text-xs font-medium'>Usuarios</span>
            </button>
          )}

          {onIrAsistencia && (esSuperAdmin || permisos.asistencia) && (
            <button
              onClick={onIrAsistencia}
              className='flex flex-col items-center justify-center flex-1 h-full gap-1 text-emerald-600 hover:text-emerald-700 transition-colors'
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className='text-xs font-medium'>Ingreso RUT</span>
            </button>
          )}

          <button
            onClick={onSalir}
            className='flex flex-col items-center justify-center flex-1 h-full gap-1 text-red-400 hover:text-red-500 transition-colors'
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className='text-xs font-medium'>Salir</span>
          </button>
        </div>
      </nav>

      {/* Modal para agregar y eliminar alumnos */}
      {showAdminModal && adminModalMode === 'add' && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
              
              {/* Encabezado Institucional */}
              <div className="bg-st-verde px-6 py-4.5 flex justify-between items-center flex-shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Nuevo Registro</h3>
                    <p className="text-xs text-emerald-100/90 font-medium">
                      {nuevoAlumno.rut ? `RUT: ${nuevoAlumno.rut}` : 'Nuevo Asistente'}
                      {nuevoAlumno.nombre || nuevoAlumno.nombres ? ` • ${nuevoAlumno.nombre || `${nuevoAlumno.nombres || ''} ${nuevoAlumno.apellidos || ''}`.trim()}` : (eventoActivo?.nombre ? ` • ${eventoActivo.nombre}` : '')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario con Secciones Desplegables (Dropdowns) */}
              <form onSubmit={handleAgregarAlumno} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
                {mensajeAdmin && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${mensajeAdmin.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${mensajeAdmin.includes('Error') ? 'bg-red-500' : 'bg-st-verde'}`}></span>
                    {mensajeAdmin}
                  </div>
                )}

                {/* Estado de Asistencia */}
                <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 border-l-4 border-l-st-verde shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-st-verde uppercase tracking-wider">
                      Estado de Asistencia
                    </label>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      nuevoAlumno.presente
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200/70 text-slate-600 border border-slate-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${nuevoAlumno.presente ? 'bg-emerald-600' : 'bg-slate-500'}`}></span>
                      {nuevoAlumno.presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                  <select
                    value={nuevoAlumno.presente ? 'presente' : 'ausente'}
                    onChange={e => setNuevoAlumno(prev => ({ ...prev, presente: e.target.value === 'presente' }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                  >
                    <option value="ausente">Ausente</option>
                    <option value="presente">Presente</option>
                  </select>
                </div>

                {/* Campos requeridos del registro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* RUT */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      RUT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 12.345.678-9"
                      value={nuevoAlumno.rut || ''}
                      onChange={e => setNuevoAlumno(prev => ({ ...prev, rut: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    />
                  </div>

                  {/* Carrera */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Carrera
                    </label>
                    {opcionesUnicas.carrera?.length > 0 ? (
                      <select
                        value={nuevoAlumno.carrera || ''}
                        onChange={e => setNuevoAlumno(prev => ({ ...prev, carrera: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all font-medium"
                      >
                        <option value="">Seleccionar Carrera...</option>
                        {opcionesUnicas.carrera.map(c => <option key={c} value={c}>{c}</option>)}
                        {nuevoAlumno.carrera && !opcionesUnicas.carrera.includes(nuevoAlumno.carrera) && (
                          <option value={nuevoAlumno.carrera}>{nuevoAlumno.carrera}</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ej: Ingeniería en Informática"
                        value={nuevoAlumno.carrera || ''}
                        onChange={e => setNuevoAlumno(prev => ({ ...prev, carrera: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Nombres */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nombres <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Andrés"
                      value={nuevoAlumno.nombres || ''}
                      onChange={e => {
                        const n = e.target.value;
                        setNuevoAlumno(prev => ({
                          ...prev,
                          nombres: n,
                          nombre: `${n} ${prev.apellidos || ''}`.trim()
                        }));
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pérez González"
                      value={nuevoAlumno.apellidos || ''}
                      onChange={e => {
                        const a = e.target.value;
                        setNuevoAlumno(prev => ({
                          ...prev,
                          apellidos: a,
                          nombre: `${prev.nombres || ''} ${a}`.trim()
                        }));
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    />
                  </div>

                  {/* Grupo */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Grupo
                    </label>
                    {opcionesUnicas.grupo?.length > 0 ? (
                      <select
                        value={nuevoAlumno.grupo || ''}
                        onChange={e => setNuevoAlumno(prev => ({ ...prev, grupo: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                      >
                        <option value="">Sin grupo</option>
                        {opcionesUnicas.grupo.map(g => <option key={g} value={g}>Grupo {g}</option>)}
                        {nuevoAlumno.grupo && !opcionesUnicas.grupo.includes(nuevoAlumno.grupo) && (
                          <option value={nuevoAlumno.grupo}>{nuevoAlumno.grupo}</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ej: 1"
                        value={nuevoAlumno.grupo || ''}
                        onChange={e => setNuevoAlumno(prev => ({ ...prev, grupo: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Asiento */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Asiento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: A-12"
                      value={nuevoAlumno.asiento || ''}
                      onChange={e => setNuevoAlumno(prev => ({ ...prev, asiento: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    />
                  </div>

                  {/* Distinción */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Distinción
                    </label>
                    <select
                      value={
                        !nuevoAlumno.distincion || nuevoAlumno.distincion === false
                          ? ''
                          : ['Distinción Máxima', 'Distinción Unánime', ...distincionesUnicas].includes(nuevoAlumno.distincion)
                            ? nuevoAlumno.distincion
                            : '__custom__'
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setNuevoAlumno(prev => ({ ...prev, distincion: 'Distinción Especial' }));
                        } else {
                          setNuevoAlumno(prev => ({ ...prev, distincion: val }));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    >
                      <option value="">Sin distinción</option>
                      <option value="Distinción Máxima">Distinción Máxima</option>
                      <option value="Distinción Unánime">Distinción Unánime</option>
                      {distincionesUnicas
                        .filter(d => d !== 'Distinción Máxima' && d !== 'Distinción Unánime')
                        .map(d => <option key={d} value={d}>{d}</option>)
                      }
                      <option value="__custom__">Personalizada...</option>
                    </select>
                    {Boolean(nuevoAlumno.distincion) && !['Distinción Máxima', 'Distinción Unánime', ...distincionesUnicas.filter(d => d !== 'Distinción Máxima' && d !== 'Distinción Unánime')].includes(nuevoAlumno.distincion) && (
                      <input
                        type="text"
                        placeholder="Escriba la distinción..."
                        value={typeof nuevoAlumno.distincion === 'string' ? nuevoAlumno.distincion : ''}
                        onChange={e => setNuevoAlumno(prev => ({ ...prev, distincion: e.target.value }))}
                        className="mt-2 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Reconocimiento */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Reconocimiento
                    </label>
                    <input
                      type="text"
                      value={typeof nuevoAlumno.reconocimiento === 'string' ? nuevoAlumno.reconocimiento : (nuevoAlumno.reconocimiento ? 'Reconocimiento' : '')}
                      onChange={e => setNuevoAlumno(prev => ({ ...prev, reconocimiento: e.target.value }))}
                      placeholder="Ej: Reconocimiento Especial, Mejor Compañero, etc."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isGuardandoNuevo}
                    className="px-5 py-2 text-sm bg-st-verde text-white font-semibold rounded-lg hover:bg-[#004b30] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGuardandoNuevo ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : 'Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal de eliminación si aplica */}
        {showAdminModal && adminModalMode === 'delete' && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 flex flex-col overflow-hidden border border-slate-200">
              <div className="bg-red-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h3 className="text-base font-bold text-white">Eliminar Registro</h3>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form ref={deleteFormRef} onSubmit={handleEliminarAlumno} className="p-6 space-y-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-700 text-sm">Esta acción es irreversible. Asegúrate de tener el RUT correcto.</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">RUT del alumno</label>
                  <input
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="Ej: 12345678k"
                    value={rutEliminar}
                    onChange={e => setRutEliminar(e.target.value)}
                    required
                  />
                </div>
                {mensajeAdmin && (
                  <div className={`p-3 rounded-lg text-sm text-center ${mensajeAdmin.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {mensajeAdmin}
                  </div>
                )}
                <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-sm"
                  >
                    Eliminar Definitivamente
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminPanel;
