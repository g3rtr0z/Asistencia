// Rutas de la aplicación
export const ROUTES = {
  // Rutas principales
  HOME: '/',
  LOGIN: '/login',
  ADMIN: '/admin',

  // Rutas de eventos
  EVENTOS: '/eventos',
  EVENTO_DETALLE: '/eventos/:id',
  EVENTO_NUEVO: '/eventos/nuevo',
  EVENTO_EDITAR: '/eventos/:id/editar',

  // Rutas de alumnos
  ALUMNOS: '/alumnos',
  ALUMNO_DETALLE: '/alumnos/:id',
  ALUMNO_NUEVO: '/alumnos/nuevo',
  ALUMNO_EDITAR: '/alumnos/:id/editar',

  // Rutas de administración
  ADMIN_PANEL: '/admin/panel',
  ADMIN_EVENTOS: '/admin/eventos',
  ADMIN_ALUMNOS: '/admin/alumnos',
  ADMIN_ESTADISTICAS: '/admin/estadisticas',
  ADMIN_IMPORTAR: '/admin/importar',
  ADMIN_EXPORTAR: '/admin/exportar',

  // Rutas de configuración
  CONFIGURACION: '/configuracion',
  PERFIL: '/perfil',
};

// Nombres de rutas para navegación
export const ROUTE_NAMES = {
  [ROUTES.HOME]: 'Inicio',
  [ROUTES.LOGIN]: 'Iniciar Sesión',
  [ROUTES.ADMIN]: 'Administración',
  [ROUTES.EVENTOS]: 'Eventos',
  [ROUTES.ALUMNOS]: 'Alumnos',
  [ROUTES.ADMIN_PANEL]: 'Panel de Administración',
  [ROUTES.ADMIN_EVENTOS]: 'Gestión de Eventos',
  [ROUTES.ADMIN_ALUMNOS]: 'Gestión de Alumnos',
  [ROUTES.ADMIN_ESTADISTICAS]: 'Estadísticas',
  [ROUTES.ADMIN_IMPORTAR]: 'Importar Datos',
  [ROUTES.ADMIN_EXPORTAR]: 'Exportar Datos',
  [ROUTES.CONFIGURACION]: 'Configuración',
  [ROUTES.PERFIL]: 'Mi Perfil',
};
