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
    <div className='min-h-screen w-full flex bg-slate-50'>
      {/* Left Section - Institutional Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-st-verde relative'>
        {/* Simple decorative element */}
        <div className='absolute inset-0 bg-gradient-to-br from-st-verde to-[#004b30] opacity-50'></div>

        <div className='relative z-10 flex flex-col justify-start items-center w-full p-16 pt-50 text-white'>
          <div className='text-center max-w-md'>
            <div className='w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl p-5'>
              <img src={Logo} alt="Logo Santo Tomás" className='w-full h-full object-contain' />
            </div>
            <h1 className='text-3xl font-bold mb-3'>Panel Administrativo</h1>
            <p className='text-white/80 text-base leading-relaxed'>
              Sistema de Gestión de Asistencia
            </p>
            <div className='mt-8 pt-6 border-t border-white/20'>
              <p className='text-white/60 text-sm'>Santo Tomás - Temuco</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden flex justify-center mb-6'>
            <div className='w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-st-verde p-2'>
              <img src={Logo} alt="Logo" className='w-full h-full object-contain' />
            </div>
          </div>

          {/* Header */}
          <div className='mb-5 text-center lg:text-left'>
            <h2 className='text-xl lg:text-2xl font-bold text-slate-900 mb-1'>Iniciar Sesión</h2>
            <p className='text-slate-500 text-xs lg:text-sm'>Acceso exclusivo para administradores</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className='space-y-3 lg:space-y-4'>
            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Correo electrónico
              </label>
              <input
                type='email'
                value={email}
                required
                onChange={e => setEmail(e.target.value)}
                placeholder='correo@institucional.cl'
                className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:border-st-verde focus:outline-none transition-colors text-slate-900'
                autoComplete='username'
              />
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Contraseña
              </label>
              <input
                type='password'
                value={pass}
                required
                onChange={e => setPass(e.target.value)}
                placeholder='••••••••'
                className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:border-st-verde focus:outline-none transition-colors text-slate-900'
                autoComplete='current-password'
              />
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='overflow-hidden'
                >
                  <div className='flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || !email.trim() || !pass.trim()}
              className={`w-full py-2.5 lg:py-3 rounded-lg font-semibold text-sm lg:text-base transition-all duration-200
                ${loading || !email.trim() || !pass.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-st-verde text-white hover:bg-[#004b30] shadow-sm hover:shadow-md'
                }`}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>

            {/* Back Button */}
            <button
              type='button'
              onClick={onSalir}
              className='w-full py-2.5 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors flex items-center justify-center gap-2'
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver al inicio
            </button>
          </form>

          {/* Footer */}
          <div className='mt-5 lg:mt-6 pt-4 border-t border-slate-200 text-center'>
            <p className='text-slate-400 text-[10px] lg:text-xs'>
              © {new Date().getFullYear()} Santo Tomás • Sistema de Asistencia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
