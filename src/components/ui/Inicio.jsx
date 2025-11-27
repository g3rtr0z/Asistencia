import React, { useState, useRef, useEffect } from 'react';
import Logo from '../../assets/logo3.png';
import { buscarAlumnoPorRutEnEvento } from '../../services/alumnosService';
import { Button, Input, Card } from './index';

const Inicio = ({ onLogin, setErrorVisual, eventoActivo }) => {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { data: alumno, rut: string }
  const rutInputRef = useRef(null);

  // Auto-ocultar la asistencia realizada después de 30 segundos
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        // También limpiar el campo RUT para nueva búsqueda
        setRut('');
      }, 30000); // 30 segundos

      return () => clearTimeout(timer);
    }
  }, [result]);

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
      if (!eventoActivo?.id) {
        setErrorVisual('No hay un evento activo disponible.');
        setLoading(false);
        return;
      }

      const alumno = await buscarAlumnoPorRutEnEvento(rut.trim(), eventoActivo.id);
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

  const esEventoFuncionarios = eventoActivo?.tipo === 'trabajadores';

  const InfoRow = ({ label, value, border = true }) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return (
      <div className={`flex justify-between items-center py-2 gap-x-6 ${border ? 'border-b border-gray-100' : ''}`}>
        <span className="text-gray-600 font-medium">{label}:</span>
        <span className="text-gray-800 font-semibold text-right">{value}</span>
      </div>
    );
  };

  const getVeganoTexto = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 'No';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    const texto = valor.toString().trim().toLowerCase();
    return ['si', 'sí', 'yes', 'true', '1'].includes(texto) ? 'Sí' : 'No';
  };

  return (
    <div className="flex flex-col sm:flex-row items-start justify-center bg-white sm:gap-x-8">
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
              className={`min-w-[280px] h-12 text-base px-4 font-medium ${!eventoActivo ? 'bg-gray-100 cursor-not-allowed' : ''
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
                className="w-6 h-6 text-green-800"
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
              {(() => {
                if (esEventoFuncionarios) {
                  const nombres = result.data.nombres ?? result.data.nombre ?? '';
                  const apellidos = result.data.apellidos ?? (result.data.nombre ? result.data.nombre.split(' ').slice(1).join(' ') : '');
                  const departamento = result.data.departamento ?? 'Sin institución';
                  const vegano = getVeganoTexto(result.data.vegano);
                  const confirmacion = result.data.asiste ? '✅ Confirmó asistencia previa' : '❌ No confirmó asistencia previa';
                  return (
                    <>
                      <InfoRow label="RUT" value={result.rut} />
                      <InfoRow label="Nombres" value={nombres} />
                      <InfoRow label="Apellidos" value={apellidos || 'Sin apellidos'} />
                      <InfoRow label="Institución" value={departamento} />
                      <InfoRow label="Vegano" value={vegano} />
                      <InfoRow label="Confirmación" value={confirmacion} border={false} />
                    </>
                  );
                }

                const nombreMostrar = result.data.nombre ?? `${result.data.nombres ?? ''} ${result.data.apellidos ?? ''}`.trim();
                return (
                  <>
                    <InfoRow label="RUT" value={result.rut} />
                    <InfoRow label="Nombre" value={nombreMostrar} />
                    <InfoRow label="Asiento" value={result.data.asiento} />
                    <InfoRow label="N° de Lista" value={result.data.grupo} />
                    <InfoRow label="Carrera" value={result.data.carrera} />
                    <InfoRow label="Institución" value={result.data.institucion} border={false} />
                  </>
                );
              })()}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inicio;
