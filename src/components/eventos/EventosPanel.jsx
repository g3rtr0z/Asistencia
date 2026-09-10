import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  crearEvento,
  actualizarEvento,
  activarEvento,
  eliminarEvento,
  probarConexionFirestore,
} from '../../services/eventosService';
import { getAlumnosPorEvento } from '../../services/alumnosService';
import ImportExcel from '../admin/ImportExcel';
import { ChevronDown, ChevronUp, X, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export const DEFAULT_CONFIG_ASISTENCIA = {
  modoNombre: 'completo', // 'completo' | 'soloNombre' | 'primerNombre' | 'separado'
  mostrarRut: true,
  mostrarCarrera: true,
  mostrarInstitucion: true,
  mostrarCargo: true,
  mostrarComuna: true,
  mostrarAsiento: true,
  mostrarGrupo: true,
  mostrarNumeroLista: true,
  mostrarDistincion: true,
  mostrarReconocimiento: true,
};

const getInitialFormData = () => ({
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  activo: false,
  visibleCoordinador: true,
  tipo: 'alumnos',
  configuracionAsistencia: { ...DEFAULT_CONFIG_ASISTENCIA },
});

function EventosPanel({ eventos, eventoActivo: _eventoActivo, onEventoChange, userRole = 'admin' }) {
  const esSuperAdmin = userRole === 'admin';
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [camposDisponiblesEvento, setCamposDisponiblesEvento] = useState(null);
  const [sampleAlumno, setSampleAlumno] = useState(null);
  const [cargandoCampos, setCargandoCampos] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [eventoADesactivar, setEventoADesactivar] = useState(null);
  const [desactivando, setDesactivando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('alumnos'); // 'alumnos', 'trabajadores'
  const [formData, setFormData] = useState(getInitialFormData());
  const [mensaje, setMensaje] = useState('');
  const [seccionesModal, setSeccionesModal] = useState({
    fechas: true,
    acreditacion: true,
    permisos: true,
    vistaPrevia: false,
  });

  // Auto-cierre del popup de notificación después de 4 segundos
  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => {
      setMensaje('');
    }, 4000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  const toggleSeccionModal = (seccion) => {
    setSeccionesModal(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // Probar conexión antes de proceder
      const conexionOk = await probarConexionFirestore();
      if (!conexionOk) {
        setMensaje(
          'Error: No se puede conectar a la base de datos. Verifica tu conexión a internet.'
        );
        return;
      }

      if (editingEvento) {
        await actualizarEvento(editingEvento.id, formData);
        setMensaje('Evento actualizado correctamente');
        setShowModal(false);
        setEditingEvento(null);
        setCamposDisponiblesEvento(null);
        setSampleAlumno(null);
        setFormData(getInitialFormData());
      } else {
        // Crear el evento y cerrar el modal
        await crearEvento(formData);
        setMensaje('Evento creado correctamente');
        setShowModal(false);
        setFormData(getInitialFormData());
      }

      if (onEventoChange) onEventoChange();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setMensaje(
        `Error: ${error.message || 'Error desconocido al procesar el evento'}`
      );
    }
  };

  const handleEdit = async evento => {
    setEditingEvento(evento);
    setCamposDisponiblesEvento(null);
    setSampleAlumno(null);
    setCargandoCampos(true);

    let camposDetectados = null;
    let sample = null;

    try {
      const alumnos = await getAlumnosPorEvento(evento.id);
      if (alumnos && alumnos.length > 0) {
        sample = alumnos[0];
        camposDetectados = {
          mostrarRut: alumnos.some(a => Boolean(a.rut || a.RUT)),
          mostrarCarrera: alumnos.some(a => Boolean(a.carrera || a.Carrera)),
          mostrarInstitucion: alumnos.some(a => Boolean(a.institucion || a.establecimiento || a.Establecimiento || a['Institución'])),
          mostrarCargo: alumnos.some(a => Boolean(a.cargo || a.Cargo)),
          mostrarComuna: alumnos.some(a => Boolean(a.comuna || a['Comuna del Establecimiento'])),
          mostrarAsiento: alumnos.some(a => Boolean(a.asiento || a.Asiento)),
          mostrarGrupo: alumnos.some(a => a.grupo !== null && a.grupo !== undefined && a.grupo !== ''),
          mostrarNumeroLista: alumnos.some(a => Boolean(a.numeroLista || a.NumeroLista)),
          mostrarDistincion: alumnos.some(a => Boolean(a.distincion && a.distincion !== 'false' && a.distincion !== false)),
          mostrarReconocimiento: alumnos.some(a => Boolean(a.reconocimiento && a.reconocimiento !== 'false' && a.reconocimiento !== false)),
        };
        setCamposDisponiblesEvento(camposDetectados);
        setSampleAlumno(sample);
      }
    } catch (err) {
      console.warn('Error al verificar campos de alumnos:', err);
    } finally {
      setCargandoCampos(false);
    }

    const cfgOriginal = evento.configuracionAsistencia || {};
    const configBase = { ...DEFAULT_CONFIG_ASISTENCIA, ...cfgOriginal };

    if (camposDetectados) {
      // Los campos que no existen en el Excel se desactivan por defecto
      Object.keys(camposDetectados).forEach(k => {
        if (!camposDetectados[k]) {
          configBase[k] = false;
        }
      });
    }

    setFormData({
      nombre: evento.nombre || '',
      descripcion: evento.descripcion || '',
      fechaInicio: evento.fechaInicio || '',
      fechaFin: evento.fechaFin || '',
      activo: Boolean(evento.activo),
      visibleCoordinador: evento.visibleCoordinador !== undefined ? Boolean(evento.visibleCoordinador) : true,
      tipo: evento.tipo || 'alumnos',
      configuracionAsistencia: configBase,
    });
    setShowModal(true);
  };

  const handleActivar = async eventoId => {
    try {
      const evento = eventos.find(e => e.id === eventoId);
      if (!evento) {
        setMensaje('Error: Evento no encontrado');
        return;
      }

      // Si el evento está activo, pedir confirmación mediante popup modal para desactivarlo
      if (evento.activo) {
        setEventoADesactivar(evento);
        return;
      } else {
        // Si el evento está inactivo, lo activamos
        await activarEvento(eventoId);
        setMensaje('Evento activado correctamente');
      }

      if (onEventoChange) onEventoChange();
    } catch (error) {
      console.error('Error al cambiar estado del evento:', error);
      setMensaje(
        `Error al cambiar estado del evento: ${error.message || 'Error desconocido'}`
      );
    }
  };

  const confirmarDesactivar = async () => {
    if (!eventoADesactivar) return;
    setDesactivando(true);
    try {
      await actualizarEvento(eventoADesactivar.id, { activo: false });
      setMensaje('Evento desactivado correctamente');
      setEventoADesactivar(null);
      if (onEventoChange) onEventoChange();
    } catch (error) {
      console.error('Error al desactivar el evento:', error);
      setMensaje(
        `Error al desactivar el evento: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setDesactivando(false);
    }
  };

  const handleEliminar = async eventoId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await eliminarEvento(eventoId);
        setMensaje('Evento eliminado correctamente');
        if (onEventoChange) onEventoChange();
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        setMensaje(
          `Error al eliminar evento: ${error.message || 'Error desconocido'}`
        );
      }
    }
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setShowImportModal(false);
    setEditingEvento(null);
    setCamposDisponiblesEvento(null);
    setSampleAlumno(null);
    setFormData(getInitialFormData());
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='w-full'>
      {/* Stats Header Minimalista */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6'>
        {/* Total Eventos */}
        <div className='bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 sm:gap-4'>
          <div className='w-11 h-11 rounded-xl bg-st-pastel text-st-verde flex items-center justify-center shrink-0'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
            </svg>
          </div>
          <div className='min-w-0'>
            <p className='text-2xl sm:text-3xl font-bold text-slate-800 leading-none mb-1.5'>
              {eventos.length}
            </p>
            <p className='text-xs font-medium text-slate-500 truncate'>
              Total Eventos
            </p>
          </div>
        </div>

        {/* Activos */}
        <div className='bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 sm:gap-4'>
          <div className='w-11 h-11 rounded-xl bg-st-pastel text-st-verde flex items-center justify-center shrink-0'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <div className='min-w-0'>
            <p className='text-2xl sm:text-3xl font-bold text-slate-800 leading-none mb-1.5'>
              {eventos.filter(e => e.activo).length}
            </p>
            <p className='text-xs font-medium text-slate-500 truncate'>
              Eventos Activos
            </p>
          </div>
        </div>

        {/* Alumnos */}
        <div className='bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 sm:gap-4'>
          <div className='w-11 h-11 rounded-xl bg-st-pastel text-st-verde flex items-center justify-center shrink-0'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
            </svg>
          </div>
          <div className='min-w-0'>
            <p className='text-2xl sm:text-3xl font-bold text-slate-800 leading-none mb-1.5'>
              {eventos.filter(e => (e.tipo || 'alumnos') === 'alumnos').length}
            </p>
            <p className='text-xs font-medium text-slate-500 truncate'>
              Eventos Alumnos
            </p>
          </div>
        </div>

        {/* Funcionarios */}
        <div className='bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5 sm:gap-4'>
          <div className='w-11 h-11 rounded-xl bg-st-pastel text-st-verde flex items-center justify-center shrink-0'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
            </svg>
          </div>
          <div className='min-w-0'>
            <p className='text-2xl sm:text-3xl font-bold text-slate-800 leading-none mb-1.5'>
              {eventos.filter(e => e.tipo === 'trabajadores').length}
            </p>
            <p className='text-xs font-medium text-slate-500 truncate'>
              Eventos Funcionarios
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className='bg-white rounded-xl border border-slate-200 p-4 mb-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          {/* Filter Tabs */}
          <div className='flex bg-slate-100 rounded-lg p-1'>
            <button
              onClick={() => setFiltroTipo('alumnos')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroTipo === 'alumnos'
                ? 'bg-white text-st-verde shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Alumnos
            </button>
            <button
              onClick={() => setFiltroTipo('trabajadores')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroTipo === 'trabajadores'
                ? 'bg-white text-st-verde shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Funcionarios
            </button>
          </div>

          {/* Create Button (Solo para Administrador) */}
          {esSuperAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className='flex items-center justify-center gap-2 bg-st-verde text-white px-5 py-2.5 rounded-lg hover:bg-[#004b30] transition-colors font-medium text-sm shadow-sm'
            >
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Nuevo Evento
            </button>
          )}
        </div>
      </div>

      {/* Popup Notificación Flotante Superior Derecho */}
      {createPortal(
        <AnimatePresence>
          {mensaje && (
            <motion.div
              key="popup-toast-notificacion"
              initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-5 right-5 z-[99999] pointer-events-auto max-w-sm w-full"
            >
              <div
                className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
                  mensaje.includes('Error')
                    ? 'bg-white/95 border-red-200 border-l-4 border-l-red-500'
                    : mensaje.toLowerCase().includes('desactivado')
                    ? 'bg-white/95 border-amber-200 border-l-4 border-l-amber-500'
                    : 'bg-white/95 border-emerald-200 border-l-4 border-l-st-verde'
                }`}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    mensaje.includes('Error')
                      ? 'bg-red-100 text-red-600'
                      : mensaje.toLowerCase().includes('desactivado')
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-st-verde'
                  }`}
                >
                  {mensaje.includes('Error') ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 pt-0.5 min-w-0">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    {mensaje.includes('Error')
                      ? 'Error'
                      : mensaje.toLowerCase().includes('desactivado')
                      ? 'Estado del Evento'
                      : 'Estado del Evento'}
                  </h4>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {mensaje}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMensaje('')}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 -mr-1 -mt-1"
                  title="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Events Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {eventos
          .filter(evento => (evento.tipo || 'alumnos') === filtroTipo)
          .filter(evento => esSuperAdmin || evento.visibleCoordinador !== false)
          .map(evento => (
            <motion.div
              key={evento.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${evento.activo ? 'border-st-verde' : 'border-slate-200'
                }`}
            >
              {/* Event Header */}
              <div className={`p-4 ${evento.activo ? 'bg-st-verde text-white' : 'bg-slate-50'}`}>
                <div className='flex items-center justify-between'>
                  <span className={`text-sm font-bold ${evento.activo ? 'text-white' : 'text-slate-600'}`}>
                    {evento.activo ? '● EVENTO ACTIVO' : '○ Inactivo'}
                  </span>
                  <div className='flex items-center gap-2'>
                    {esSuperAdmin && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${evento.visibleCoordinador !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {evento.visibleCoordinador !== false ? '👁️ Coordinador' : 'Solo Admin'}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${evento.tipo === 'trabajadores'
                      ? 'bg-blue-100 text-blue-700'
                      : evento.activo ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                      }`}>
                      {evento.tipo === 'trabajadores' ? 'Funcionarios' : 'Alumnos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className='p-5'>
                <h3 className='text-lg font-bold text-slate-900 mb-2'>{evento.nombre}</h3>
                <p className='text-sm text-slate-600 mb-4 line-clamp-2'>{evento.descripcion}</p>

                {/* Dates */}
                <div className='flex items-center gap-3 mb-5 text-sm text-slate-500'>
                  <div className='flex items-center gap-1.5'>
                    <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    <span>{formatDate(evento.fechaInicio)}</span>
                  </div>
                  <span className='text-slate-300'>→</span>
                  <span>{formatDate(evento.fechaFin)}</span>
                </div>

                {/* Actions */}
                <div className='flex gap-2'>
                  <button
                    onClick={() => handleActivar(evento.id)}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${evento.activo
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-st-verde text-white hover:bg-[#004b30]'
                      }`}
                  >
                    {evento.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleEdit(evento)}
                    className='p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors'
                    title='Editar'
                  >
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                    </svg>
                  </button>
                  {esSuperAdmin && (
                    <button
                      onClick={() => handleEliminar(evento.id)}
                      className='p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors'
                      title='Eliminar'
                    >
                      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Empty State */}
      {eventos.filter(evento => (evento.tipo || 'alumnos') === filtroTipo).filter(evento => esSuperAdmin || evento.visibleCoordinador !== false).length === 0 && (
        <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
          <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-slate-900 mb-1'>No hay eventos disponibles</h3>
          <p className='text-slate-500 text-sm mb-4'>
            {esSuperAdmin ? 'Crea tu primer evento para comenzar.' : 'No tienes eventos asignados en esta categoría actualmente.'}
          </p>
          {esSuperAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className='inline-flex items-center gap-2 bg-st-verde text-white px-4 py-2 rounded-lg hover:bg-[#004b30] transition-colors text-sm font-medium'
            >
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Crear Evento
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal Minimalista e Institucional */}
      {showModal && (
        <motion.div
          className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCerrarModal}
        >
          <motion.div
            className='bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8 max-h-[90vh] flex flex-col'
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header con Color Institucional */}
            <div className='bg-st-verde px-6 py-4.5 text-white flex justify-between items-center flex-shrink-0 shadow-xs'>
              <div className='flex items-center gap-3'>
                <div className='w-1.5 h-6 bg-emerald-300 rounded-full'></div>
                <div>
                  <h3 className='text-base font-bold text-white tracking-tight'>
                    {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                  </h3>
                  <p className='text-xs text-emerald-100/90 font-medium'>
                    {editingEvento ? editingEvento.nombre : 'Configuración institucional del evento'}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={handleCerrarModal}
                className='text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors'
                title='Cerrar'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto flex-1 text-slate-800'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                
                {/* 1. Información Principal con acento institucional */}
                <div className='bg-white border border-slate-200 rounded-xl p-4 space-y-4 border-l-4 border-l-st-verde shadow-xs'>
                  <div>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <span className='w-1.5 h-1.5 rounded-full bg-st-verde'></span>
                      <label className='text-xs font-bold text-st-verde uppercase tracking-wider'>
                        Nombre del Evento
                      </label>
                    </div>
                    <input
                      type='text'
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className='w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/20 outline-none transition-all'
                      placeholder='Ej: Titulación IP/CFT - 14 Sep'
                      required
                    />
                  </div>

                  {/* Tipo de Evento (Dropdown institucional) y Estado */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1'>
                        Tipo de Participantes
                      </label>
                      <select
                        value={formData.tipo || 'alumnos'}
                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                        className='w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all'
                      >
                        <option value='alumnos'>Estudiantes / Asistentes Generales</option>
                        <option value='trabajadores'>Funcionarios / Trabajadores</option>
                      </select>
                    </div>

                    <div>
                      <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1'>
                        Estado
                      </label>
                      <div className='flex items-center h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg'>
                        <span className={`inline-flex items-center text-xs font-semibold ${
                          formData.activo ? 'text-st-verde' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${formData.activo ? 'bg-st-verde' : 'bg-slate-400'}`}></span>
                          {formData.activo ? 'Evento Activo' : 'Evento Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1'>
                      Descripción (Opcional)
                    </label>
                    <textarea
                      value={formData.descripcion || ''}
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={2}
                      className='w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all resize-none'
                      placeholder='Detalles o notas sobre la ceremonia...'
                    />
                  </div>
                </div>

                {/* 2. Sección Desplegable: Fechas y Horarios con Cabecera Institucional */}
                <div className='border border-emerald-200/80 rounded-xl overflow-hidden shadow-xs'>
                  <button
                    type='button'
                    onClick={() => toggleSeccionModal('fechas')}
                    className='w-full flex items-center justify-between px-4 py-2.5 bg-emerald-50/80 hover:bg-emerald-100/70 border-b border-emerald-100 text-left transition-colors'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-st-verde'></span>
                      <span className='text-xs font-bold text-st-verde uppercase tracking-wider'>
                        Fechas y Horarios
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {formData.fechaInicio && (
                        <span className='text-[11px] font-semibold text-st-verde bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs'>
                          Programado
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-st-verde transform transition-transform duration-200 ${seccionesModal.fechas ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {seccionesModal.fechas && (
                    <div className='p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div>
                        <label className='text-xs font-semibold text-st-verde uppercase tracking-wider block mb-1'>
                          Fecha y Hora de Inicio
                        </label>
                        <input
                          type='datetime-local'
                          value={formData.fechaInicio}
                          onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                          className='w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all font-medium'
                          required
                        />
                      </div>
                      <div>
                        <label className='text-xs font-semibold text-st-verde uppercase tracking-wider block mb-1'>
                          Fecha y Hora de Fin
                        </label>
                        <input
                          type='datetime-local'
                          value={formData.fechaFin}
                          onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                          className='w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all font-medium'
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Sección Desplegable: Permisos y Visibilidad (solo superadmin) */}
                {esSuperAdmin && (
                  <div className='border border-slate-200 rounded-xl overflow-hidden shadow-xs'>
                    <button
                      type='button'
                      onClick={() => toggleSeccionModal('permisos')}
                      className='w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors'
                    >
                      <span className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                        Permisos y Visibilidad
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${seccionesModal.permisos ? 'rotate-180' : ''}`} />
                    </button>
                    {seccionesModal.permisos && (
                      <div className='p-4 bg-white border-t border-slate-200 flex items-center justify-between'>
                        <div>
                          <p className='text-xs font-bold text-slate-800'>Visible para Coordinadores</p>
                          <p className='text-xs text-slate-500'>
                            Permite que los usuarios con perfil de Coordinador puedan ver y gestionar este evento.
                          </p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={formData.visibleCoordinador}
                            onChange={e => setFormData({ ...formData, visibleCoordinador: e.target.checked })}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-st-verde"></div>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Sección Desplegable: Configuración de Acreditación con Cabecera Institucional */}
                <div className='border border-emerald-200/80 rounded-xl overflow-hidden shadow-xs'>
                  <button
                    type='button'
                    onClick={() => toggleSeccionModal('acreditacion')}
                    className='w-full flex items-center justify-between px-4 py-2.5 bg-emerald-50/80 hover:bg-emerald-100/70 border-b border-emerald-100 text-left transition-colors'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-st-verde'></span>
                      <span className='text-xs font-bold text-st-verde uppercase tracking-wider'>
                        Configuración de Acreditación
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {camposDisponiblesEvento && (
                        <span className='text-[10px] text-st-verde font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs'>
                          Excel Vinculado
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-st-verde transform transition-transform duration-200 ${seccionesModal.acreditacion ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {seccionesModal.acreditacion && (
                    <div className='p-4 bg-white space-y-4'>
                      
                      {/* Formato del Nombre (Dropdown select institucional) */}
                      <div>
                        <label className='text-xs font-bold text-st-verde uppercase tracking-wider block mb-1'>
                          Formato del Nombre en Pantalla
                        </label>
                        <select
                          value={formData.configuracionAsistencia?.modoNombre || 'completo'}
                          onChange={e => {
                            const modo = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              configuracionAsistencia: {
                                ...(prev.configuracionAsistencia || DEFAULT_CONFIG_ASISTENCIA),
                                modoNombre: modo,
                              },
                            }));
                          }}
                          className='w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-st-verde/20 focus:border-st-verde outline-none transition-all'
                        >
                          <option value='completo'>Nombre Completo</option>
                          <option value='soloNombre'>Solo Nombres</option>
                          <option value='primerNombre'>Únicamente Primer Nombre</option>
                          <option value='separado'>Nombres y Apellidos en Filas Separadas</option>
                        </select>
                      </div>

                      {/* Casillas Visibles en Pantalla */}
                      <div>
                        <div className='flex items-center justify-between mb-2'>
                          <label className='text-xs font-bold text-st-verde uppercase tracking-wider block'>
                            Casillas Mostradas al Ingresar el RUT
                          </label>
                          {camposDisponiblesEvento && (
                            <span className='text-[10px] text-slate-500 font-medium'>
                              Filtrado por columnas del Excel
                            </span>
                          )}
                        </div>

                        {cargandoCampos ? (
                          <p className='text-xs text-slate-400 py-2'>Analizando campos del Excel...</p>
                        ) : (
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                            {[
                              { key: 'mostrarRut', label: 'RUT' },
                              { key: 'mostrarCarrera', label: 'Carrera' },
                              { key: 'mostrarInstitucion', label: 'Institución' },
                              { key: 'mostrarCargo', label: 'Cargo' },
                              { key: 'mostrarComuna', label: 'Comuna' },
                              { key: 'mostrarAsiento', label: 'Asiento' },
                              { key: 'mostrarGrupo', label: 'Grupo' },
                              { key: 'mostrarNumeroLista', label: 'N° de Lista' },
                              { key: 'mostrarDistincion', label: 'Distinción' },
                              { key: 'mostrarReconocimiento', label: 'Reconocimiento' },
                            ]
                            .filter(item => {
                              if (camposDisponiblesEvento) {
                                return Boolean(camposDisponiblesEvento[item.key]);
                              }
                              return true;
                            })
                            .map(item => {
                              const checked = formData.configuracionAsistencia?.[item.key] !== false;
                              return (
                                <button
                                  key={item.key}
                                  type='button'
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      configuracionAsistencia: {
                                        ...(prev.configuracionAsistencia || DEFAULT_CONFIG_ASISTENCIA),
                                        [item.key]: !checked,
                                      },
                                    }));
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer select-none text-xs ${
                                    checked
                                      ? 'bg-emerald-50/70 border-st-verde text-slate-900 font-semibold shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/60'
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  <div
                                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ml-1.5 ${
                                      checked ? 'bg-st-verde border-st-verde text-white' : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {checked && (
                                      <svg className='w-2.5 h-2.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Vista Previa Desplegable */}
                      <div className='border border-slate-200 rounded-lg overflow-hidden'>
                        <button
                          type='button'
                          onClick={() => toggleSeccionModal('vistaPrevia')}
                          className='w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-emerald-50/40 text-left transition-colors'
                        >
                          <div className='flex items-center gap-2'>
                            <Eye className='w-3.5 h-3.5 text-st-verde' />
                            <span className='text-[11px] font-bold text-st-verde uppercase tracking-wider'>
                              Vista Previa en Pantalla de Acreditación
                            </span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-st-verde transform transition-transform duration-200 ${seccionesModal.vistaPrevia ? 'rotate-180' : ''}`} />
                        </button>
                        {seccionesModal.vistaPrevia && (
                          <div className='p-3.5 bg-white border-t border-slate-100 divide-y divide-slate-100 text-xs'>
                            {(() => {
                              const modo = formData.configuracionAsistencia?.modoNombre || 'completo';
                              const nomSample = sampleAlumno?.nombres || 'Vicente Augusto';
                              const apeSample = sampleAlumno?.apellidos || 'Flores Topp';
                              const nomCompletoSample = sampleAlumno?.nombre || `${nomSample} ${apeSample}`.trim();
                              if (modo === 'soloNombre') {
                                return (
                                  <div className='flex justify-between py-1'>
                                    <span className='text-slate-500'>Nombre</span>
                                    <span className='text-st-verde font-bold'>{nomSample}</span>
                                  </div>
                                );
                              }
                              if (modo === 'primerNombre') {
                                return (
                                  <div className='flex justify-between py-1'>
                                    <span className='text-slate-500'>Nombre</span>
                                    <span className='text-st-verde font-bold'>{nomSample.split(' ')[0]}</span>
                                  </div>
                                );
                              }
                              if (modo === 'separado') {
                                return (
                                  <>
                                    <div className='flex justify-between py-1'>
                                      <span className='text-slate-500'>Nombres</span>
                                      <span className='text-st-verde font-bold'>{nomSample}</span>
                                    </div>
                                    <div className='flex justify-between py-1'>
                                      <span className='text-slate-500'>Apellidos</span>
                                      <span className='text-slate-800 font-semibold'>{apeSample}</span>
                                    </div>
                                  </>
                                );
                              }
                              return (
                                <div className='flex justify-between py-1'>
                                  <span className='text-slate-500'>Nombre Completo</span>
                                  <span className='text-st-verde font-bold'>{nomCompletoSample}</span>
                                </div>
                              );
                            })()}
                            {formData.configuracionAsistencia?.mostrarRut !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarRut) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>RUT</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.rut || '21.394.866-0'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarCarrera !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarCarrera) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Carrera</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.carrera || 'Ingeniería en Informática'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarInstitucion !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarInstitucion) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Institución</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.institucion || sampleAlumno?.establecimiento || 'Santo Tomás'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarCargo !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarCargo) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Cargo</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.cargo || 'Coordinador'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarComuna !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarComuna) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Comuna</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.comuna || 'Santiago'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarAsiento !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarAsiento) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Asiento</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.asiento || 'C7'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarGrupo !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarGrupo) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Grupo</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.grupo ? `Grupo ${sampleAlumno.grupo}` : 'Grupo 1'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarNumeroLista !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarNumeroLista) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>N° de Lista</span>
                                <span className='text-slate-800 font-semibold'>{sampleAlumno?.numeroLista || '15'}</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarDistincion !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarDistincion) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Distinción</span>
                                <span className='text-slate-800 font-semibold'>Distinción Máxima</span>
                              </div>
                            )}
                            {formData.configuracionAsistencia?.mostrarReconocimiento !== false && (!camposDisponiblesEvento || camposDisponiblesEvento.mostrarReconocimiento) && (
                              <div className='flex justify-between py-1'>
                                <span className='text-slate-500'>Reconocimiento</span>
                                <span className='text-slate-800 font-semibold'>Reconocimiento Especial</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Carga de Participantes desde Excel */}
                {editingEvento && (
                  <div className='pt-1'>
                    <button
                      type='button'
                      onClick={() => setShowImportModal(true)}
                      className='w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:border-st-verde hover:text-st-verde hover:bg-emerald-50/20 transition-colors'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' />
                      </svg>
                      Importar o Actualizar Participantes desde Excel
                    </button>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className='pt-3 flex gap-3 justify-end border-t border-slate-100'>
                  <button
                    type='button'
                    onClick={handleCerrarModal}
                    className='px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    className='px-5 py-2 text-sm bg-st-verde text-white font-semibold rounded-lg hover:bg-[#004b30] transition-all shadow-sm'
                  >
                    {editingEvento ? 'Guardar Cambios' : 'Crear Evento'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Import Modal */}
      {showModal && showImportModal && (
        <motion.div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ImportExcel
            onClose={() => setShowImportModal(false)}
            eventoId={editingEvento?.id}
            tipoEvento={editingEvento?.tipo || 'alumnos'}
          />
        </motion.div>
      )}

      {/* Modal Popup para Confirmar Desactivación de Evento (Color Institucional Santo Tomás) */}
      <AnimatePresence>
        {eventoADesactivar && (
          <motion.div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !desactivando && setEventoADesactivar(null)}
          >
            <motion.div
              className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100'
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header Institucional */}
              <div className='bg-st-verde px-6 py-4 text-white'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0'>
                      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
                      </svg>
                    </div>
                    <div>
                      <h3 className='text-lg font-bold leading-tight'>
                        ¿Desactivar Evento?
                      </h3>
                      <p className='text-green-100 text-xs mt-0.5'>
                        Confirmación de estado del evento
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !desactivando && setEventoADesactivar(null)}
                    className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors text-white'
                  >
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className='p-6'>
                <p className='text-sm text-slate-600 mb-3'>
                  Estás a punto de desactivar el siguiente evento:
                </p>

                <div className='w-full bg-st-pastel/70 border border-st-verde/20 rounded-xl p-3.5 mb-4'>
                  <p className='font-bold text-st-verde text-sm md:text-base leading-snug break-words'>
                    {eventoADesactivar.nombre}
                  </p>
                </div>

                <p className='text-xs text-slate-500 leading-relaxed mb-6'>
                  Al desactivarlo, los participantes no podrán registrar su asistencia en el sistema hasta que el evento vuelva a ser activado.
                </p>

                <div className='flex items-center gap-3 w-full'>
                  <button
                    type='button'
                    onClick={() => setEventoADesactivar(null)}
                    disabled={desactivando}
                    className='flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                  <button
                    type='button'
                    onClick={confirmarDesactivar}
                    disabled={desactivando}
                    className='flex-1 py-2.5 px-4 bg-st-verde hover:bg-[#004b30] active:scale-98 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-st-verde/20 flex items-center justify-center gap-2 disabled:opacity-50'
                  >
                    {desactivando ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                        Desactivando...
                      </>
                    ) : (
                      'Sí, desactivar'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EventosPanel;
