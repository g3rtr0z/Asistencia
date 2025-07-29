import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { crearEvento, actualizarEvento, activarEvento, eliminarEvento, probarConexionFirestore } from '../../services/eventosService';
import ImportExcel from '../admin/ImportExcel';

function EventosPanel({ eventos, eventoActivo, onEventoChange }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    activo: false
  });
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Probar conexión antes de proceder
      const conexionOk = await probarConexionFirestore();
      if (!conexionOk) {
        setMensaje('Error: No se puede conectar a la base de datos. Verifica tu conexión a internet.');
        return;
      }

      if (editingEvento) {
        await actualizarEvento(editingEvento.id, formData);
        setMensaje('Evento actualizado correctamente');
        setShowModal(false);
        setEditingEvento(null);
        setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false });
      } else {
        // Crear el evento y cerrar el modal
        await crearEvento(formData);
        setMensaje('Evento creado correctamente');
        setShowModal(false);
        setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false });
      }

      if (onEventoChange) onEventoChange();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setMensaje('Error: ' + (error.message || 'Error desconocido al procesar el evento'));
    }
  };

  const handleEdit = (evento) => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio,
      fechaFin: evento.fechaFin,
      activo: evento.activo
    });
    setShowModal(true);
  };

  const handleActivar = async (eventoId) => {
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
      setMensaje('Error al cambiar estado del evento: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEliminar = async (eventoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await eliminarEvento(eventoId);
        setMensaje('Evento eliminado correctamente');
        if (onEventoChange) onEventoChange();
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        setMensaje('Error al eliminar evento: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setEditingEvento(null);
    setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full">
      {/* Header Mejorado */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestión de Eventos</h2>
            <p className="text-sm text-slate-500">Crea y administra tus eventos</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Evento
        </motion.button>
      </div>

      {/* Mensaje de estado mejorado */}
      {mensaje && (
        <motion.div
          className={`p-4 rounded-xl mb-6 border-l-4 ${
            mensaje.includes('Error')
              ? 'bg-red-50 text-red-700 border-red-500'
              : 'bg-green-50 text-green-700 border-green-500'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${mensaje.includes('Error') ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mensaje.includes('Error') ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            <span className="font-medium">{mensaje}</span>
          </div>
        </motion.div>
      )}

      {/* Lista de eventos mejorada */}
      <div className="grid gap-6">
        {eventos.map((evento) => (
          <motion.div
            key={evento.id}
            className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              evento.activo
                ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-slate-800">{evento.nombre}</h3>
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">{evento.descripcion}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><strong>Inicio:</strong> {formatDate(evento.fechaInicio)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><strong>Fin:</strong> {formatDate(evento.fechaFin)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle para activar/desactivar evento */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {evento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <motion.button
                    onClick={() => handleActivar(evento.id)}
                    title={evento.activo ? 'Desactivar evento' : 'Activar evento'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      evento.activo ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        evento.activo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                <motion.button
                  onClick={() => handleEdit(evento)}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </motion.button>
                <motion.button
                  onClick={() => handleEliminar(evento.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal para crear/editar evento mejorado */}
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingEvento ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {editingEvento ? 'Editar Evento' : 'Crear Evento'}
                    </h3>
                    <p className="text-sm text-green-100">
                      {editingEvento ? 'Modifica los datos del evento' : 'Crea un nuevo evento'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleCerrarModal}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre del Evento */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ingresa el nombre del evento"
                    required
                  />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Fecha de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Fecha de Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox Activo */}
                <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="activo" className="ml-3 text-sm font-medium text-slate-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Activar este evento
                  </label>
                </div>

                {/* Botón para importar base de datos */}
                {editingEvento && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <motion.button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Importar Base de Datos
                    </motion.button>
                  </motion.div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <motion.button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingEvento ? 'Actualizar Evento' : 'Crear Evento'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleCerrarModal}
                    className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-300 transition-all duration-300 font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal para importar Excel */}
      {showImportModal && (
        <motion.div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-green-800">Importar Base de Datos</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <ImportExcel
              eventoId={editingEvento?.id}
              onImportComplete={() => {
                setShowImportModal(false);
                if (onEventoChange) onEventoChange();
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default EventosPanel;
