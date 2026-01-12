import React, { useState, useMemo } from 'react';
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
import { actualizarPresencia } from './services/alumnosService';
import useAlumnosEvento from './hooks/useAlumnosEvento';
import useEventos from './hooks/useEventos';
import { Inicio, Footer } from './components/ui';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import AlumnosLista from './components/alumnos/AlumnosLista';
import EstadisticasPanel from './components/alumnos/EstadisticasPanel';
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
  // const [filtroEstado] = useState('todos'); // No se usa actualmente
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorVisual, setErrorVisual] = useState('');
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);

  // Filtros para el modal de alumnos
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroRUT, setFiltroRUT] = useState('');
  const [soloPresentes, setSoloPresentes] = useState('');
  // Restaurar estado de autenticación desde localStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('adminAuthenticated');
    return savedAuth === 'true';
  });
  const [filtroGrupo, setFiltroGrupo] = useState('');

  // Controlar el scroll según la ruta y modales
  React.useEffect(() => {
    if (location.pathname === '/admin' || showAlumnosModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [location.pathname, showAlumnosModal]);

  // Filtrado para la vista de admin (memorizado) - comentado porque no se usa actualmente
  // const alumnosFiltrados = useMemo(() => {
  //   if (filtroEstado === 'presentes') {
  //     return alumnos.filter(a => a.presente);
  //   } else if (filtroEstado === 'ausentes') {
  //     return alumnos.filter(a => !a.presente);
  //   }
  //   return alumnos;
  // }, [alumnos, filtroEstado]);

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
        return;
      }

      const alumno = alumnos.find(a => a.rut === rut);
      if (alumno) {
        await actualizarPresencia(alumno.id, true, eventoActivo.id);
        const actualizado = { ...alumno, presente: true };
        setUsuario(actualizado);
        setShowConfirm(true);
        return actualizado;
      } else {
        setErrorVisual(
          'RUT no encontrado en la base de datos del evento activo.'
        );
      }
    } catch (_error) {
      setErrorVisual('Error al procesar el RUT. Inténtalo de nuevo.');
    }
  };

  // Mostrar confirmación solo 2 segundos y volver al login
  React.useEffect(() => {
    let timeout;
    if (showConfirm) {
      timeout = setTimeout(() => {
        setUsuario(null);
        setShowConfirm(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [showConfirm]);

  // Ocultar errorVisual después de 1 segundo
  React.useEffect(() => {
    if (errorVisual) {
      const timeout = setTimeout(() => setErrorVisual(''), 2000);
      return () => clearTimeout(timeout);
    }
  }, [errorVisual]);

  // Actualizar usuario si cambia el estado de alumnos
  React.useEffect(() => {
    if (usuario) {
      const actualizado = alumnos.find(a => a.rut === usuario.rut);
      if (actualizado) setUsuario(actualizado);
    }
  }, [alumnos, usuario]);

  // Restaurar sesión al cargar la aplicación
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuthenticated');
    if (savedAuth === 'true' && location.pathname === '/panel') {
      setIsAdminAuthenticated(true);
    }
  }, [location.pathname]);

  // Acciones admin
  const handleAdminClick = () => navigate('/admin');
  const handleAuthAdmin = () => {
    setIsAdminAuthenticated(true);
    // Guardar estado de autenticación en localStorage
    localStorage.setItem('adminAuthenticated', 'true');
    navigate('/panel');
  };
  const handleSalirAdmin = () => {
    // Limpiar todos los estados de autenticación y navegación
    setShowAlumnosModal(false);

    // Limpiar filtros del modal de alumnos
    setFiltroCarrera('');
    setFiltroInstitucion('');
    setFiltroRUT('');
    setSoloPresentes('');
    setFiltroGrupo('');

    // Desautenticar y limpiar localStorage
    setIsAdminAuthenticated(false);
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
    if (location.pathname === '/admin') {
      return 'min-h-screen bg-white flex flex-col items-center justify-center';
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
                className='absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600'
                title='Cerrar'
              >
                ×
              </button>
              <h2 className='text-xl font-bold mb-4 text-green-800'>
                {esEventoTrabajadores
                  ? 'Lista de Funcionarios'
                  : 'Lista de Alumnos'}
              </h2>
              {esEventoTrabajadores ? (
                <>
                  <TrabajadoresResumen
                    trabajadores={alumnos}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    trabajadoresCompletos={alumnos}
                    eventoActivo={eventoActivo}
                  />
                  <div className='mt-6'>
                    <TrabajadoresLista
                      trabajadores={alumnos}
                      soloPresentes={soloPresentes}
                      setSoloPresentes={setSoloPresentes}
                    />
                  </div>
                </>
              ) : (
                <>
                  <EstadisticasPanel
                    alumnos={alumnosFiltradosModal}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    alumnosCompletos={alumnos}
                    eventoActivo={eventoActivo}
                  />
                  <AlumnosLista
                    alumnos={alumnos}
                    soloPresentes={soloPresentes}
                    setSoloPresentes={setSoloPresentes}
                    filtroCarrera={filtroCarrera}
                    setFiltroCarrera={setFiltroCarrera}
                    filtroInstitucion={filtroInstitucion}
                    setFiltroInstitucion={setFiltroInstitucion}
                    filtroGrupo={filtroGrupo}
                    setFiltroGrupo={setFiltroGrupo}
                  />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta de errorVisual en la esquina superior izquierda */}
      <AnimatePresence>
        {errorVisual && (
          <motion.div
            className='fixed top-6 left-2 sm:top-6 sm:left-6 sm:max-w-md z-50 flex items-center'
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            key='errorVisual'
          >
            <div
              role='alert'
              className='border-s-4 border-red-700 bg-red-50 p-4 max-w-md mx-auto rounded-md shadow-md'
            >
              <div className='flex items-center gap-2 text-red-700'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='w-5 h-5'
                >
                  <path
                    fillRule='evenodd'
                    d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
                    clipRule='evenodd'
                  />
                </svg>
                <strong className='font-medium'>Algo salió mal</strong>
              </div>
              <p className='mt-2 text-sm text-red-700'>{errorVisual}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`flex-1 flex flex-col w-full ${location.pathname === '/panel'
          ? ''
          : location.pathname === '/admin'
            ? 'items-center justify-center min-h-screen'
            : 'min-h-screen flex items-center justify-center px-2'
          }`}
      >
        <div
          className={`w-full flex flex-col ${location.pathname === '/panel' ? '' : 'items-center justify-center'
            }`}
        >
          <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
              <Route
                path='/'
                element={
                  <motion.div
                    key='inicio'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className='w-full flex flex-col items-center justify-center'
                  >
                    <Inicio
                      className='w-full'
                      onLogin={handleLogin}
                      setErrorVisual={setErrorVisual}
                      eventoActivo={eventoActivo}
                      onInfoClick={() => setShowAlumnosModal(true)}
                      onAdminClick={handleAdminClick}
                    />
                  </motion.div>
                }
              />
              <Route
                path='/admin'
                element={
                  isAdminAuthenticated ? (
                    <Navigate to='/panel' replace />
                  ) : (
                    <motion.div
                      key='admin-login'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className='w-full flex flex-col items-center justify-center'
                    >
                      <AdminLogin
                        onAuth={handleAuthAdmin}
                        onSalir={handleSalirAdmin}
                      />
                    </motion.div>
                  )
                }
              />
              <Route
                path='/panel'
                element={
                  isAdminAuthenticated ? (
                    <motion.div
                      key='admin-panel'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className='w-full flex flex-col items-center justify-center'
                    >
                      <AdminPanel onSalir={handleSalirAdmin} />
                    </motion.div>
                  ) : (
                    <Navigate to='/' replace />
                  )
                }
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      {!location.pathname.startsWith('/admin') &&
        location.pathname !== '/panel' && null}
    </div>
  );
}

export default App;
