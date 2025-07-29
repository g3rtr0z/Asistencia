import React, { useState, useRef } from 'react';
import Logo from '../../assets/logo3.png';
import { buscarAlumnoPorRut } from '../../services/alumnosService';
import { Button, Input, Card } from './index';

const Inicio = ({ onLogin, setErrorVisual, eventoActivo }) => {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { data: alumno, rut: string }
  const rutInputRef = useRef(null);

  const formatRut = (value) => {
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    clean = clean.slice(0, 9);
    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRut(''); // Limpia el campo RUT

    // Vuelve a enfocar el input
    if (rutInputRef.current) {
      rutInputRef.current.focus();
    }
    if (!rut.trim()) {
      setErrorVisual('Por favor ingresa tu RUT');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const alumno = await buscarAlumnoPorRut(rut.trim());
      if (alumno && alumno.presente) {
        setErrorVisual('Su RUT ya se encuentra registrado');
        setLoading(false);
        return;
      }
      const res = await onLogin(rut.trim());
      if (res && res.nombre) {
        setResult({ data: res, rut });
      }
    } catch (error) {
      setErrorVisual('Error al procesar el login');
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
    <div className="flex flex-col sm:flex-row items-start justify-center bg-white sm:py-10 sm:gap-x-8">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <div className="text-center mb-5">
          <img
            src={Logo}
            alt="Logo"
            className="mx-auto mb-2 w-20 h-20 object-contain z-50"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">
            Mi Asistencia
          </h1>
        </div>

        <Card className="max-w-3xl mx-auto mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="RUT"
              type="text"
              value={rut}
              ref={rutInputRef}
              onChange={(e) => setRut(formatRut(e.target.value))}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu RUT"
              maxLength={13}
              disabled={!eventoActivo}
              className={`min-w-[280px] h-12 text-base px-4 font-medium ${
                !eventoActivo ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <Button
              type="submit"
              disabled={loading || !rut.trim() || !eventoActivo}
              loading={loading}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </Card>

        {/* Resultados */}
        {result && (
          <Card className="mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-green-800">
                Asistencia Realizada
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 gap-x-6">
                <span className="text-gray-600 font-medium">RUT:</span>
                <span className="text-gray-800">{result.rut}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 gap-x-6">
                <span className="text-gray-600 font-medium">Nombre:</span>
                <span className="text-gray-800 font-semibold">
                  {result.data.nombre}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 gap-x-6">
                <span className="text-gray-600 font-medium">Asiento:</span>
                <span className="text-gray-800 font-semibold">
                  {result.data.asiento ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 gap-x-6">
                <span className="text-gray-600 font-medium">Grupo:</span>
                <span className="text-gray-800 font-semibold">
                  {result.data.grupo ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 gap-x-6">
                <span className="text-gray-600 font-medium">Carrera:</span>
                <span className="text-gray-800">{result.data.carrera}</span>
              </div>
              <div className="flex justify-between items-center py-2 gap-x-6">
                <span className="text-gray-600 font-medium">Institución:</span>
                <span className="text-gray-800 font-semibold">
                  {result.data.institucion}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inicio;
