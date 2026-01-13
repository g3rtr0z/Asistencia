import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../connection/firebase';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
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
    <div className='min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden'>

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className='hidden md:flex md:w-5/12 bg-st-verde relative overflow-hidden flex-col justify-between p-12 lg:p-16'>
        {/* Decorative elements */}
        <div className='absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2'></div>
        <div className='absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2'></div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className='relative z-10'
        >
          <div className='w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 mb-12 shadow-xl'>
            <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className='text-4xl lg:text-5xl font-bold text-white leading-tight mb-6'>
            Panel de<br />Administración
          </h1>
          <p className='text-white/70 text-lg max-w-sm font-medium'>
            Accede al sistema de gestión de asistencia institucional con tus credenciales autorizadas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className='relative z-10 flex items-center gap-3 text-white/50 text-xs font-bold uppercase tracking-[0.2em]'
        >
          <div className='h-px w-8 bg-white/30'></div>
          Santo Tomás &bull; {new Date().getFullYear()}
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className='w-full md:w-7/12 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-slate-50 md:bg-white'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='w-full max-w-md'
        >
          {/* Mobile Layout Header */}
          <div className='flex md:hidden flex-col items-center mb-10'>
            <img src={Logo} alt="Logo" className="h-14 object-contain mb-4" />
            <h2 className='text-xl font-bold text-slate-800 uppercase tracking-wider'>Administración</h2>
          </div>

          {/* Form Container */}
          <div className='bg-white md:bg-transparent p-8 md:p-0 rounded-[2.5rem] md:rounded-none shadow-xl shadow-slate-200/50 md:shadow-none border border-slate-100 md:border-none'>
            <div className='mb-10 hidden md:block'>
              <h2 className='text-3xl font-bold text-slate-900 mb-2'>Bienvenido</h2>
              <p className='text-slate-500 font-medium'>Por favor, ingresa tus datos para continuar.</p>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
              <div className='space-y-5'>
                <div className='relative group'>
                  <label className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1'>Correo Electrónico</label>
                  <div className='relative'>
                    <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-st-verde transition-colors'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type='email'
                      value={email}
                      required
                      onChange={e => setEmail(e.target.value)}
                      placeholder='ejemplo@institucion.cl'
                      className='w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-st-verde/30 focus:ring-4 focus:ring-st-verde/5 transition-all outline-none text-slate-700 font-medium'
                    />
                  </div>
                </div>

                <div className='relative group'>
                  <label className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1'>Contraseña</label>
                  <div className='relative'>
                    <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-st-verde transition-colors'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type='password'
                      value={pass}
                      required
                      onChange={e => setPass(e.target.value)}
                      placeholder='••••••••'
                      className='w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-st-verde/30 focus:ring-4 focus:ring-st-verde/5 transition-all outline-none text-slate-700 font-medium'
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100'
                >
                  <div className='w-6 h-6 rounded-full bg-red-500 fill-white flex items-center justify-center shrink-0 shadow-sm'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className='text-xs font-bold text-red-600 leading-tight'>{error}</p>
                </motion.div>
              )}

              <div className='flex flex-col gap-4 pt-2'>
                <button
                  type='submit'
                  disabled={loading || !email.trim() || !pass.trim()}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all duration-300 ${loading || !email.trim() || !pass.trim()
                    ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                    : 'bg-st-verde hover:bg-[#004b30] shadow-green-900/10 active:scale-[0.98]'
                    }`}
                >
                  <span className='flex items-center justify-center gap-2'>
                    {loading ? (
                      <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                    ) : (
                      'Entrar al Panel'
                    )}
                  </span>
                </button>

                <button
                  type='button'
                  onClick={onSalir}
                  className='flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-all duration-300 group'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Volver al inicio
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;
