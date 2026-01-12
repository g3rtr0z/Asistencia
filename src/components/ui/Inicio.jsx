import React, { useState, useRef, useEffect } from 'react';
import Logo from '../../assets/logo3.png';
import { buscarAlumnoPorRutEnEvento } from '../../services/alumnosService';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from './QRScanner';

const Inicio = ({ onLogin, setErrorVisual, eventoActivo, onInfoClick, onAdminClick }) => {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const rutInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Auto-reset
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        setRut('');
      }, 30000); // 30s auto-reset
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const formatRut = value => {
    let clean = value
      .replace(/[\r\n\t]/g, '')
      .trim()
      .replace(/[^0-9kK]/g, '')
      .toUpperCase();
    return clean.slice(0, 9);
  };

  const handleSubmit = async e => {
    e.preventDefault();
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
        return;
      }

      const alumno = await buscarAlumnoPorRutEnEvento(
        rutValue.trim(),
        eventoActivo.id
      );

      if (alumno && alumno.presente) {
        setErrorVisual('Su RUT ya se encuentra registrado');
        return;
      }

      const res = await onLogin(rutValue.trim());
      if (res && res.nombre) {
        setResult({ data: res, rut: rutValue });
      }

      setRut('');
      if (rutInputRef.current) rutInputRef.current.focus();

    } catch (_error) {
      setErrorVisual('Error al procesar el login');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = e => {
    const value = e.target.value;
    const formatted = formatRut(value);
    setRut(formatted);

    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    if (formatted.length >= 8 && formatted.length <= 9) {
      scanTimeoutRef.current = setTimeout(() => {
        const currentValue = formatRut(rutInputRef.current?.value || '');
        if (currentValue.length >= 8 && currentValue === formatted && !loading) {
          handleSubmit(e);
        }
      }, 300);
    }
  };

  const esEventoFuncionarios = eventoActivo?.tipo === 'trabajadores';

  const handleQRScan = (scannedRut) => {
    const formatted = formatRut(scannedRut);
    setRut(formatted);
    setShowScanner(false);

    // Auto-submit after scan
    setTimeout(() => {
      if (rutInputRef.current) {
        rutInputRef.current.value = formatted;
        handleSubmit({ preventDefault: () => { } });
      }
    }, 300);
  };

  const InfoRow = ({ label, value, border = true, highlight = false }) => {
    if (!value) return null;
    return (
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-1 ${border ? 'border-b border-gray-100' : ''}`}>
        <span className='text-sm text-gray-500 font-medium tracking-wide uppercase'>{label}</span>
        <span className={`text-gray-900 font-semibold text-lg text-right ${highlight ? 'text-st-verde' : ''}`}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-slate-50'>
      <div className='w-full max-w-6xl bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[auto] md:min-h-[600px] flex flex-col md:flex-row'>

        {/* Left Section - Information */}
        <div className='bg-st-verde p-6 md:p-12 text-white flex flex-row md:flex-col justify-between items-center md:items-start relative overflow-hidden shrink-0 md:w-5/12'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none'></div>

          <div className='relative z-10 flex items-center gap-4 md:block'>
            <div className='w-10 h-10 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center mb-0 md:mb-8'>
              <span className='font-bold text-lg md:text-2xl'>ST</span>
            </div>
            <div className='hidden md:block'>
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-4'>
                Bienvenido
              </h1>
              <p className='text-white/80 text-base md:text-lg font-light max-w-sm'>
                Sistema de registro de asistencia digital institucional.
              </p>
            </div>
          </div>

          <div className='relative z-10 mt-0 md:mt-12'>
            <div className='flex items-center gap-3 md:gap-4 bg-white/10 backdrop-blur-md p-2 md:p-4 rounded-lg md:rounded-xl border border-white/20'>
              <div className='w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-st-verde font-bold shadow-lg shrink-0'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className='min-w-0 max-w-[120px] md:max-w-none'>
                <div className='text-[8px] md:text-xs text-white/60 uppercase tracking-wider font-semibold'>Evento Activo</div>
                <div className='font-bold text-xs md:text-base truncate'>
                  {eventoActivo?.nombre || 'Cargando...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className='md:w-7/12 p-6 md:p-16 flex flex-col justify-center bg-white relative'>

          <div className='absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 md:gap-4'>
            {/* Info Button */}
            <button
              onClick={onInfoClick}
              className='w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:text-st-verde hover:border-st-verde/30 hover:shadow-md transition-all duration-300 flex items-center justify-center'
              title='Ver lista'
            >
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 md:w-6 md:h-6'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' />
              </svg>
            </button>

            {/* Admin Button */}
            <button
              onClick={onAdminClick}
              className='w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:text-st-verde hover:border-st-verde/30 hover:shadow-md transition-all duration-300 flex items-center justify-center'
              title='Administración'
            >
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 md:w-6 md:h-6'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z' />
              </svg>
            </button>

            <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>

            <img src={Logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-500 hidden md:block" />
          </div>

          <AnimatePresence mode='wait'>
            {!result ? (
              <motion.div
                key="login-form-split"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className='max-w-md mx-auto w-full md:mt-0'
              >
                <h2 className='text-2xl md:text-3xl font-bold text-slate-800 mb-2'>Registra tu llegada</h2>
                <p className='text-slate-500 mb-6 md:mb-8 text-sm md:text-base'>Ingresa tu RUT para confirmar tu asistencia.</p>

                <form onSubmit={handleSubmit} className='flex flex-col gap-5 md:gap-6'>
                  <div className='group'>
                    <label className='block text-sm font-semibold text-slate-700 mb-2 md:mb-3 ml-1'>
                      RUT
                    </label>
                    <div className='relative'>
                      <input
                        ref={rutInputRef}
                        type='text'
                        value={rut}
                        onChange={handleInput}
                        placeholder='12345678K'
                        className={`w-full h-14 md:h-16 px-5 md:px-6 pr-24 bg-slate-50 border-2 rounded-2xl text-xl md:text-2xl font-bold tracking-wider text-slate-800 outline-none transition-all duration-300
                            ${!eventoActivo
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-slate-200 focus:border-st-verde focus:bg-white focus:shadow-xl'
                          }`}
                        maxLength={12}
                        disabled={!eventoActivo || loading}
                        autoFocus
                        autoComplete='off'
                      />
                      <div className='absolute right-5 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => setShowScanner(true)}
                          disabled={!eventoActivo || loading}
                          className='w-10 h-10 rounded-xl bg-st-verde/10 hover:bg-st-verde/20 text-st-verde flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                          title='Escanear QR'
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type='submit'
                    disabled={loading || !rut.trim() || !eventoActivo}
                    className={`
                        w-full h-14 md:h-16 rounded-2xl font-bold text-base md:text-lg transition-all duration-300
                        flex items-center justify-center gap-3
                        ${loading || !rut.trim() || !eventoActivo
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-st-verde text-white hover:bg-[#004b30] hover:shadow-lg hover:shadow-st-verde/30 transform hover:-translate-y-1'
                      }
                      `}
                  >
                    {loading ? 'Verificando...' : 'Confirmar Asistencia'}
                    {!loading && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                  </button>
                </form>

                {/* Mobile Footer inside form area - removed, now using floating button */}

              </motion.div>
            ) : (
              <motion.div
                key="success-card-split"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className='max-w-md mx-auto w-full md:mt-0'
              >
                <div className='flex flex-col items-center mb-6 md:mb-8'>
                  <div className='w-20 h-20 md:w-24 md:h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 md:mb-6 ring-8 ring-green-50/50'>
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-st-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className='text-2xl md:text-3xl font-bold text-st-verde text-center'>
                    ¡Bienvenido!
                  </h2>

                  <p className='text-st-verde/80 text-center mt-2 font-medium text-sm md:text-base'>
                    Asistencia registrada correctamente
                  </p>
                </div>

                <div className='bg-slate-50 rounded-2xl p-5 md:p-6 border border-slate-100 space-y-1 mb-6'>
                  {esEventoFuncionarios ? (
                    <>
                      <InfoRow label="Funcionario" value={`${result.data.nombres || ''} ${result.data.apellidos || ''}`} highlight />
                      <InfoRow label="RUT" value={result.rut} />
                      <div className='pt-2 mt-2 border-t border-slate-200'>
                        <InfoRow label="Confirmación" value={result.data.asiste ? 'Pre-Confirmada' : 'En Puerta'} border={false} />
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow
                        label="Nombre Completo"
                        value={result.data.nombre ?? `${result.data.nombres ?? ''} ${result.data.apellidos ?? ''}`}
                        highlight
                      />
                      <InfoRow label="RUT" value={result.rut} />
                      <InfoRow label="Carrera" value={result.data.carrera} />
                      <InfoRow label="Grupo" value={result.data.grupo || 'No asignado'} />
                      <InfoRow label="Asiento" value={result.data.asiento || 'No asignado'} border={false} />
                    </>
                  )}
                </div>


                <div className='mb-6'>
                  <button
                    onClick={() => {
                      setResult(null);
                      setRut('');
                      setTimeout(() => {
                        if (rutInputRef.current) rutInputRef.current.focus();
                      }, 100);
                    }}
                    className='w-full py-3 md:py-4 rounded-xl bg-white border-2 border-slate-100 text-st-verde font-bold text-base md:text-lg hover:border-st-verde hover:bg-green-50/50 transition-all duration-200 flex items-center justify-center gap-2 group'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Ingresar otro asistente
                  </button>
                </div>

                <div className='text-center'>
                  <p className='text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider'>
                    Cierre automático
                  </p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-st-verde"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 30, ease: "linear" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer info button - bottom right on all screens */}
      <div className='fixed bottom-4 right-4 z-40'>
        <button
          onClick={() => setShowCredits(true)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
          title="Información del sistema"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />

      {/* Credits Modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Información del Sistema</h3>
                <button
                  onClick={() => setShowCredits(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Departamento</p>
                  <p className="text-sm font-medium text-slate-800">Departamento de Informática</p>
                  <p className="text-sm text-slate-600">Santo Tomás Temuco</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Desarrollador</p>
                  <p className="text-sm font-medium text-slate-800">Gerson Uziel Valdebenito</p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">Sistema de Gestión de Asistencia</p>
                  <p className="text-xs text-slate-300 mt-1">Versión 2.0 · 2026</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inicio;
