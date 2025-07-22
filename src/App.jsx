import React, { useState, useMemo } from 'react';
import Inicio from './components/Inicio';
import AdminPanel from './components/AdminPanel';
import useAlumnos from './hooks/useAlumnos';
import { actualizarPresencia } from './services/alumnosService';
import AdminButton from './components/AdminButton';
import AlumnosLista from './components/AlumnosLista';
import EstadisticasPanel from './components/EstadisticasPanel';

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
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  // Filtros para el modal de alumnos
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroInstitucion, setFiltroInstitucion] = useState("");
  const [filtroRUT, setFiltroRUT] = useState("");

  // Filtrado para la vista de admin (memorizado)
  const alumnosFiltrados = useMemo(() => {
    if (filtroEstado === 'presentes') {
      return alumnos.filter(a => a.presente);
    } else if (filtroEstado === 'ausentes') {
      return alumnos.filter(a => !a.presente);
    }
    return alumnos;
  }, [alumnos, filtroEstado]);

  // Filtrado para el modal de alumnos (Inicio)
  const alumnosFiltradosModal = useMemo(() => {
    return alumnos.filter(alumno =>
      (filtroCarrera === "" || alumno.carrera === filtroCarrera) &&
      (filtroInstitucion === "" || alumno.institucion === filtroInstitucion) &&
      (filtroRUT === "" || alumno.rut.includes(filtroRUT))
    );
  }, [alumnos, filtroCarrera, filtroInstitucion, filtroRUT]);

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
  const handleAdminClick = () => setAdmin(true);
  const handleSalirAdmin = () => setAdmin(false);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mostrar AdminButton e icono de información solo si NO está en el panel de administración */}
      {!admin && (
        <div className="fixed top-4 right-4 z-50 flex flex-row items-center space-x-14">
          {/* Icono de información */}
          <button
            className="bg-blue-600 text-white w-12 h-12 p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
            title="Ver lista de alumnos"
            style={{ transition: 'background 0.2s' }}
            onClick={() => setShowAlumnosModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.75v.75m0 3v.75m0 3v.75m0 3v.75m-3-12h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-9A2.25 2.25 0 015.25 18.75V5.25A2.25 2.25 0 017.5 3h3z" />
            </svg>
          </button>
          <AdminButton onClick={handleAdminClick} />
        </div>
      )}
      {/* Modal de AlumnosLista */}
      {showAlumnosModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-5xl w-full relative" style={{ maxHeight: '95vh', overflow: 'auto' }}>
            <button
              onClick={() => setShowAlumnosModal(false)}
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600"
              title="Cerrar"
            >×</button>
            <h2 className="text-xl font-bold mb-4 text-green-800">Lista de Alumnos</h2>
            {/* Estadísticas arriba de la lista */}
            <EstadisticasPanel alumnos={alumnosFiltradosModal} />
            <AlumnosLista
              alumnos={alumnos}
              filtroCarrera={filtroCarrera}
              setFiltroCarrera={setFiltroCarrera}
              filtroInstitucion={filtroInstitucion}
              setFiltroInstitucion={setFiltroInstitucion}
              filtroRUT={filtroRUT}
              setFiltroRUT={setFiltroRUT}
            />
          </div>
        </div>
      )}
      {/* Alerta de errorVisual en la esquina superior izquierda */}
      {errorVisual && (
        <div className="fixed top-6 left-2 sm:top-6 sm:left-6 sm:max-w-md z-50 flex items-center bg-white border border-red-200 rounded-lg py-2 px-3 sm:py-3 sm:px-5 shadow-xl space-x-2 sm:space-x-3 animate-fade-in">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-xs sm:text-base font-semibold leading-tight">{errorVisual}</span>
        </div>
      )}
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
              <div className="text-center text-gray-500 text-xs sm:text-sm mt-2 mb-1">
                <p>Versión 1.0</p>
              </div>
              <div className="text-center text-gray-500 text-xs sm:text-sm">
                <p>Departamento de Informática -  Santo Tomas Temuco 2025</p>
              </div>

            </div>

          )}
        </div>
      </main>
    </div>
  );
}

export default App;
