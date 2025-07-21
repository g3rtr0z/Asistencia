import React, { useState } from "react";
import Logo from '../assets/logo3.png'
import { buscarAlumnoPorRut } from '../services/alumnosService';

const Inicio = ({ onLogin, setErrorVisual }) => {
  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const formatRut = (value) => {
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    clean = clean.slice(0, 9);
    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rut.trim()) {
      setErrorVisual("Por favor ingresa tu RUT");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const alumno = await buscarAlumnoPorRut(rut.trim());
      if (alumno && alumno.presente) {
        setErrorVisual("Ya se encuentra registrado");
        setLoading(false);
        return;
      }
      const res = await onLogin(rut.trim());
      if (res && res.nombre) {
        setResult(res);
      }
    } catch (error) {
      setErrorVisual("Error al procesar el login");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className=" flex flex-col items-center justify-center sm:justify-start bg-white sm:py-2">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <div className="text-center mb-5">
          <img
            src={Logo}
            alt="Logo"
            className="mx-auto mb-2 w-20 h-20 object-contain z-50"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Mi Asistencia ST</h1>
          <p className="text-gray-600 text-sm sm:text-base">Ingresa un RUT</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rut}
                  onChange={e => setRut(formatRut(e.target.value))}
                  onKeyPress={handleKeyPress}
                  placeholder="123456789"
                  maxLength={13}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <div className="absolute right-3 top-3">
                  {rut && rut.length >= 10 && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !rut.trim()}
              className={
                `w-full py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ` +
                (loading || !rut.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white')
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Buscar</span>
                </>
              )}
            </button>
          </form>
        </div>
        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-green-800">Asistencia Realizada</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">RUT:</span>
                <span className="text-gray-800">{rut}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nombre: </span>
                <span className="text-gray-800 font-semibold">{result.nombre}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Carrera:</span>
                <span className="text-gray-800">{result.carrera}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Institución:</span>
                <span className="text-gray-800 font-semibold">{result.institucion}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inicio; 