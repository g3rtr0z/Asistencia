import React, { useState, useRef, useEffect } from 'react';
import Logo from '../../assets/logo3.png';
import { buscarAlumnoPorRutEnEvento } from '../../services/alumnosService';
import { Button, Input, Card } from './index';

const Inicio = ({ onLogin, setErrorVisual, eventoActivo }) => {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { data: alumno, rut: string }
  const rutInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

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

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const formatRut = value => {
    // Eliminar caracteres de control comunes del escáner (salto de línea, retorno de carro, tabs, etc.)
    let clean = value
      .replace(/[\r\n\t]/g, '') // Eliminar saltos de línea, retornos de carro y tabs
      .trim() // Eliminar espacios al inicio y final
      .replace(/[^0-9kK]/g, '') // Solo números y K
      .toUpperCase();
    // Limitar a 9 caracteres máximo (8 dígitos + 1 dígito verificador)
    clean = clean.slice(0, 9);
    return clean;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Obtener el RUT del input directamente para evitar problemas de sincronización
    const rutValue = formatRut(rutInputRef.current?.value || rut);
    
    if (!rutValue.trim()) {
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

      const alumno = await buscarAlumnoPorRutEnEvento(
        rutValue.trim(),
        eventoActivo.id
      );
      if (alumno && alumno.presente) {
        setErrorVisual('Su RUT ya se encuentra registrado');
        setLoading(false);
        return;
      }
      const res = await onLogin(rutValue.trim());
      if (res && res.nombre) {
        setResult({ data: res, rut: rutValue });
      }
      
      // Limpiar el campo RUT después de procesar
      setRut('');
      
      // Vuelve a enfocar el input para el siguiente escaneo
      if (rutInputRef.current) {
        rutInputRef.current.focus();
      }
    } catch (_error) {
      setErrorVisual('Error al procesar el login');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Manejar el evento de paste/escaneo automático
  const handlePaste = e => {
    e.preventDefault();
    const pastedData = e.clipboardData?.getData('text') || '';
    const formatted = formatRut(pastedData);
    setRut(formatted);
    // Si el RUT tiene 8 o 9 caracteres después del formato, enviar automáticamente
    if (formatted.length >= 8) {
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    }
  };

  // Detectar cuando se ingresa texto rápidamente (típico de escáner)
  const handleInput = e => {
    const value = e.target.value;
    const formatted = formatRut(value);
    setRut(formatted);
    
    // Limpiar timeout anterior si existe
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    // Si el RUT tiene 8 o 9 caracteres y parece ser un escaneo completo, enviar automáticamente
    // El escáner generalmente envía todos los caracteres de una vez, así que detectamos cuando
    // el valor tiene la longitud correcta
    if (formatted.length >= 8 && formatted.length <= 9) {
      // Pequeño delay para asegurar que el escáner terminó de enviar datos
      // y que no hay más caracteres pendientes
      scanTimeoutRef.current = setTimeout(() => {
        const currentValue = formatRut(rutInputRef.current?.value || '');
        if (currentValue.length >= 8 && currentValue.length <= 9 && currentValue === formatted && !loading) {
          handleSubmit(e);
        }
      }, 300);
    }
  };

  const esEventoFuncionarios = eventoActivo?.tipo === 'trabajadores';

  const InfoRow = ({ label, value, border = true, uppercase = false }) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return (
      <div
        className={`flex justify-between items-center py-2 gap-x-6 ${border ? 'border-b border-gray-100' : ''}`}
      >
        <span className='text-gray-600 font-medium'>{label}:</span>
        <span
          className={`text-gray-800 font-semibold text-right ${uppercase ? 'uppercase' : ''}`}
        >
          {value}
        </span>
      </div>
    );
  };

  // Función no utilizada - comentada
  // const getVeganoTexto = valor => {
  //   if (valor === null || valor === undefined || valor === '') return 'No';
  //   if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  //   const texto = valor.toString().trim().toLowerCase();
  //   return ['si', 'sí', 'yes', 'true', '1'].includes(texto) ? 'Sí' : 'No';
  // };

  return (
    <div className='flex flex-col sm:flex-row items-start justify-center bg-white sm:gap-x-8'>
      <div className='w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto'>
        <div className='text-center mb-5'>
          <img
            src={Logo}
            alt='Logo'
            className='mx-auto mb-2 w-20 h-20 object-contain z-50'
          />
          <h1 className='text-2xl sm:text-3xl font-bold text-green-800 mb-2'>
            Mi Asistencia
          </h1>
        </div>

        <Card className='max-w-3xl mx-auto mb-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              label='RUT'
              type='text'
              value={rut}
              ref={rutInputRef}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder='Ingresa tu RUT'
              maxLength={13}
              disabled={!eventoActivo}
              autoComplete='off'
              className={`min-w-[280px] h-12 text-base px-4 font-medium ${
                !eventoActivo ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <Button
              type='submit'
              disabled={loading || !rut.trim() || !eventoActivo}
              loading={loading}
              className='w-full h-12 text-base font-semibold'
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </Card>

        {/* Resultados */}
        {result && (
          <Card className='mb-12'>
            <div className='flex items-center space-x-2 mb-4'>
              <svg
                className='w-6 h-6 text-green-800'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <h2 className='text-lg sm:text-xl font-semibold text-green-800'>
                Asistencia Realizada
              </h2>
            </div>
            <div className='space-y-3'>
              {(() => {
                if (esEventoFuncionarios) {
                  const nombres =
                    result.data.nombres ?? result.data.nombre ?? '';
                  const apellidos =
                    result.data.apellidos ??
                    (result.data.nombre
                      ? result.data.nombre.split(' ').slice(1).join(' ')
                      : '');
                  const confirmacion = result.data.asiste
                    ? '✅ Confirmó asistencia previa'
                    : '❌ No confirmó asistencia previa';
                  // const estado = result.data.presente
                  //   ? '✅ Presente'
                  //   : '❌ Ausente';
                  const observacion =
                    result.data.observacion ?? 'Sin observación';
                  return (
                    <>
                      <InfoRow label='RUT' value={result.rut} />
                      <InfoRow
                        label='Nombres'
                        value={nombres}
                        uppercase={true}
                      />
                      <InfoRow
                        label='Apellidos'
                        value={apellidos || 'Sin apellidos'}
                        uppercase={true}
                      />
                      <InfoRow label='Confirmación' value={confirmacion} />
                      <InfoRow
                        label='Observación'
                        value={observacion}
                        border={false}
                      />
                    </>
                  );
                }

                // Combinar nombres y apellidos para mostrar el nombre completo
                const nombreCompleto =
                  result.data.nombre ??
                  `${result.data.nombres ?? ''} ${result.data.apellidos ?? ''}`.trim();
                return (
                  <>
                    <InfoRow label='Nombre' value={nombreCompleto} />
                    <InfoRow label='Asiento' value={result.data.asiento} />
                    <InfoRow label='Grupo' value={result.data.grupo} />
                    <InfoRow label='Carrera' value={result.data.carrera} />
                    <InfoRow
                      label='Institución'
                      value={result.data.institucion}
                      border={false}
                    />
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
