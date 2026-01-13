import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../connection/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../assets/logo3.png';

function AdminLogin({ onAuth, onSalir }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onAuth();
    } catch (_err) {
      setError('Credenciales incorrectas o usuario no autorizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen w-full flex'>
      {/* Left Side - Branding */}
      <div className='hidden md:flex md:w-1/2 bg-st-verde relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0'>
          <div className='absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-white/5 rounded-full blur-3xl'></div>
          <div className='absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black/10 rounded-full blur-3xl'></div>
          {/* Grid pattern */}
          <div className='absolute inset-0 opacity-5' style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center items-center w-full p-12 text-white'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <div className='w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg border border-white/20 p-4'>
              <img src={Logo} alt="Logo" className='w-full h-full object-contain' />
            </div>
            <h1 className='text-4xl font-bold mb-4'>Panel Administrativo</h1>
            <p className='text-white/70 text-lg max-w-sm'>
              Gestiona eventos, asistencias y configuración del sistema
            </p>

            {/* Features */}
            <div className='mt-12 space-y-4 text-left max-w-xs mx-auto'>
              <div className='flex items-center gap-3 text-white/80'>
                <div className='w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className='text-sm'>Control total de eventos</span>
              </div>
              <div className='flex items-center gap-3 text-white/80'>
                <div className='w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className='text-sm'>Reportes en tiempo real</span>
              </div>
              <div className='flex items-center gap-3 text-white/80'>
                <div className='w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className='text-sm'>Gestión de usuarios</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='w-full md:w-1/2 min-h-screen flex items-center justify-center p-8 md:p-12 bg-gradient-to-b from-white via-white to-slate-50 md:bg-white'>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='w-full max-w-md flex flex-col min-h-[600px] md:min-h-0 justify-center'
        >
          {/* Mobile Logo */}
          <div className='md:hidden flex flex-col items-center mb-10'>
            <div className='w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-st-verde p-3 mb-4'>
              <img src={Logo} alt="Logo" className='w-full h-full object-contain' />
            </div>
            <span className='text-st-verde font-bold text-sm'>Panel Administrativo</span>
          </div>

          {/* Header */}
          <div className='mb-8 md:mb-10 text-center md:text-left'>
            <h2 className='text-2xl md:text-3xl font-bold text-slate-900 mb-2'>Bienvenido</h2>
            <p className='text-slate-500 text-sm md:text-base'>Ingresa tus credenciales para acceder</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Correo electrónico
              </label>
              <div className='relative'>
                <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type='email'
                  value={email}
                  required
                  onChange={e => setEmail(e.target.value)}
                  placeholder='admin@institucion.cl'
                  className='w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-st-verde rounded-xl focus:bg-white focus:border-st-verde focus:outline-none transition-all text-slate-800 font-medium'
                  autoComplete='username'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Contraseña
              </label>
              <div className='relative'>
                <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type='password'
                  value={pass}
                  required
                  onChange={e => setPass(e.target.value)}
                  placeholder='••••••••'
                  className='w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-st-verde rounded-xl focus:bg-white focus:border-st-verde focus:outline-none transition-all text-slate-800 font-medium'
                  autoComplete='current-password'
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100'
                >
                  <div className='w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className='text-sm font-medium text-red-700'>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || !email.trim() || !pass.trim()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3
                ${loading || !email.trim() || !pass.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-st-verde text-white hover:bg-[#004b30] shadow-lg shadow-st-verde/20 hover:shadow-xl hover:shadow-st-verde/30 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type='button'
              onClick={onSalir}
              className='w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 group'
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver al inicio
            </button>
          </form>

          {/* Footer */}
          <div className='mt-12 pt-8 border-t border-slate-100 text-center'>
            <p className='text-slate-400 text-xs'>
              © {new Date().getFullYear()} Santo Tomás • Sistema de Asistencia
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;
