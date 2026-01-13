import React, { useState, useRef, useEffect } from 'react';
import Logo from '../../assets/logo3.png';
import { buscarAlumnoPorRutEnEvento } from '../../services/alumnosService';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from './QRScanner';

const Inicio = ({ onLogin, setErrorVisual, eventoActivo, onInfoClick, onAdminClick, errorVisual, showButtons = true }) => {
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
    <div className='min-h-screen w-full flex items-center justify-center p-0 md:p-10 bg-slate-50 font-sans'>

      {/* --- MOBILE MINIMALIST PORTAL (LIGHT) --- */}
      <div className='md:hidden fixed inset-0 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-6'>
        {/* Subtle Background Accents */}
        <div className='absolute top-[-20%] right-[-20%] w-96 h-96 bg-st-verde/5 rounded-full blur-[120px] pointer-events-none'></div>
        <div className='absolute bottom-[-10%] left-[-20%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none'></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className='w-full max-w-sm z-10'
        >
          {/* Main Focused Card */}
          <div className='bg-white border border-slate-100 rounded-[3rem] p-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden'>
            <div className='relative z-10 flex flex-col items-center'>
              {/* Logo Area */}
              <div className='w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-4 mb-8 border border-slate-100 shadow-sm'>
                <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
              </div>

              <AnimatePresence mode='wait'>
                {!result ? (
                  <motion.div
                    key="mobile-portal-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className='w-full text-center'
                  >
                    <h2 className='text-3xl font-black text-slate-900 mb-2 tracking-tight'>Portal de Acceso</h2>
                    <p className='text-slate-400 text-sm font-medium mb-8'>Ingresa tu RUT para registrar asistencia</p>

                    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                      <div className='relative group'>
                        <input
                          ref={rutInputRef}
                          type='text'
                          value={rut}
                          onChange={handleInput}
                          placeholder='RUT SIN PUNTOS'
                          className='w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 text-center text-2xl font-black text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-st-verde/50 outline-none transition-all tracking-[0.1em]'
                          maxLength={12}
                          disabled={!eventoActivo || loading}
                          autoFocus
                          autoComplete='off'
                        />
                        {/* Focus line decoration */}
                        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-st-verde group-focus-within:w-full transition-all duration-500 rounded-full'></div>
                      </div>

                      <div className='flex gap-3'>
                        <button
                          type='submit'
                          disabled={loading || !rut.trim() || !eventoActivo}
                          className={`flex-1 h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${loading || !rut.trim() || !eventoActivo
                            ? 'bg-slate-100 text-slate-400 border border-slate-100 shadow-none'
                            : 'bg-st-verde text-white hover:bg-emerald-600 shadow-emerald-500/20 active:scale-95'
                            }`}
                        >
                          {loading ? 'Confirmando...' : 'Confirmar'}
                          {!loading && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                        </button>

                        <button
                          type='button'
                          onClick={() => setShowScanner(true)}
                          className='w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-50 hover:text-st-verde'
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mobile-portal-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='w-full text-center'
                  >
                    <div className='w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20'>
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className='text-3xl font-black text-slate-900 mb-2'>¡Registrado!</h2>

                    <div className='mt-8 text-left bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3 mb-8'>
                      <div className='flex flex-col'>
                        <span className='text-[10px] text-slate-400 uppercase font-black tracking-widest'>Asistente</span>
                        <span className='text-lg font-black text-slate-800 truncate'>{result.data.nombre ?? `${result.data.nombres ?? ''} ${result.data.apellidos ?? ''}`}</span>
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-[10px] text-slate-400 uppercase font-black tracking-widest'>RUT</span>
                        <span className='text-base font-bold text-slate-600'>{result.rut}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setResult(null); setRut(''); setTimeout(() => rutInputRef.current?.focus(), 100); }}
                      className='w-full py-4 rounded-xl bg-st-verde text-white text-base font-bold active:scale-95 transition-all mb-4 shadow-lg shadow-st-verde/20'
                    >
                      Nuevo Registro
                    </button>

                    <div className='px-4'>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-st-verde" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 30, ease: "linear" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* --- MOBILE NAVIGATION DOCK (LIGHT) --- */}
        {(showButtons && !showScanner && !showCredits) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className='fixed bottom-10 left-1/2 -translate-x-1/2 z-30'
          >
            <div className='flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-slate-100 p-2 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]'>
              <button
                onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
                className='flex items-center gap-3 px-5 py-3 rounded-full text-slate-400 hover:text-st-verde hover:bg-slate-50 transition-all font-bold text-sm'
              >
                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-5 h-5'>
                  <path strokeLinecap="round" strokeLinejoin="round" d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' />
                </svg>
                Lista
              </button>
              <div className='w-px h-6 bg-slate-100'></div>
              <button
                onClick={(e) => { e.stopPropagation(); onAdminClick(); }}
                className='flex items-center gap-3 px-5 py-3 rounded-full text-slate-400 hover:text-st-verde hover:bg-slate-50 transition-all font-bold text-sm'
              >
                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-5 h-5'>
                  <path strokeLinecap="round" strokeLinejoin="round" d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z' />
                </svg>
                Admin
              </button>
            </div>
          </motion.div>
        )}

        {/* Global Error (Mobile Light) */}
        <AnimatePresence>
          {errorVisual && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-32 left-6 right-6 z-50 pointer-events-none"
            >
              <div className='bg-white text-red-500 p-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-red-100 pointer-events-auto'>
                <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                <p className='text-sm font-black uppercase tracking-wider'>{errorVisual}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- DESKTOP SPLIT SCREEN LAYOUT --- */}
      <div className='hidden md:flex w-full max-w-6xl h-[650px] bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden'>
        {/* Left Branding */}
        <div className='w-5/12 bg-st-verde p-12 text-white flex flex-col justify-between relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none'></div>

          <div className='relative z-10'>
            <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-12'>
              <span className='font-bold text-2xl'>ST</span>
            </div>
            <h1 className='text-5xl font-black leading-[1.1] mb-6 tracking-tight'>Panel de Asistencia</h1>
            <p className='text-white/70 text-lg font-medium leading-relaxed max-w-xs'>
              Gestiona el registro institucional con un solo toque.
            </p>
          </div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20'>
              <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center text-st-verde shadow-lg'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-9 6c0 4.418 7 11 9 11s9-6.582 9-11a6 6 0 00-9-6z" /></svg>
              </div>
              <div>
                <span className='text-[10px] font-black text-white/50 uppercase tracking-widest block mb-0.5'>Evento Activo</span>
                <span className='text-base font-bold text-white'>{eventoActivo?.nombre || 'Cargando...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className='flex-1 p-16 flex flex-col justify-center relative bg-white'>
          {/* Desktop Actions */}
          {(showButtons && !showScanner && !showCredits) && (
            <div className='absolute top-10 right-10 flex items-center gap-4 z-30'>
              <button onClick={onInfoClick} className='w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-st-verde hover:border-st-verde/30 transition-all active:scale-95' title='Lista de asistentes'>
                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-5 h-5'><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <button onClick={onAdminClick} className='w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-st-verde hover:border-st-verde/30 transition-all active:scale-95' title='Administración'>
                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-5 h-5'><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" /></svg>
              </button>
              <div className="w-px h-8 bg-slate-100 mx-1"></div>
              <img src={Logo} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          )}

          <AnimatePresence mode='wait'>
            {!result ? (
              <motion.div key="desktop-form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className='max-w-md w-full mx-auto'>
                <h2 className='text-4xl font-black text-slate-900 mb-4 tracking-tight'>Identifícate</h2>
                <p className='text-slate-500 text-lg font-medium mb-10'>Ingresa tu RUT institucional para registrar asistencia.</p>

                <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
                  <div className='relative'>
                    <label className='text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1'>Identificación Estudiantil / RUT</label>
                    <input
                      ref={rutInputRef}
                      type='text'
                      value={rut}
                      onChange={handleInput}
                      placeholder='12345678-K'
                      className='w-full h-20 px-8 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-3xl font-black text-slate-800 placeholder:text-slate-200 focus:bg-white focus:border-st-verde focus:ring-8 focus:ring-st-verde/5 outline-none transition-all tracking-wider'
                      maxLength={12}
                      disabled={!eventoActivo || loading}
                      autoFocus
                      autoComplete='off'
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={loading || !rut.trim() || !eventoActivo}
                    className={`w-full h-20 rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-4 transition-all shadow-xl ${loading || !rut.trim() || !eventoActivo
                      ? 'bg-slate-100 text-slate-400 shadow-none'
                      : 'bg-st-verde text-white hover:bg-emerald-600 shadow-emerald-500/20 active:scale-[0.98]'
                      }`}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Registro'}
                    {!loading && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="desktop-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className='max-w-md w-full mx-auto text-center'>
                <div className='w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20'>
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className='text-5xl font-black text-st-verde mb-3 tracking-tight'>¡Bienvenido!</h2>
                <p className='text-slate-500 text-xl font-bold mb-10'>Tu asistencia ha sido confirmada</p>

                <div className='bg-slate-50 rounded-[2rem] p-10 border border-slate-100 text-left mb-10'>
                  <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2'>Datos del Asistente</span>
                  <h3 className='text-2xl font-black text-slate-900 leading-tight mb-4'>{result.data.nombre ?? `${result.data.nombres ?? ''} ${result.data.apellidos ?? ''}`}</h3>
                  <div className='h-px bg-slate-200 w-full mb-4'></div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <span className='text-[10px] font-bold text-slate-300 uppercase block'>RUT</span>
                      <span className='font-bold text-slate-600'>{result.rut}</span>
                    </div>
                    {result.data.carrera && (
                      <div>
                        <span className='text-[10px] font-bold text-slate-300 uppercase block'>Carrera</span>
                        <span className='font-bold text-slate-600 truncate block'>{result.data.carrera}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setResult(null); setRut(''); setTimeout(() => rutInputRef.current?.focus(), 100); }}
                  className='w-full h-16 rounded-2xl bg-white border-2 border-slate-200 text-st-verde text-lg font-bold hover:bg-st-verde/5 transition-all mb-8 active:scale-95'
                >
                  Nuevo Registro
                </button>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-st-verde" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 30, ease: "linear" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Information Button (Common) */}
      <div className='fixed top-6 right-6 md:top-auto md:bottom-10 md:right-10 z-50'>
        <button
          onClick={() => setShowCredits(true)}
          className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center text-slate-300 hover:text-st-verde transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
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
