import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../connection/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../assets/logopag.png';
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { obtenerRolUsuario } from '../../services/authService';

// ─── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_CORREO  = 'admin_correo_recordado';
const COOKIE_AUTH    = 'admin_sesion_auth';
const CLAVE_RECORDAR = 'admin_recordarme';

const guardarCookie = (nombre, valor, dias = 30) => {
  const expira = new Date(Date.now() + dias * 864e5).toUTCString();
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; expires=${expira}; path=/; SameSite=Lax`;
};
const obtenerCookie = (nombre) => {
  const m = document.cookie.match(new RegExp(`(^| )${nombre}=([^;]+)`));
  return m ? decodeURIComponent(m[2]) : null;
};
const eliminarCookie = (nombre) => {
  document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
};
const ofuscarPass = (texto) => {
  if (!texto) return '';
  try {
    return btoa(encodeURIComponent(texto).split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ (0x53 + (i % 7)))
    ).join(''));
  } catch { return btoa(texto); }
};
const desofuscarPass = (hash) => {
  if (!hash) return '';
  try {
    const d = atob(hash).split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ (0x53 + (i % 7)))
    ).join('');
    return decodeURIComponent(d);
  } catch { return ''; }
};

// ─── Componente ───────────────────────────────────────────────────────────────
function AdminLogin({ onAuth, onSalir }) {
  const [email,        setEmail]        = useState('');
  const [pass,         setPass]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  // Cargar credenciales guardadas
  useEffect(() => {
    // Limpiar hoja de estilos anterior si existe
    ['lgn-stylesheet', 'lgn2-stylesheet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    localStorage.removeItem('admin_recordado_pass');
    const recordarGuardado = localStorage.getItem(CLAVE_RECORDAR) === 'true';
    const correoCookie     = obtenerCookie(COOKIE_CORREO) || localStorage.getItem(COOKIE_CORREO);
    const authCookie       = obtenerCookie(COOKIE_AUTH);
    if (recordarGuardado && correoCookie) {
      setEmail(correoCookie);
      if (authCookie) {
        const p = desofuscarPass(authCookie);
        if (p) setPass(p);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      // Siempre guardar si hay credenciales (comportamiento silencioso)
      if (email && pass) {
        guardarCookie(COOKIE_CORREO, email, 30);
        guardarCookie(COOKIE_AUTH, ofuscarPass(pass), 30);
        localStorage.setItem(COOKIE_CORREO, email);
        localStorage.setItem(CLAVE_RECORDAR, 'true');
      }
      localStorage.removeItem('admin_recordado_pass');

      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const rol = await obtenerRolUsuario(userCredential.user);

      if (!rol) {
        await auth.signOut();
        throw new Error('Usuario revocado o no autorizado');
      }
      onAuth(rol, userCredential.user);
    } catch (err) {
      setError(
        err.message === 'Usuario revocado o no autorizado'
          ? 'Este usuario no tiene permisos o ha sido eliminado.'
          : 'Credenciales incorrectas. Verifica tu correo y contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email.trim() || !pass.trim();

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-slate-50'>
      <div className='w-full max-w-xl xl:max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col xl:flex-row'>

        {/* ── Panel Izquierdo (institucional) ── */}
        <div className='bg-st-verde p-6 md:p-8 xl:p-12 text-white flex flex-row xl:flex-col justify-between items-center xl:items-start relative overflow-hidden shrink-0 xl:w-5/12'>

          {/* Imagen de fondo con desenfoque */}
          <div
            className='absolute inset-0 bg-cover bg-center pointer-events-none transform scale-105'
            style={{
              backgroundImage: `url('/ST Manuel Rodriguez.webp')`,
              filter: 'grayscale(100%) blur(2px)'
            }}
          />
          {/* Overlay verde institucional */}
          <div className='absolute inset-0 bg-gradient-to-tr from-[#003822]/90 via-st-verde/85 to-[#005a38]/80 pointer-events-none backdrop-blur-[1px]' />
          {/* Destellos decorativos */}
          <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-black/30 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none' />

          {/* Logo y título */}
          <div className='relative z-10 flex items-center gap-4 xl:block'>
            <div className='w-10 h-10 md:w-16 md:h-16 xl:mb-8'>
              <img
                src={Logo}
                alt='Santo Tomás'
                className='w-full h-full object-contain filter brightness-0 invert opacity-90'
              />
            </div>
            <div className='hidden xl:block'>
              <p className='text-white/60 text-xs font-semibold tracking-widest uppercase mb-2'>
                Sistema Institucional
              </p>
              <h1 className='text-3xl md:text-4xl font-bold leading-tight mb-3'>
                Acceso al Panel
              </h1>
              <p className='text-white/75 text-base font-light max-w-xs leading-relaxed'>
                Plataforma de gestión y monitoreo de asistencia para eventos institucionales.
              </p>
            </div>
          </div>

          {/* Badge de acceso restringido */}
          <div className='relative z-10 mt-0 xl:mt-12'>
            <div className='flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/20'>
              <div className='w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 md:h-5 md:w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
                </svg>
              </div>
              <div>
                <div className='text-[10px] md:text-xs text-white/60 uppercase tracking-wider font-semibold'>Área</div>
                <div className='font-bold text-xs md:text-sm'>Acceso Restringido</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel Derecho (formulario) ── */}
        <div className='xl:w-7/12 p-6 md:p-10 xl:p-16 flex flex-col justify-center bg-gradient-to-b from-white via-white to-slate-50/50 relative'>

          {/* Botón Volver */}
          {onSalir && (
            <div className='absolute top-4 left-4 md:top-6 md:left-6'>
              <button
                onClick={onSalir}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95'
                title='Volver al inicio'
              >
                <ArrowLeft className='w-3.5 h-3.5' />
                Volver
              </button>
            </div>
          )}

          {/* Logo en esquina superior derecha (solo desktop) */}
          <div className='absolute top-6 right-8 hidden xl:block'>
            <img src={Logo} alt='Santo Tomás' className='w-20 h-20 object-contain opacity-90' />
          </div>

          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className='max-w-md mx-auto w-full mt-8 xl:mt-0'
          >
            <h2 className='text-2xl md:text-3xl font-bold text-slate-800 mb-1 tracking-tight'>
              Iniciar Sesión
            </h2>
            <p className='text-slate-500 mb-6 md:mb-8 text-sm font-medium opacity-80'>
              Ingresa tus credenciales institucionales para continuar.
            </p>

            <form onSubmit={handleSubmit} autoComplete='off' className='flex flex-col gap-5'>

              {/* Correo */}
              <div className='group'>
                <label htmlFor='admin-email' className='block text-xs font-semibold text-slate-700 mb-2 ml-1 uppercase tracking-wider'>
                  Correo institucional
                </label>
                <input
                  id='admin-email'
                  name='username'
                  type='email'
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='correo@santotomas.cl'
                  className='w-full h-12 md:h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-st-verde focus:bg-white focus:shadow-lg focus:shadow-st-verde/5 placeholder:font-normal placeholder:text-slate-400'
                  autoComplete='off'
                />
              </div>

              {/* Contraseña */}
              <div className='group'>
                <label htmlFor='admin-password' className='block text-xs font-semibold text-slate-700 mb-2 ml-1 uppercase tracking-wider'>
                  Contraseña
                </label>
                <div className='relative'>
                  <input
                    id='admin-password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    value={pass}
                    required
                    onChange={(e) => setPass(e.target.value)}
                    placeholder='••••••••••'
                    className='w-full h-12 md:h-14 px-4 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-st-verde focus:bg-white focus:shadow-lg focus:shadow-st-verde/5 placeholder:font-normal placeholder:text-slate-400'
                    autoComplete='off'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100'
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className='flex items-start gap-2.5 p-3 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-xs font-medium'
                  >
                    <AlertCircle className='w-4 h-4 mt-0.5 shrink-0' />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón Submit */}
              <button
                id='login-submit-btn'
                type='submit'
                disabled={isDisabled}
                aria-busy={loading}
                className={`
                  w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-sm md:text-base
                  transition-all duration-300 flex items-center justify-center gap-3 shadow-lg
                  ${loading ? 'pointer-events-none opacity-80' : ''}
                  ${isDisabled
                    ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                    : 'bg-st-verde text-white shadow-st-verde/20 hover:bg-[#004b30] hover:shadow-xl hover:shadow-st-verde/30 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Panel</span>
                    {!isDisabled && (
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
                      </svg>
                    )}
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <p className='text-center text-xs text-slate-400 mt-8'>
              © {new Date().getFullYear()} Instituto Profesional Santo Tomás &mdash; Acceso Restringido
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
