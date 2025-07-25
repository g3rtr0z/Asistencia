import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ImportExcel from './admin/ImportExcel';
import DeleteCollection from './admin/DeleteCollection';
import AlumnosLista from './AlumnosLista';
import AdminLogin from './AdminLogin';
import EstadisticasPanel from './EstadisticasPanel';
import { exportarAExcel } from '../components/admin/exportarAExcel'
import { agregarAlumno, deleteAlumnoPorRut } from '../services/alumnosService';
import { motion } from 'framer-motion';

function ConfigMenuPortal({ show, onImport, onDelete, onExport, onClose }) {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="fixed right-6 top-20 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
      <button onClick={onImport} className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 text-base">Importar Excel</button>
      <button onClick={onDelete} className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-red-600 text-base">Borrar Colección</button>
      <button onClick={onExport} className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-green-700 text-base">Exportar a Excel</button>
      <button onClick={onClose} className="block w-full px-4 py-2 text-center text-gray-400 hover:text-gray-700">Cerrar</button>
    </div>,
    document.body
  );
}

{/* Cerrar tab */ }
function ModalPanel({ show, onClose, children }) {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="absolute top-0 left-0 w-full flex justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] mt-8 relative border border-gray-200">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600">×</button>
        {children}
      </div>
    </div>,
    document.getElementById('admin-panel-root') || document.body
  );
}

function AdminPanel({
  alumnos,
  onSalir,
  totalAlumnos
}) {
  const [soloPresentes, setSoloPresentes] = useState("");
  const [tab, setTab] = useState('panel');
  const [showConfig, setShowConfig] = useState(false);
  const [modal, setModal] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Estado para agregar/eliminar alumnos
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    carrera: '',
    institucion: '',
    asiento: '',
    grupo: ''
  });
  const [rutEliminar, setRutEliminar] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Filtros globales para sincronizar con AlumnosLista y EstadisticasPanel
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroInstitucion, setFiltroInstitucion] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");

  // Filtrado sincronizado para estadísticas
  function filtrarPorGrupo(alumnos, grupo) {
    if (!grupo) return alumnos;
    const grupoNum = Number(grupo);
    return alumnos.filter(alumno => Number(alumno.grupo) === grupoNum);
  }
  let alumnosFiltrados = alumnos.filter(alumno =>
    (filtroCarrera === "" || alumno.carrera === filtroCarrera) &&
    (filtroInstitucion === "" || alumno.institucion === filtroInstitucion)
  );
  alumnosFiltrados = filtrarPorGrupo(alumnosFiltrados, filtroGrupo);

  async function handleAgregarAlumno(e) {
    e.preventDefault();
    try {
      await agregarAlumno({
        nombres: nuevoAlumno.nombres,
        apellidos: nuevoAlumno.apellidos,
        nombre: `${nuevoAlumno.nombres} ${nuevoAlumno.apellidos}`.trim(),
        rut: nuevoAlumno.rut,
        carrera: nuevoAlumno.carrera,
        institucion: nuevoAlumno.institucion,
        asiento: nuevoAlumno.asiento,
        grupo: nuevoAlumno.grupo
      });
      setMensajeAdmin('Alumno agregado correctamente');
      setNuevoAlumno({ nombres: '', apellidos: '', rut: '', carrera: '', institucion: '', asiento: '', grupo: '' });
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setMensajeAdmin('Error al agregar alumno');
    }
  }

  async function handleEliminarAlumno(e) {
    e.preventDefault();
    try {
      await deleteAlumnoPorRut(rutEliminar);
      setMensajeAdmin('Alumno eliminado correctamente');
      setRutEliminar('');
      if (onDeleteComplete) onDeleteComplete();
    } catch (err) {
      setMensajeAdmin('Error al eliminar alumno');
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative" id="admin-panel-root">
      {/* Header */}
      <header className="w-full border-b border-gray-200 px-4 py-3 flex items-center justify-between relative bg-white z-10">
        <span className="text-2xl font-bold text-green-800">Panel de Administración</span>
        <div className="flex items-center gap-4">
          {/* Configuración */}
          <div className="relative flex items-center gap-2">
            <button onClick={() => setShowConfig(v => !v)} className="bg-white rounded-full p-2 hover:bg-gray-100 transition" title="Configuración">
              <svg width="26" height="26" fill="none" stroke="#444" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1.31.76 1.65 1.65 0 01-2.78 0A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.76-1.31 1.65 1.65 0 010-2.78A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001.31-.76 1.65 1.65 0 012.78 0A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.24.22.51.22.78s-.08.54-.22.78z" /></svg>
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="bg-st-verde text-white rounded-full w-10 h-10 flex items-center justify-center text-3xl font-bold shadow-lg hover:bg-st-verdeClaro transition"
              title="Agregar/Quitar Alumnos"
            >
              +
            </button>
            <ConfigMenuPortal
              show={showConfig}
              onImport={() => { setModal('import'); setShowConfig(false); }}
              onDelete={() => { setModal('delete'); setShowConfig(false); }}
              onExport={() => exportarAExcel(alumnos)}
              onClose={() => setShowConfig(false)}
            />
          </div>
          <button onClick={onSalir} className="px-5 py-2 rounded border border-gray-300 bg-white text-gray-600 font-medium hover:bg-gray-100 transition">Salir</button>
        </div>
      </header>
      {/* Modal de configuración */}
      <ModalPanel show={modal === 'import'} onClose={() => setModal(null)}>
        <ImportExcel onImportComplete={() => setModal(null)} />
      </ModalPanel>
      <ModalPanel show={modal === 'delete'} onClose={() => setModal(null)}>
        <DeleteCollection onDeleteComplete={() => setModal(null)} totalAlumnos={totalAlumnos} />
      </ModalPanel>
      {/* Modal para agregar y eliminar alumnos */}
      {showAdminModal && (
        <motion.div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 sm:p-8 w-full max-w-xl max-w-full flex flex-col items-center relative overflow-auto max-h-[70vh]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button onClick={() => setShowAdminModal(false)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-600">×</button>
            <h3 className="text-2xl font-bold text-st-verde mb-4">Agregar Alumno</h3>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6" style={{ minWidth: 0 }} onSubmit={handleAgregarAlumno}>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Nombres</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Nombres" value={nuevoAlumno.nombres} onChange={e => setNuevoAlumno(a => ({ ...a, nombres: e.target.value }))} required />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Apellidos</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Apellidos" value={nuevoAlumno.apellidos} onChange={e => setNuevoAlumno(a => ({ ...a, apellidos: e.target.value }))} required />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">RUT</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="RUT" value={nuevoAlumno.rut} onChange={e => setNuevoAlumno(a => ({ ...a, rut: e.target.value }))} required />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Carrera</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Carrera" value={nuevoAlumno.carrera} onChange={e => setNuevoAlumno(a => ({ ...a, carrera: e.target.value }))} required />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Institución</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Institución" value={nuevoAlumno.institucion} onChange={e => setNuevoAlumno(a => ({ ...a, institucion: e.target.value }))} required />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Asiento</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Asiento" value={nuevoAlumno.asiento} onChange={e => setNuevoAlumno(a => ({ ...a, asiento: e.target.value }))} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-st-verde mb-1">Grupo</label>
                <input className="border border-st-verde rounded px-3 py-2 text-base" placeholder="Grupo" value={nuevoAlumno.grupo} onChange={e => setNuevoAlumno(a => ({ ...a, grupo: e.target.value }))} />
              </div>
              <div className="flex flex-col justify-end">
                <button type="submit" className="bg-st-verde text-white px-6 py-2 rounded font-bold w-full shadow hover:bg-st-verdeClaro transition">Agregar</button>
              </div>
            </form>
            <h3 className="text-2xl font-bold text-red-700 mb-4 mt-2">Eliminar Alumno</h3>
            <form className="flex flex-col sm:flex-row gap-4 w-full items-end" style={{ minWidth: 0 }} onSubmit={handleEliminarAlumno}>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium text-red-700 mb-1">RUT del alumno</label>
                <input className="border border-red-400 rounded px-3 py-2 text-base" placeholder="RUT del alumno" value={rutEliminar} onChange={e => setRutEliminar(e.target.value)} required />
              </div>
              <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-red-700 transition">Eliminar</button>
            </form>
            {mensajeAdmin && <div className="mt-4 text-st-verde font-medium text-center">{mensajeAdmin}</div>}
          </motion.div>
        </motion.div>
      )}
      {/* Tabs */}
      <div className="w-full flex gap-2 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          className={`flex-1 py-3 text-lg font-semibold transition border-b-2 ${tab === 'panel' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-400 hover:text-green-600 bg-white'}`}
          onClick={() => setTab('panel')}
        >Panel</button>
      </div>

      {/* Contenido de pestañas */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-10 py-6">
        <EstadisticasPanel alumnos={alumnosFiltrados} soloPresentes={soloPresentes} setSoloPresentes={setSoloPresentes} />
        {tab === 'panel' && (
          <div className="w-full">
            <div className="w-full flex justify-center">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel; 