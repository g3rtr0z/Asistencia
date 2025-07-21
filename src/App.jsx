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
        alert('RUT no encontrado en la base de datos.');
      }
    } catch (error) {
      alert('Error al procesar el login. Inténtalo de nuevo.');
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
              <Inicio onLogin={handleLogin} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
