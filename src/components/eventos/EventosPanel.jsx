import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  crearEvento,
  actualizarEvento,
  activarEvento,
  eliminarEvento,
  probarConexionFirestore,
} from '../../services/eventosService';
import ImportExcel from '../admin/ImportExcel';

function EventosPanel({ eventos, eventoActivo: _eventoActivo, onEventoChange }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('alumnos'); // 'alumnos', 'trabajadores'
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    activo: false,
    tipo: 'alumnos',
  });
  const [mensaje, setMensaje] = useState('');

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
        setFormData({
          nombre: '',
          descripcion: '',
          fechaInicio: '',
          fechaFin: '',
          activo: false,
          tipo: 'alumnos',
        });
      } else {
        // Crear el evento y cerrar el modal
        await crearEvento(formData);
        setMensaje('Evento creado correctamente');
        setShowModal(false);
        setFormData({
          nombre: '',
          descripcion: '',
          fechaInicio: '',
          fechaFin: '',
          activo: false,
          tipo: 'alumnos',
        });
      }

      if (onEventoChange) onEventoChange();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setMensaje(
        `Error: ${error.message || 'Error desconocido al procesar el evento'}`
      );
    }
  };

  const handleEdit = evento => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio,
      fechaFin: evento.fechaFin,
      activo: evento.activo,
      tipo: evento.tipo || 'alumnos',
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

      // Si el evento está activo, pedir confirmación para desactivarlo
      if (evento.activo) {
        const confirmar = window.confirm(
          `¿Estás seguro de que quieres desactivar el evento "${evento.nombre}"?\n\nEsto afectará el registro de asistencia.`
        );
        if (!confirmar) return;

        await actualizarEvento(eventoId, { activo: false });
        setMensaje('Evento desactivado correctamente');
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
    setFormData({
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      activo: false,
      tipo: 'alumnos',
    });
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
      {/* Stats Header */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
        <div className='bg-white rounded-xl p-4 border border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-st-verde/10 rounded-lg flex items-center justify-center'>
              <svg className='w-5 h-5 text-st-verde' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{eventos.length}</p>
              <p className='text-xs text-slate-500'>Total Eventos</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-5 h-5 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{eventos.filter(e => e.activo).length}</p>
              <p className='text-xs text-slate-500'>Activos</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg className='w-5 h-5 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
              </svg>
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{eventos.filter(e => (e.tipo || 'alumnos') === 'alumnos').length}</p>
              <p className='text-xs text-slate-500'>Alumnos</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
              <svg className='w-5 h-5 text-purple-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
              </svg>
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{eventos.filter(e => e.tipo === 'trabajadores').length}</p>
              <p className='text-xs text-slate-500'>Funcionarios</p>
            </div>
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

          {/* Create Button */}
          <button
            onClick={() => setShowModal(true)}
            className='flex items-center justify-center gap-2 bg-st-verde text-white px-5 py-2.5 rounded-lg hover:bg-[#004b30] transition-colors font-medium text-sm shadow-sm'
          >
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {mensaje && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${mensaje.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
            }`}
        >
          <svg className={`w-5 h-5 ${mensaje.includes('Error') ? 'text-red-500' : 'text-green-500'}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={mensaje.includes('Error') ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
          <span className='text-sm font-medium'>{mensaje}</span>
        </motion.div>
      )}

      {/* Events Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {eventos
          .filter(evento => (evento.tipo || 'alumnos') === filtroTipo)
          .map(evento => (
            <motion.div
              key={evento.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${evento.activo ? 'border-st-verde' : 'border-slate-200'
                }`}
            >
              {/* Event Header with Status */}
              <div className={`px-5 py-3 ${evento.activo ? 'bg-st-verde' : 'bg-slate-100'}`}>
                <div className='flex items-center justify-between'>
                  <span className={`text-sm font-bold ${evento.activo ? 'text-white' : 'text-slate-600'}`}>
                    {evento.activo ? '● EVENTO ACTIVO' : '○ Inactivo'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${evento.tipo === 'trabajadores'
                    ? 'bg-blue-100 text-blue-700'
                    : evento.activo ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                    }`}>
                    {evento.tipo === 'trabajadores' ? 'Funcionarios' : 'Alumnos'}
                  </span>
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
                  <button
                    onClick={() => handleEliminar(evento.id)}
                    className='p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors'
                    title='Eliminar'
                  >
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Empty State */}
      {eventos.filter(evento => (evento.tipo || 'alumnos') === filtroTipo).length === 0 && (
        <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
          <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-slate-900 mb-1'>No hay eventos</h3>
          <p className='text-slate-500 text-sm mb-4'>Crea tu primer evento para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className='inline-flex items-center gap-2 bg-st-verde text-white px-4 py-2 rounded-lg hover:bg-[#004b30] transition-colors text-sm font-medium'
          >
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Crear Evento
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <motion.div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCerrarModal}
        >
          <motion.div
            className='bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden'
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className='bg-st-verde px-6 py-4 text-white'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-bold'>
                    {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                  </h3>
                  <p className='text-green-100 text-sm'>
                    {editingEvento ? 'Modifica los datos del evento' : 'Completa los datos para crear un evento'}
                  </p>
                </div>
                <button
                  onClick={handleCerrarModal}
                  className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors'
                >
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-6 max-h-[60vh] overflow-y-auto'>
              <form onSubmit={handleSubmit} className='space-y-5'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1.5'>Nombre del Evento</label>
                  <input
                    type='text'
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-st-verde focus:ring-1 focus:ring-st-verde outline-none transition-colors text-sm'
                    placeholder='Ej: Ceremonia de Graduación'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1.5'>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-st-verde focus:ring-1 focus:ring-st-verde outline-none transition-colors text-sm resize-none'
                    placeholder='Describe el evento...'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1.5'>Fecha Inicio</label>
                    <input
                      type='datetime-local'
                      value={formData.fechaInicio}
                      onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-st-verde focus:ring-1 focus:ring-st-verde outline-none transition-colors text-sm'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1.5'>Fecha Fin</label>
                    <input
                      type='datetime-local'
                      value={formData.fechaFin}
                      onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                      className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-st-verde focus:ring-1 focus:ring-st-verde outline-none transition-colors text-sm'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1.5'>Tipo de Evento</label>
                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={() => setFormData({ ...formData, tipo: 'alumnos' })}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formData.tipo === 'alumnos'
                        ? 'border-st-verde bg-st-verde/10 text-st-verde'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      Alumnos
                    </button>
                    <button
                      type='button'
                      onClick={() => setFormData({ ...formData, tipo: 'trabajadores' })}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formData.tipo === 'trabajadores'
                        ? 'border-st-verde bg-st-verde/10 text-st-verde'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      Funcionarios
                    </button>
                  </div>
                </div>

                {editingEvento && (
                  <div className='pt-2'>
                    <button
                      type='button'
                      onClick={() => setShowImportModal(true)}
                      className='w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-st-verde hover:text-st-verde transition-colors text-sm'
                    >
                      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' />
                      </svg>
                      Importar desde Excel
                    </button>
                  </div>
                )}

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={handleCerrarModal}
                    className='flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    className='flex-1 py-2.5 bg-st-verde text-white rounded-lg font-medium hover:bg-[#004b30] transition-colors text-sm'
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
    </div>
  );
}

export default EventosPanel;
