/**
 * @typedef {Object} Alumno
 * @property {string} id - ID único del alumno
 * @property {string} rut - RUT del alumno
 * @property {string} nombre - Nombre completo del alumno
 * @property {string} email - Email del alumno
 * @property {string} carrera - Carrera del alumno
 * @property {string} institucion - Institución del alumno
 * @property {string} [grupo] - Grupo del alumno (opcional)
 * @property {string} [asiento] - Asiento asignado (opcional)
 * @property {boolean} presente - Estado de asistencia
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} Evento
 * @property {string} id - ID único del evento
 * @property {string} nombre - Nombre del evento
 * @property {string} descripcion - Descripción del evento
 * @property {Date} fechaInicio - Fecha de inicio del evento
 * @property {Date} fechaFin - Fecha de fin del evento
 * @property {string} ubicacion - Ubicación del evento
 * @property {boolean} activo - Estado del evento
 * @property {number} capacidad - Capacidad máxima del evento
 * @property {string} [organizador] - Organizador del evento (opcional)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} Asistencia
 * @property {string} id - ID único de la asistencia
 * @property {string} alumnoId - ID del alumno
 * @property {string} eventoId - ID del evento
 * @property {Date} fechaAsistencia - Fecha y hora de la asistencia
 * @property {string} [observaciones] - Observaciones adicionales (opcional)
 * @property {Date} createdAt - Fecha de creación
 */

/**
 * @typedef {Object} Usuario
 * @property {string} id - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {string} nombre - Nombre del usuario
 * @property {string} rol - Rol del usuario (admin, usuario)
 * @property {boolean} activo - Estado del usuario
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} Estadisticas
 * @property {number} totalAlumnos - Total de alumnos registrados
 * @property {number} totalEventos - Total de eventos creados
 * @property {number} eventosActivos - Eventos activos actualmente
 * @property {number} totalAsistencias - Total de asistencias registradas
 * @property {number} asistenciasHoy - Asistencias registradas hoy
 * @property {Object} asistenciasPorEvento - Asistencias agrupadas por evento
 */

// Exportar tipos para uso en JSDoc
export const TYPES = {
  Alumno: 'Alumno',
  Evento: 'Evento',
  Asistencia: 'Asistencia',
  Usuario: 'Usuario',
  Estadisticas: 'Estadisticas',
};
