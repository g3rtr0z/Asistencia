import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Inicio from './components/Inicio';
import AdminPanel from './components/AdminPanel';
import useAlumnos from './hooks/useAlumnos';
import { actualizarPresencia } from './services/alumnosService';
import AdminButton from './components/AdminButton';
import AlumnosLista from './components/AlumnosLista';
import EstadisticasPanel from './components/EstadisticasPanel';
import { AnimatePresence, motion } from 'framer-motion';
import AdminLogin from './components/AdminLogin';

// Loader
function Loader() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-800 mx-auto mb-4"></div>
        <p className="text-green-800 text-xl">Cargando datos...</p>
      </div>
    </div>
  );
}

// Error
function ErrorMessage({ error }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-xl mb-4">Error al cargar los datos</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-800 text-white px-4 py-2 rounded mr-2"
        >
          Reintentar
        </button>
        <div className="text-gray-500 mt-2 text-sm">{error}</div>
      </div>
    </div>
  );
}

// Modal para pedir PIN
function PinModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const PIN_CORRECTO = '1234'; // Cambia este valor por el PIN real

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === PIN_CORRECTO) {
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto');
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-lg font-bold mb-4 text-st-verde">Ingresa el PIN de 4 dígitos</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
          <input
            type="password"
            maxLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            className="border border-st-verde rounded px-4 py-2 text-center text-2xl tracking-widest w-32"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            autoFocus
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-st-verde text-white px-4 py-2 rounded font-bold">Ingresar</button>
            <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function App() {
  // Custom hook para la lógica de alumnos
  const {
    alumnos,
    loading,
    error,
    handleImportComplete,
    handleDeleteComplete
  } = useAlumnos();

  const [usuario, setUsuario] = useState(null);
  // Navegación con react-router-dom
  const navigate = useNavigate();
  const location = useLocation();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [errorVisual, setErrorVisual] = useState("");
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAutorizado, setPinAutorizado] = useState(false);
  // Filtros para el modal de alumnos
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroInstitucion, setFiltroInstitucion] = useState("");
  const [filtroRUT, setFiltroRUT] = useState("");
  const [soloPresentes, setSoloPresentes] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState("");


  // Filtrado para la vista de admin (memorizado)
  const alumnosFiltrados = useMemo(() => {
    if (filtroEstado === 'presentes') {
      return alumnos.filter(a => a.presente);
    } else if (filtroEstado === 'ausentes') {
      return alumnos.filter(a => !a.presente);
    }
    return alumnos;
  }, [alumnos, filtroEstado]);

  // Filtrado para el modal de alumnos (Inicio), incluyendo grupo
  const alumnosFiltradosModal = useMemo(() => {
    let filtrados = alumnos.filter(alumno =>
      (filtroCarrera === "" || alumno.carrera === filtroCarrera) &&
      (filtroInstitucion === "" || alumno.institucion === filtroInstitucion) &&
      (filtroRUT === "" || alumno.rut.includes(filtroRUT))
    );
    if (filtroGrupo) {
      const grupoNum = Number(filtroGrupo);
      filtrados = filtrados.filter(alumno => Number(alumno.grupo) === grupoNum);
    }
    return filtrados;
  }, [alumnos, filtroCarrera, filtroInstitucion, filtroRUT, filtroGrupo]);

  // Login de alumno
  const handleLogin = async (rut) => {
    try {
      const alumno = alumnos.find(a => a.rut === rut);
      if (alumno) {
        await actualizarPresencia(alumno.id, true);
        const actualizado = { ...alumno, presente: true };
        setUsuario(actualizado);
        setShowConfirm(true);
        return actualizado; // <-- Retorna el alumno actualizado
      } else {
        setErrorVisual('RUT no encontrado en la base de datos.');
      }
    } catch (error) {
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
      const timeout = setTimeout(() => setErrorVisual(""), 2000);
      return () => clearTimeout(timeout);
    }
  }, [errorVisual]);

  // Actualizar usuario si cambia el estado de alumnos
  React.useEffect(() => {
    if (usuario) {
      const actualizado = alumnos.find(a => a.rut === usuario.rut);
      if (actualizado) setUsuario(actualizado);
    }
  }, [alumnos]);

  // Acciones admin
  const handleAdminClick = () => navigate('/admin');
  const handleAuthAdmin = () => {
    setIsAdminAuthenticated(true);
    navigate('/panel');
  };
  const handleSalirAdmin = () => {
    setIsAdminAuthenticated(false);
    navigate('/');
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AnimatePresence mode="wait">
        {location.pathname === '/' && (
          <motion.div
            key="botones-inicio"
            className="fixed top-8 right-4 z-50 flex flex-row items-center space-x-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Icono de información */}
            <button
              className="bg-blue-600 text-white w-12 h-12 p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
              title="Ver lista de alumnos"
              style={{ transition: 'background 0.2s' }}
              onClick={() => { setShowPinModal(true); setPinAutorizado(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.75v.75m0 3v.75m0 3v.75m0 3v.75m-3-12h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-9A2.25 2.25 0 015.25 18.75V5.25A2.25 2.25 0 017.5 3h3z" />
              </svg>
            </button>
            <AdminButton onClick={handleAdminClick} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal de PIN antes de mostrar la lista de alumnos */}
      <AnimatePresence>
        {showPinModal && (
          <PinModal
            onSuccess={() => {
              setPinAutorizado(true);
              setShowPinModal(false);
              setShowAlumnosModal(true);
            }}
            onCancel={() => {
              setShowPinModal(false);
              setPinAutorizado(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAlumnosModal && pinAutorizado && (
          <motion.div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            key="modal-bg"
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-8 max-w-7xl w-full relative max-h-[95vh] overflow-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              key="modal-content"
            >
              <button
                onClick={() => { setShowAlumnosModal(false); setPinAutorizado(false); }}
                className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600"
                title="Cerrar"
              >×</button>
              <h2 className="text-xl font-bold mb-4 text-green-800">Lista de Alumnos</h2>
              {/* Estadísticas arriba de la lista */}
              <EstadisticasPanel alumnos={alumnosFiltradosModal} soloPresentes={soloPresentes} setSoloPresentes={setSoloPresentes} />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Alerta de errorVisual en la esquina superior izquierda */}
      <AnimatePresence>
        {errorVisual && (
          <motion.div
            className="fixed top-6 left-2 sm:top-6 sm:left-6 sm:max-w-md z-50 flex items-center"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            key="errorVisual"
          >
            <div
              role="alert"
              className="border-s-4 border-red-700 bg-red-50 p-4 max-w-md mx-auto rounded-md shadow-md"
            >
              <div className="flex items-center gap-2 text-red-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>

                <strong className="font-medium">Algo salió mal</strong>
              </div>
              <p className="mt-2 text-sm text-red-700">
                {errorVisual}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 py-4">
        <div className="w-full flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div
                  key="inicio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col items-center justify-center"
                >
                  <Inicio className="w-full" onLogin={handleLogin} setErrorVisual={setErrorVisual} />
                  <div className="text-center text-gray-500 text-xs sm:text-sm mt-2 mb-2">
                    <p>Versión 1.0</p>
                  </div>
                  <div className="text-center text-gray-500 text-xs sm:text-sm">
                    <p>Departamento de Informática -  Santo Tomas Temuco 2025</p>
                    <p>Todos los derechos reservados &copy;</p>
                  </div>
                </motion.div>
              } />
              <Route path="/admin" element={
                <motion.div
                  key="admin-login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col items-center justify-center"
                >
                  <AdminLogin onAuth={handleAuthAdmin} onSalir={handleSalirAdmin} />
                </motion.div>
              } />
              <Route path="/panel" element={
                isAdminAuthenticated ? (
                  <motion.div
                    key="admin-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex flex-col items-center justify-center"
                  >
                    <AdminPanel
                      alumnos={alumnos}
                      onSalir={handleSalirAdmin}
                      onImportComplete={handleImportComplete}
                      onDeleteComplete={handleDeleteComplete}
                      filtroEstado={filtroEstado}
                      setFiltroEstado={setFiltroEstado}
                      showImport={showImport}
                      setShowImport={setShowImport}
                      showDelete={showDelete}
                      setShowDelete={setShowDelete}
                      alumnosFiltrados={alumnosFiltrados}
                      totalAlumnos={alumnos.length}
                    />
                  </motion.div>
                ) : (
                  <Navigate to="/admin" replace />
                )
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
