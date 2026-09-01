import React, { useState, useMemo, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from './components/ui/Alert';
import { actualizarPresencia } from './services/alumnosService';
import useAlumnosEvento from './hooks/useAlumnosEvento';
import useEventos from './hooks/useEventos';
import { Inicio, Footer } from './components/ui';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import AlumnosLista from './components/alumnos/AlumnosLista';
import TrabajadoresLista from './components/trabajadores/TrabajadoresLista';
import TrabajadoresResumen from './components/trabajadores/TrabajadoresResumen';

// Loader
function Loader() {
  return (
    <div className='min-h-screen bg-white flex flex-col items-center justify-center animate-fadeIn'>
      <div className='text-center flex flex-col items-center gap-4'>
        <div className='h-16 w-16 border-4 border-green-300 border-t-green-700 rounded-full animate-spin' />
        <p className='text-green-800 text-xl font-medium tracking-wide animate-pulse'>
          Cargando datos...
        </p>
      </div>
    </div>
  );
}

// Error
function ErrorMessage({ error }) {
  return (
    <div className='min-h-screen bg-white flex flex-col items-center justify-center'>
      <div className='text-center'>
        <p className='text-red-600 text-xl mb-4'>Error al cargar los datos</p>
        <button
          onClick={() => window.location.reload()}
          className='bg-green-800 text-white px-4 py-2 rounded mr-2'
        >
          Reintentar
        </button>
        <div className='text-gray-500 mt-2 text-sm'>{error}</div>
      </div>
    </div>
  );
}

function App() {
  // Custom hook para la lógica de alumnos
  const { alumnos, loading, error } = useAlumnosEvento();

  // Hook para eventos
  const { eventoActivo } = useEventos();

  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorVisual, setErrorVisual] = useState('');
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);

  // Filtros para el modal de alumnos
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroRUT, setFiltroRUT] = useState('');
  const [soloPresentes, setSoloPresentes] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  // Estado de autenticación, rol y permisos del usuario
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('user_role') || null;
  });
  const [userPermissions, setUserPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user_permissions')) || null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(userRole);
  const isAdmin = userRole === 'admin';
  const tieneAccesoPanel = isAdmin || userRole === 'coordinador' || Boolean(
    userPermissions?.eventos || userPermissions?.participantes || userPermissions?.usuarios
  );

  // Controlar el scroll según modales
  useEffect(() => {
    if (showAlumnosModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAlumnosModal]);

  // Filtrado para el modal de alumnos (Inicio), incluyendo grupo
  const alumnosFiltradosModal = useMemo(() => {
    let filtrados = alumnos.filter(
      alumno =>
        (filtroCarrera === '' || alumno.carrera === filtroCarrera) &&
        (filtroInstitucion === '' ||
          alumno.institucion === filtroInstitucion) &&
        (filtroRUT === '' || alumno.rut.includes(filtroRUT))
    );
    if (filtroGrupo) {
      const grupoNum = Number(filtroGrupo);
      filtrados = filtrados.filter(alumno => Number(alumno.grupo) === grupoNum);
    }
    return filtrados;
  }, [alumnos, filtroCarrera, filtroInstitucion, filtroRUT, filtroGrupo]);

  // Login de alumno
  const handleLogin = async rut => {
    try {
      if (!eventoActivo) {
        setErrorVisual('No hay un evento activo en este momento.');
        return null;
      }

      const cleanTarget = String(rut || '').replace(/[^0-9kK]/gi, '').toUpperCase();
      const alumno = alumnos.find(a => {
        if (!a.rut) return false;
        return String(a.rut).replace(/[^0-9kK]/gi, '').toUpperCase() === cleanTarget;
      });

      if (alumno) {
        // Actualizar presencia incluso si ya está presente (para actualizar fecha)
        await actualizarPresencia(alumno.id, true, eventoActivo.id);
        const actualizado = { ...alumno, presente: true };
        setUsuario(actualizado);
        return actualizado;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error en handleLogin:', error);
      return null;
    }
  };

  // Mostrar confirmación solo 2 segundos y volver al login
  useEffect(() => {
    let timeout;
    if (showConfirm) {
      timeout = setTimeout(() => {
        setUsuario(null);
        setShowConfirm(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [showConfirm]);

  // Ocultar errorVisual después de 2 segundos
  useEffect(() => {
    if (errorVisual) {
      const timeout = setTimeout(() => setErrorVisual(''), 2000);
      return () => clearTimeout(timeout);
    }
  }, [errorVisual]);

  // Actualizar usuario si cambia el estado de alumnos
  useEffect(() => {
    if (usuario) {
      const actualizado = alumnos.find(a => a.rut === usuario.rut);
      if (actualizado) setUsuario(actualizado);
    }
  }, [alumnos, usuario]);

  // Manejo de autenticación institucional (Admin, Coordinador u Operador)
  const handleAuth = (authData) => {
    let rolFinal = 'usuario';
    let permisosFinal = null;

    if (typeof authData === 'string') {
      rolFinal = authData === 'usuario' || authData === 'operador' ? 'usuario' : 'admin';
    } else if (authData && typeof authData === 'object') {
      rolFinal = authData.rol || 'usuario';
      permisosFinal = authData.permisos || null;
    }

    setUserRole(rolFinal);
    setUserPermissions(permisosFinal);
    localStorage.setItem('user_role', rolFinal);
    localStorage.setItem('user_permissions', JSON.stringify(permisosFinal));
    localStorage.setItem('adminAuthenticated', rolFinal === 'admin' ? 'true' : 'false');

    const tieneAcceso = rolFinal === 'admin' || rolFinal === 'coordinador' || Boolean(
      permisosFinal?.eventos || permisosFinal?.participantes || permisosFinal?.usuarios
    );

    if (tieneAcceso) {
      navigate('/panel');
    } else {
      navigate('/asistencia');
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    setShowAlumnosModal(false);
    setFiltroCarrera('');
    setFiltroInstitucion('');
    setFiltroRUT('');
    setSoloPresentes('');
    setFiltroGrupo('');

    setUserRole(null);
    setUserPermissions(null);
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('adminAuthenticated');
    navigate('/');
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  const esEventoTrabajadores = eventoActivo?.tipo === 'trabajadores';

  // Determinar clases del contenedor según la ruta
  const getContainerClasses = () => {
    if (location.pathname === '/panel') {
      return 'bg-white flex flex-col';
    }
    if (location.pathname === '/' && !isAuthenticated) {
      return 'min-h-screen bg-slate-900 flex flex-col w-full';
    }
    return 'min-h-screen bg-white flex flex-col';
  };

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence>
        {showAlumnosModal && (
          <motion.div
            className='fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            key='modal-bg'
          >
            <motion.div
              className='bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-6xl w-full relative max-h-[95vh] overflow-auto'
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              key='modal-content'
            >
              <button
                onClick={() => setShowAlumnosModal(false)}
                className='absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors'
              >
                ✕
              </button>
              <h2 className='text-xl font-bold mb-4 text-green-800'>
                {esEventoTrabajadores
                  ? 'Lista de Funcionarios'
                  : 'Lista de Alumnos'}
              </h2>
              {esEventoTrabajadores ? (
                <TrabajadoresLista
                  trabajadores={alumnosFiltradosModal}
                  filtroRUT={filtroRUT}
                  setFiltroRUT={setFiltroRUT}
                />
              ) : (
                <AlumnosLista
                  alumnos={alumnosFiltradosModal}
                  filtroCarrera={filtroCarrera}
                  setFiltroCarrera={setFiltroCarrera}
                  filtroInstitucion={filtroInstitucion}
                  setFiltroInstitucion={setFiltroInstitucion}
                  filtroRUT={filtroRUT}
                  setFiltroRUT={setFiltroRUT}
                  filtroGrupo={filtroGrupo}
                  setFiltroGrupo={setFiltroGrupo}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`flex-1 flex flex-col w-full ${
          location.pathname === '/panel'
            ? ''
            : location.pathname === '/' && !isAuthenticated
              ? 'min-h-screen w-full p-0 m-0'
              : 'min-h-screen flex items-center justify-center px-2'
        }`}
      >
        <div
          className={`w-full flex flex-col ${
            location.pathname === '/panel' || (location.pathname === '/' && !isAuthenticated)
              ? ''
              : 'items-center justify-center'
          }`}
        >
          <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
              {/* Ruta Principal: Iniciar Sesión (Login) */}
              <Route
                path='/'
                element={
                  isAuthenticated ? (
                    <Navigate to={isAdmin ? '/panel' : '/asistencia'} replace />
                  ) : (
                    <motion.div
                      key='main-login'
                      initial={{ opacity: 0, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(6px)' }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className='w-full min-h-screen'
                    >
                      <AdminLogin
                        onAuth={handleAuth}
                      />
                    </motion.div>
                  )
                }
              />

              {/* Ruta de Ingreso de Asistencia (RUT) */}
              <Route
                 path='/asistencia'
                 element={
                   !isAuthenticated ? (
                     <Navigate to='/' replace />
                   ) : (
                     <motion.div
                       key='asistencia-view'
                       initial={{ opacity: 0, filter: 'blur(6px)' }}
                       animate={{ opacity: 1, filter: 'blur(0px)' }}
                       exit={{ opacity: 0, filter: 'blur(6px)' }}
                       transition={{ duration: 0.35, ease: 'easeInOut' }}
                       className='w-full flex flex-col items-center justify-center'
                     >
                       <Inicio
                         className='w-full'
                         onLogin={handleLogin}
                         setErrorVisual={setErrorVisual}
                         errorVisual={errorVisual}
                         eventoActivo={eventoActivo}
                         onInfoClick={() => setShowAlumnosModal(true)}
                         onAdminClick={tieneAccesoPanel ? () => navigate('/panel') : null}
                         onLogout={handleLogout}
                         userRole={userRole}
                         userPermissions={userPermissions}
                         showButtons={!showAlumnosModal}
                       />
                     </motion.div>
                   )
                 }
              />

              {/* Ruta del Panel de Administración */}
              <Route
                 path='/panel'
                 element={
                   !isAuthenticated ? (
                     <Navigate to='/' replace />
                   ) : !tieneAccesoPanel ? (
                     <Navigate to='/asistencia' replace />
                   ) : (
                     <motion.div
                       key='admin-panel'
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 0.2 }}
                       className='w-full flex flex-col items-center justify-center'
                     >
                       <AdminPanel 
                         onSalir={handleLogout} 
                         onIrAsistencia={() => navigate('/asistencia')} 
                         userRole={userRole}
                         userPermissions={userPermissions}
                       />
                     </motion.div>
                   )
                 }
              />

              {/* Redirección para rutas desconocidas o legacy como /admin */}
              <Route
                path='/admin'
                element={<Navigate to='/' replace />}
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
