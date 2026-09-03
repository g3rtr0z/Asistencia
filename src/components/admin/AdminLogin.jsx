import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../connection/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../assets/logopag.png';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { obtenerRolUsuario } from '../../services/authService';

// Manejo seguro de cookies para recordar credenciales (correo y contraseña protegida)
const COOKIE_CORREO = 'admin_correo_recordado';
const COOKIE_AUTH = 'admin_sesion_auth';
const CLAVE_RECORDAR = 'admin_recordarme';

const guardarCookie = (nombre, valor, dias = 30) => {
  const expira = new Date(Date.now() + dias * 864e5).toUTCString();
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; expires=${expira}; path=/; SameSite=Lax`;
};

const obtenerCookie = (nombre) => {
  const coincidencia = document.cookie.match(new RegExp(`(^| )${nombre}=([^;]+)`));
  return coincidencia ? decodeURIComponent(coincidencia[2]) : null;
};

const eliminarCookie = (nombre) => {
  document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
};

// Cifrado reversible simple para ofuscar la contraseña
const ofuscarPass = (texto) => {
  if (!texto) return '';
  try {
    return btoa(encodeURIComponent(texto).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ (0x53 + (i % 7)))
    ).join(''));
  } catch {
    return btoa(texto);
  }
};

const desofuscarPass = (hash) => {
  if (!hash) return '';
  try {
    const decodificado = atob(hash).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ (0x53 + (i % 7)))
    ).join('');
    return decodeURIComponent(decodificado);
  } catch {
    return '';
  }
};

function AdminLogin({ onAuth, onSalir }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  // Cargar credenciales guardadas en cookies al montar el componente
  useEffect(() => {
    localStorage.removeItem('admin_recordado_pass'); // Limpieza de versiones anteriores

    const recordarGuardado = localStorage.getItem(CLAVE_RECORDAR) === 'true';
    const correoCookie = obtenerCookie(COOKIE_CORREO) || localStorage.getItem(COOKIE_CORREO);
    const authCookie = obtenerCookie(COOKIE_AUTH);

    if (recordarGuardado) {
      if (correoCookie) setEmail(correoCookie);
      if (authCookie) {
        const passRestaurada = desofuscarPass(authCookie);
        if (passRestaurada) setPass(passRestaurada);
      }
      setRecordarme(true);
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      if (recordarme) {
        guardarCookie(COOKIE_CORREO, email, 30);
        guardarCookie(COOKIE_AUTH, ofuscarPass(pass), 30);
        localStorage.setItem(COOKIE_CORREO, email);
        localStorage.setItem(CLAVE_RECORDAR, 'true');
      } else {
        eliminarCookie(COOKIE_CORREO);
        eliminarCookie(COOKIE_AUTH);
        localStorage.removeItem(COOKIE_CORREO);
        localStorage.removeItem(CLAVE_RECORDAR);
      }
      localStorage.removeItem('admin_recordado_pass'); // Limpieza

      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const rol = await obtenerRolUsuario(userCredential.user);

      if (!rol) {
        await auth.signOut();
        throw new Error('Usuario revocado o no autorizado');
      }

      onAuth(rol, userCredential.user);
    } catch (err) {
      setError(err.message === 'Usuario revocado o no autorizado'
        ? 'Este usuario no tiene permisos o ha sido eliminado.'
        : 'Credenciales incorrectas o usuario no autorizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-full flex flex-col lg:flex-row relative overflow-x-hidden bg-slate-900'>

      {/* Lado Izquierdo - Fondo Panorámico institucional (Oculto en móvil para enfocar el formulario, visible en escritorio) */}
      <div className='hidden lg:flex w-full lg:w-3/5 min-h-screen relative flex-col justify-between p-8 lg:p-16 text-white shrink-0 overflow-hidden'>
        {/* Imagen de Fondo ST Manuel Rodriguez */}
        <div
          className='absolute inset-0 bg-cover bg-center pointer-events-none transform scale-105'
          style={{
            backgroundImage: `url('/ST Manuel Rodriguez.webp')`,
            filter: 'grayscale(100%) blur(1.5px)'
          }}
        />
        {/* Capa de degradado institucional verde oscuro */}
        <div className='absolute inset-0 bg-gradient-to-t from-slate-950/90 via-[#003822]/85 to-[#004b30]/75 pointer-events-none backdrop-blur-[1px]'></div>

        {/* Elementos decorativos */}
        <div className='absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none'></div>
        <div className='absolute bottom-0 left-0 w-96 h-96 bg-black/40 rounded-full blur-3xl pointer-events-none'></div>

        {/* Header superior izquierdo */}
        <div className='relative z-10 flex items-center gap-3'>
          <div className='w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg'>
            <span className='font-bold text-xl tracking-wider'>ST</span>
          </div>
        </div>

        {/* Contenido central informativo */}
        <div className='relative z-10 max-w-lg my-auto pt-6'>
          <motion.h1
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.45 }}
            className='text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-4 drop-shadow-sm'
          >
            Mi Asistencia - ST
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 0.9, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className='text-white/85 text-sm sm:text-base lg:text-lg font-light leading-relaxed'
          >
            Plataforma institucional para el monitoreo de asistencia, gestión de eventos y análisis de registros en tiempo real.
          </motion.p>
        </div>

        {/* Footer inferior izquierdo */}
        <div className='relative z-10 flex items-center justify-between text-xs text-white/60 pt-6 border-t border-white/15'>
          <span>© {new Date().getFullYear()} Santo Tomás</span>
          <span>Acceso Restringido</span>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login a Pantalla Completa */}
      <div className='w-full lg:w-2/5 min-h-screen bg-gradient-to-t from-slate-900 via-[#003822] to-[#004b30] lg:bg-none lg:bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:p-12 lg:p-14 relative z-10 shadow-2xl overflow-y-auto'>

        {/* Fondo sutil en móvil con imagen difuminada */}
        <div
          className='lg:hidden absolute inset-0 bg-cover bg-center pointer-events-none opacity-20'
          style={{
            backgroundImage: `url('/ST Manuel Rodriguez.webp')`,
            filter: 'grayscale(100%) blur(1px)'
          }}
        />

        {/* Botón Volver - Fijo en la esquina superior izquierda */}
        {onSalir && (
          <div className='absolute left-4 top-6 lg:left-8 lg:top-8 z-50'>
            <button
              onClick={onSalir}
              className='px-3.5 py-2 rounded-xl bg-white/10 lg:bg-white text-white lg:text-slate-700 border border-white/20 lg:border-slate-200 shadow-sm hover:bg-white/20 hover:shadow-md flex items-center gap-2 transition-all duration-200 active:scale-95 group backdrop-blur-sm'
              title='Volver al inicio'
            >
              <ArrowLeft className='w-4 h-4 transform group-hover:-translate-x-1 transition-transform' />
              <span className='text-xs font-bold uppercase tracking-wider'>Volver</span>
            </button>
          </div>
        )}

        {/* Wrapper central para Logo + Formulario */}
        <div className='w-full max-w-md my-auto flex flex-col items-center relative z-10 -translate-y-[20px] lg:translate-y-0'>

          {/* Logo institucional solo visible en móviles */}
          <div className='w-full lg:hidden flex flex-col items-center mb-4'>
            <img src={Logo} alt="Santo Tomás Logo" className='w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-xl filter brightness-0 invert' />
          </div>

          {/* Contenedor principal del formulario */}
          <div className='w-full flex flex-col items-center relative bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-3xl shadow-2xl lg:shadow-none'>

            <motion.div
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4 }}
              className='w-full mb-6 text-center'
            >
              <h2 className='text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2'>
                Iniciar Sesión
              </h2>
              <p className='text-slate-500 text-xs sm:text-sm font-medium'>
                Ingresa tus credenciales institucionales para continuar.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, delay: 0.1 }}
              onSubmit={handleSubmit}
              autoComplete='off'
              className='w-full flex flex-col gap-4 sm:gap-5'
            >
              {/* Correo */}
              <div className='group'>
                <label htmlFor='admin-email' className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1'>
                  Correo institucional
                </label>
                <div className='relative flex items-center'>
                  <div className='absolute left-3.5 sm:left-4 text-slate-400'>
                    <Mail className='w-5 h-5' />
                  </div>
                  <input
                    id='admin-email'
                    name='username'
                    type='email'
                    value={email}
                    required
                    onChange={e => setEmail(e.target.value)}
                    placeholder='correo@santotomas.cl'
                    className='w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-4 bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-st-verde focus:ring-4 focus:ring-st-verde/10 focus:shadow-xl focus:shadow-st-verde/5'
                    autoComplete='off'
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className='group'>
                <label htmlFor='admin-password' className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1'>
                  Contraseña
                </label>
                <div className='relative flex items-center'>
                  <div className='absolute left-3.5 sm:left-4 text-slate-400'>
                    <Lock className='w-5 h-5' />
                  </div>
                  <input
                    id='admin-password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    value={pass}
                    required
                    onChange={e => setPass(e.target.value)}
                    placeholder='••••••••'
                    className='w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-11 sm:pr-12 bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-st-verde focus:ring-4 focus:ring-st-verde/10 focus:shadow-xl focus:shadow-st-verde/5'
                    autoComplete='off'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3.5 sm:right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5'
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme */}
              <div className='flex items-center justify-between px-1'>
                <label className='flex items-center gap-2.5 cursor-pointer select-none'>
                  <input
                    type='checkbox'
                    id='recordarme'
                    name='recordarme'
                    checked={recordarme}
                    onChange={e => setRecordarme(e.target.checked)}
                    className='w-4 h-4 rounded border-slate-300 text-st-verde focus:ring-st-verde cursor-pointer accent-st-verde'
                  />
                  <span className='text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors'>
                    Recordar con cookies para rellenar
                  </span>
                </label>
              </div>

              {/* Mensaje de Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className='p-3 sm:p-3.5 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-semibold'
                  >
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de Enviar */}
              <button
                type='submit'
                disabled={!email.trim() || !pass.trim()}
                aria-busy={loading}
                className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg mt-1 sm:mt-2
                ${loading ? 'pointer-events-none opacity-85 ' : ''}
                ${!email.trim() || !pass.trim()
                    ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed border border-slate-300'
                    : 'bg-st-verde text-white shadow-st-verde/25 hover:bg-[#004b30] hover:shadow-xl hover:shadow-st-verde/30 transform hover:-translate-y-0.5 active:translate-y-0'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Ingresar al Panel</span>
                )}
              </button>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
