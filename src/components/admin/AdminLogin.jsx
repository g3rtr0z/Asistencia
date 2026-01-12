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
    <div className='min-h-screen w-full bg-st-verde flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Decor - Subtle */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-white/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-black/10 rounded-full blur-3xl'></div>
      </div>

      <div className='w-full max-w-sm mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "outCirc" }}
        >
          {/* Card de login - Ultra Clean */}
          <div className='bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-green-900/50 border border-white/20'>
            {/* Header */}
            <div className='flex flex-col items-center mb-10'>
              <img src={Logo} alt="Santo Tomás" className="h-12 object-contain mb-6" />
              <h2 className='text-xl font-bold text-slate-800 text-center tracking-tight'>
                Administración
              </h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <div className='space-y-1.5'>
                <input
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='nombre@institucion.cl'
                  className='w-full px-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-st-verde/50 text-slate-700 placeholder:text-slate-400 font-medium transition-all text-sm'
                  autoComplete='username'
                />
              </div>

              <div className='space-y-1.5'>
                <input
                  type='password'
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder='Contraseña'
                  className='w-full px-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-st-verde/50 text-slate-700 placeholder:text-slate-400 font-medium transition-all text-sm'
                  autoComplete='current-password'
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className='text-red-600 text-xs font-medium text-center bg-red-50 py-2 rounded-lg'
                >
                  {error}
                </motion.div>
              )}

              <div className='flex flex-col gap-3 pt-4'>
                <motion.button
                  type='submit'
                  disabled={loading || !email.trim() || !pass.trim()}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-200 ${loading || !email.trim() || !pass.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-st-verde hover:bg-[#004b30] text-white shadow-lg shadow-green-900/20'
                    }`}
                  whileHover={!loading && email.trim() && pass.trim() ? { scale: 1.01 } : {}}
                  whileTap={!loading && email.trim() && pass.trim() ? { scale: 0.99 } : {}}
                >
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </motion.button>

                <button
                  type='button'
                  onClick={onSalir}
                  className='w-full py-3 text-slate-400 hover:text-slate-600 font-medium text-xs transition-colors'
                >
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
