import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ImportExcel from './admin/ImportExcel';
import DeleteCollection from './admin/DeleteCollection';
import AlumnosLista from './AlumnosLista';
import AdminLogin from './AdminLogin';
import EstadisticasPanel from './EstadisticasPanel';
import { exportarAExcel } from '../components/admin/exportarAExcel'

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
  const [adminAuth, setAdminAuth] = useState(false);
  const [tab, setTab] = useState('panel');
  const [showConfig, setShowConfig] = useState(false);
  const [modal, setModal] = useState(null);

  if (!adminAuth) {
    return <AdminLogin onAuth={() => setAdminAuth(true)} onSalir={onSalir} />;
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative" id="admin-panel-root">
      {/* Header */}
      <header className="w-full border-b border-gray-200 px-4 py-3 flex items-center justify-between relative bg-white z-10">
        <span className="text-2xl font-bold text-green-800">Panel de Administración</span>
        <div className="flex items-center gap-4">
          {/* Configuración */}
          <div className="relative">
            <button onClick={() => setShowConfig(v => !v)} className="bg-white rounded-full p-2 hover:bg-gray-100 transition" title="Configuración">
              <svg width="26" height="26" fill="none" stroke="#444" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1.31.76 1.65 1.65 0 01-2.78 0A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.76-1.31 1.65 1.65 0 010-2.78A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001.31-.76 1.65 1.65 0 012.78 0A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.24.22.51.22.78s-.08.54-.22.78z" /></svg>
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
      {/* Tabs */}
      <div className="w-full flex gap-2 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          className={`flex-1 py-3 text-lg font-semibold transition border-b-2 ${tab === 'panel' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-400 hover:text-green-600 bg-white'}`}
          onClick={() => setTab('panel')}
        >Panel</button>
      </div>

      {/* Contenido de pestañas */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-10 py-6">
        <EstadisticasPanel alumnos={alumnos} soloPresentes={soloPresentes} setSoloPresentes={setSoloPresentes} />
        {tab === 'panel' && (
          <div className="w-full">
            <div className="w-full flex justify-center">
              <AlumnosLista alumnos={alumnos} soloPresentes={soloPresentes} setSoloPresentes={setSoloPresentes} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel; 