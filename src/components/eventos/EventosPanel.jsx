import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { crearEvento, actualizarEvento, activarEvento, eliminarEvento, probarConexionFirestore } from '../../services/eventosService';
import ImportExcel from '../admin/ImportExcel';

function EventosPanel({ eventos, eventoActivo, onEventoChange }) {
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
    tipo: 'alumnos'
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
        setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false, tipo: 'alumnos' });
      } else {
        // Crear el evento y cerrar el modal
        await crearEvento(formData);
        setMensaje('Evento creado correctamente');
        setShowModal(false);
        setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false, tipo: 'alumnos' });
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
      activo: evento.activo,
      tipo: evento.tipo || 'alumnos'
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
    setShowImportModal(false);
    setEditingEvento(null);
    setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', activo: false, tipo: 'alumnos' });
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
      {/* Header Optimizado para móviles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-800 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Gestión de Eventos</h2>
            <p className="text-xs sm:text-sm text-slate-500">Crea y administra tus eventos</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-green-800 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Evento
        </motion.button>
      </div>

      {/* Mensaje de estado mejorado */}
      {mensaje && (
        <motion.div
          className={`p-3 sm:p-4 rounded-lg sm:rounded-xl mb-6 border-l-4 ${mensaje.includes('Error')
            ? 'bg-red-50 text-red-700 border-red-500'
            : 'bg-green-50 text-green-700 border-green-500'
            }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${mensaje.includes('Error') ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mensaje.includes('Error') ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            <span className="font-medium text-sm sm:text-base">{mensaje}</span>
          </div>
        </motion.div>
      )}

      {/* Botones de filtro por tipo de evento */}
      <div className="flex justify-center gap-4 mb-6">
        <motion.button
          onClick={() => setFiltroTipo('alumnos')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
            filtroTipo === 'alumnos'
              ? 'bg-green-800 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Eventos de Alumnos
        </motion.button>
        <motion.button
          onClick={() => setFiltroTipo('trabajadores')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
            filtroTipo === 'trabajadores'
              ? 'bg-blue-800 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Eventos para Funcionarios
        </motion.button>
      </div>

      {/* Lista de eventos optimizada para móviles */}
      <div className="grid gap-4 sm:gap-6">
        {eventos
          .filter(evento => {
            const tipoEvento = evento.tipo || 'alumnos';
            return tipoEvento === filtroTipo;
          })
          .map((evento) => (
          <motion.div
            key={evento.id}
            className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border transition-all duration-300 hover:shadow-lg ${evento.activo
              ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">{evento.nombre}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${evento.tipo === 'trabajadores'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                    {evento.tipo === 'trabajadores' ? 'Evento Funcionarios' : 'Evento Alumnos'}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 leading-relaxed">{evento.descripcion}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><strong>Inicio:</strong> {formatDate(evento.fechaInicio)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><strong>Fin:</strong> {formatDate(evento.fechaFin)}</span>
                  </div>
                </div>
              </div>

              {/* Controles optimizados para móviles */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {/* Toggle para activar/desactivar evento */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {evento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <motion.button
                    onClick={() => handleActivar(evento.id)}
                    title={evento.activo ? 'Desactivar evento' : 'Activar evento'}
                    className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${evento.activo ? 'bg-green-800' : 'bg-slate-200'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span
                      className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-sm ${evento.activo ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </motion.button>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <motion.button
                    onClick={() => handleEdit(evento)}
                    className="flex-1 sm:flex-none bg-slate-600 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title="Editar evento"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={() => handleEliminar(evento.id)}
                    className="flex-1 sm:flex-none bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title="Eliminar evento"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal optimizado para móviles */}
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingEvento ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">
                      {editingEvento ? 'Editar Evento' : 'Crear Evento'}
                    </h3>
                    <p className="text-xs sm:text-sm text-green-100">
                      {editingEvento ? 'Modifica los datos del evento' : 'Crea un nuevo evento'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleCerrarModal}
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                    placeholder="Ingresa el nombre del evento"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  >
                    <option value="alumnos">Alumnos</option>
                    <option value="trabajadores">Funcionarios Santo Tomás</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                    Activar evento inmediatamente
                  </label>
                </div>

                {/* Botón de Importar Excel - solo visible al editar */}
                {editingEvento && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">Importar Alumnos</h4>
                        <p className="text-xs text-slate-500">Agrega alumnos desde un archivo Excel</p>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Importar Excel
                      </motion.button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={handleCerrarModal}
                    className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingEvento ? 'Actualizar' : 'Crear'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Importación - movido dentro del modal de editar */}
      {showModal && showImportModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
