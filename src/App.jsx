import React, { useState, useMemo } from 'react';
import Inicio from './components/Inicio';
import AdminPanel from './components/AdminPanel';
import useAlumnos from './hooks/useAlumnos';
import { actualizarPresencia } from './services/alumnosService';
import AdminButton from './components/AdminButton';

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
  const [admin, setAdmin] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [errorVisual, setErrorVisual] = useState("");

  // Filtrado para la vista de admin (memorizado)
  const alumnosFiltrados = useMemo(() => {
    if (filtroEstado === 'presentes') {
      return alumnos.filter(a => a.presente);
    } else if (filtroEstado === 'ausentes') {
      return alumnos.filter(a => !a.presente);
    }
    return alumnos;
  }, [alumnos, filtroEstado]);

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
      setErrorVisual('Error al procesar el login. Inténtalo de nuevo.');
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

  // Ocultar errorVisual después de 2 segundos
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
  const handleAdminClick = () => setAdmin(true);
  const handleSalirAdmin = () => setAdmin(false);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mostrar AdminButton solo si NO está en el panel de administración */}
      {!admin && <AdminButton onClick={handleAdminClick} />}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 py-4">
        <div className="w-full flex flex-col items-center justify-center">
          {admin ? (
            <div className="animate-fade-in-scale w-full flex flex-col items-center justify-center">
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
            </div>
          ) : (
            <div className="animate-fade-in-scale w-full flex flex-col items-center justify-center">
              {/* Mensaje de error visual */}
              <Inicio onLogin={handleLogin} setErrorVisual={setErrorVisual} />
              {errorVisual && (
                <div className="bg-red-50 border border-red-200 rounded-lg py-2 px-4 mb-2 mt-4 sm:mt-8 flex items-center space-x-2 text-xs">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700">{errorVisual}</span>
                </div>
              )}
              <div className="text-center text-gray-500 text-xs sm:text-sm mt-2 mb-1">
                <p>Versión 1.0</p>
              </div>
              <div className="text-center text-gray-500 text-xs sm:text-sm mb-4">
                <p>Area de Informática Santo Tomas Temuco 2025</p>
              </div>

            </div>

          )}
        </div>
      </main>
    </div>
  );
}

export default App;
