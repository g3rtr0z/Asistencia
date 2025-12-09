import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import AlumnosLista from '../alumnos/AlumnosLista';
import EstadisticasPanel from '../alumnos/EstadisticasPanel';
import EventosPanel from '../eventos/EventosPanel';
import EventoActivoInfo from '../eventos/EventoActivoInfo';
import EventoInfo from '../eventos/EventoInfo';
import { exportarAExcel } from './exportarAExcel';
import { agregarAlumno, deleteAlumnoPorRut } from '../../services/alumnosService';
import { motion } from 'framer-motion';
import useEventos from '../../hooks/useEventos';
import useAlumnosEvento from '../../hooks/useAlumnosEvento';
import TrabajadoresLista from '../trabajadores/TrabajadoresLista';
import TrabajadoresResumen from '../trabajadores/TrabajadoresResumen';

function AdminPanel({
  onSalir
}) {
  const [tab, setTab] = useState('eventos');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState('add');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const deleteFormRef = useRef(null);

  // Hook para eventos
  const { eventos, eventoActivo, loading: eventosLoading, error: eventosError } = useEventos();

  // Hook para alumnos del evento activo
  const { alumnos, loading: alumnosLoading, error: alumnosError } = useAlumnosEvento();

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
    observacion: ''
  });
  const [rutEliminar, setRutEliminar] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Filtros globales para sincronizar con AlumnosLista y EstadisticasPanel
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroInstitucion, setFiltroInstitucion] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [soloPresentes, setSoloPresentes] = useState("");

  // Filtrado simplificado
  const alumnosFiltrados = alumnos.filter(alumno => {
    const cumpleCarrera = !filtroCarrera || alumno.carrera === filtroCarrera;
    const cumpleInstitucion = !filtroInstitucion || alumno.institucion === filtroInstitucion;
    const cumpleGrupo = !filtroGrupo || Number(alumno.grupo) === Number(filtroGrupo);
    const cumplePresente = !soloPresentes ||
      (soloPresentes === "presentes" ? alumno.presente : !alumno.presente);

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
        rut: nuevoAlumno.rut
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
      setNuevoAlumno({ nombres: '', apellidos: '', rut: '', carrera: '', institucion: '', asiento: '', grupo: '', departamento: '', observacion: '' });
    } catch (err) {
      setMensajeAdmin('Error al agregar alumno');
    }
  }

  async function handleEliminarAlumno(e) {
    e.preventDefault();
    try {
      await deleteAlumnoPorRut(rutEliminar);
      setMensajeAdmin('Alumno eliminado correctamente');
      setRutEliminar('');
    } catch (err) {
      setMensajeAdmin('Error al eliminar alumno');
    }
  }

  useEffect(() => {
    if (showAdminModal && adminModalMode === 'delete' && deleteFormRef.current) {
      deleteFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-y-auto pt-4 sm:pt-0 hide-scrollbar" id="admin-panel-root">
      {/* Header del Panel de Administración */}
      <div className="lg p-3 sm:p-2 md:p-8 mb-1">
        <div className="max-w-[90%] sm:max-w-4xl md:max-w-5xl mx-auto px-4 sm:px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 truncate">Panel de Administración</h1>
                <p className="text-xs sm:text-sm text-slate-500 truncate">Gestiona eventos, alumnos y configuraciones</p>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {/* Botón del panel lateral */}
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Abrir panel lateral"
                title="Panel lateral"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </motion.button>

              {/* Botón Salir */}
            <motion.button
              onClick={onSalir}
              className="w-full sm:w-auto flex justify-center px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Salir
            </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar y eliminar alumnos */}
      {showAdminModal && (
        <motion.div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 sm:p-8 w-full max-w-xl flex flex-col items-center relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button onClick={() => setShowAdminModal(false)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600">×</button>
            <h3 className="text-2xl font-bold text-st-verde mb-4">
              {adminModalMode === 'delete' ? 'Eliminar Alumno' : 'Agregar Alumno'}
            </h3>
            {adminModalMode === 'add' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm w-full">
                <p className="text-sm text-slate-500 mb-3">
                  Completa los datos que vas a registrar. Usa el filtro verde para los funcionarios y los campos tradicionales para alumnos.
                </p>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0" onSubmit={handleAgregarAlumno}>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-st-verde mb-1">Nombres</label>
                    <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Nombres" value={nuevoAlumno.nombres} onChange={e => setNuevoAlumno(a => ({ ...a, nombres: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-st-verde mb-1">Apellidos</label>
                    <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Apellidos" value={nuevoAlumno.apellidos} onChange={e => setNuevoAlumno(a => ({ ...a, apellidos: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-st-verde mb-1">RUT</label>
                    <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="RUT" value={nuevoAlumno.rut} onChange={e => setNuevoAlumno(a => ({ ...a, rut: e.target.value }))} required />
                  </div>
                  {esEventoTrabajadores ? (
                    <>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Departamento</label>
                        <input
                          className="border border-st-verde rounded px-3 py-2 text-base"
                          placeholder="Ej: Recursos Humanos"
                          value={nuevoAlumno.departamento}
                          onChange={e => setNuevoAlumno(a => ({ ...a, departamento: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Observación</label>
                        <input
                          className="border border-st-verde rounded px-3 py-2 text-base"
                          placeholder="Ej: Requiere acceso temprano"
                          value={nuevoAlumno.observacion}
                          onChange={e => setNuevoAlumno(a => ({ ...a, observacion: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Carrera</label>
                        <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Carrera" value={nuevoAlumno.carrera} onChange={e => setNuevoAlumno(a => ({ ...a, carrera: e.target.value }))} required />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Institución</label>
                        <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Institución" value={nuevoAlumno.institucion} onChange={e => setNuevoAlumno(a => ({ ...a, institucion: e.target.value }))} required />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Asiento</label>
                        <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Asiento" value={nuevoAlumno.asiento} onChange={e => setNuevoAlumno(a => ({ ...a, asiento: e.target.value }))} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-st-verde mb-1">Grupo</label>
                        <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Grupo" value={nuevoAlumno.grupo} onChange={e => setNuevoAlumno(a => ({ ...a, grupo: e.target.value }))} />
                      </div>
                    </>
                  )}
                  <div className="flex flex-col justify-end">
                    <button type="submit" className="bg-st-verde text-white px-6 py-2 rounded font-semibold w-full shadow hover:bg-st-verdeClaro transition">Agregar</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm w-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-red-700">Eliminar Alumno</h3>
                  <span className="text-xs text-red-500 uppercase tracking-widest">Solo RUT</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Ingresa el RUT completo para quitar el registro del evento activo. Esta acción no se puede deshacer fácilmente.
                </p>
                <form ref={deleteFormRef} className="flex flex-col sm:flex-row gap-4 w-full items-end min-w-0" onSubmit={handleEliminarAlumno}>
                  <div className="flex-1 flex flex-col">
                    <label className="text-sm font-medium text-red-600 mb-1">RUT del alumno</label>
                    <input className="border border-red-400 rounded px-3 py-2 text-base" placeholder="RUT del alumno" value={rutEliminar} onChange={e => setRutEliminar(e.target.value)} required />
                  </div>
                  <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded font-semibold shadow hover:bg-red-700 transition">
                    Eliminar
                  </button>
                </form>
              </div>
            )}
            {mensajeAdmin && <div className="mt-4 text-st-verde font-medium text-center">{mensajeAdmin}</div>}
          </motion.div>
        </motion.div>
      )}

      {/* Panel lateral flotante */}
      <>
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-white shadow-2xl transition-transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full p-6 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Panel lateral</p>
                <h3 className="text-xl font-bold text-slate-900">Administrador</h3>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-700 transition"
                aria-label="Cerrar panel lateral"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-500">
              <p className="text-slate-700 font-semibold">{eventoActivo?.nombre ?? 'Sin evento activo'}</p>
              <p><span className="font-semibold text-slate-900">{alumnos.length}</span> participantes registrados</p>
              <p className="text-xs uppercase tracking-wider text-slate-400">Tipo: {eventoActivo?.tipo === 'trabajadores' ? 'Funcionarios' : 'Alumnos'}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  abrirModalAgregar();
                  setSidebarOpen(false);
                }}
                className="w-full rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20"
              >
                Agregar registro
              </button>
              <button
                onClick={() => {
                  abrirModalEliminar();
                  setSidebarOpen(false);
                }}
                className="w-full rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-500/20"
              >
                Eliminar registro
              </button>
            </div>
            <div className="text-xs text-slate-400">
              Utiliza este panel para mantener a la vista las acciones más frecuentes mientras navegas en el panel administrativo.
            </div>
          </div>
        </aside>
      </>

      {/* Tabs Optimizadas para móviles */}
      <div className="relative bg-white border-b border-slate-200">
        <div className="flex max-w-[90%] sm:max-w-4xl md:max-w-5xl mx-auto px-4 sm:px-4 md:px-6">
          <div className="flex relative w-full">
            <motion.button
              onClick={() => setTab('eventos')}
              className={`relative flex-1 px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-t-lg ${tab === 'eventos'
                ? 'text-green-800 bg-white shadow-lg'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${tab === 'eventos' ? 'text-green-600' : 'text-slate-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Eventos</span>
                <span className="sm:hidden">Eventos</span>
              </div>
              {tab === 'eventos' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setTab('alumnos')}
              className={`relative flex-1 px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-t-lg ${tab === 'alumnos'
                ? 'text-green-800 bg-white shadow-lg'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${tab === 'alumnos' ? 'text-green-600' : 'text-slate-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">
                  {eventoActivo?.tipo === 'trabajadores' ? 'Funcionarios' : 
                   eventoActivo?.tipo === 'alumnos' ? 'Alumnos' : 'Participantes'}
                </span>
                <span className="sm:hidden">
                  {eventoActivo?.tipo === 'trabajadores' ? 'Funcion.' : 
                   eventoActivo?.tipo === 'alumnos' ? 'Alumnos' : 'Part.'}
                </span>
              </div>
              {tab === 'alumnos' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Contenido de pestañas */}
      <div className="flex-1 w-full max-w-[90%] sm:max-w-4xl md:max-w-5xl mx-auto px-4 sm:px-4 md:px-6 py-4 sm:py-6">
            {tab === 'alumnos' && (
              <div className="space-y-4 sm:space-y-6">
                {eventoActivo ? (
                  esEventoTrabajadores ? (
                    <div className="space-y-4">
                      <EventoInfo eventoActivo={eventoActivo} totalAlumnos={alumnos.length} alumnos={alumnos} />
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
                  ) : (
                    <>
                      <EventoInfo eventoActivo={eventoActivo} totalAlumnos={alumnos.length} alumnos={alumnosFiltrados} />
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
                      />
                    </>
                  )
                ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-yellow-800">No hay eventos activos</h3>
                </div>
                <p className="text-yellow-700 mb-4">Necesitas activar un evento para gestionar los alumnos.</p>
                <motion.button
                  onClick={() => setTab('eventos')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ir a Gestión de Eventos
                </motion.button>
              </div>
            )}
          </div>
        )}

        {tab === 'eventos' && (
          <EventosPanel
            eventos={eventos}
            eventoActivo={eventoActivo}
            onEventoChange={() => {
              // Los datos se actualizarán automáticamente a través del hook useEventos
              // No es necesario recargar la página
            }}
          />
        )}
      </div>

    </div>
  );
}

export default AdminPanel;
