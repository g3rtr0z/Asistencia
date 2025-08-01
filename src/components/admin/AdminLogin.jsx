import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../connection/firebase';
import { motion } from 'framer-motion';

function AdminLogin({ onAuth, onSalir }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onAuth();
    } catch (err) {
      setError("Credenciales incorrectas o usuario no autorizado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Card de login */}
          <div className="bg-white border border-slate-200 rounded-lg p-10 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-green-800 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">Acceso Administrador</h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@institucion.cl"
                  className="w-full px-4 py-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">

                <motion.button
                  type="submit"
                  disabled={loading || !email.trim() || !pass.trim()}
                  className={`flex-1 py-4 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${loading || !email.trim() || !pass.trim()
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-green-800 hover:bg-green-700 text-white'
                    }`}
                  whileHover={!loading && email.trim() && pass.trim() ? { scale: 1.02 } : {}}
                  whileTap={!loading && email.trim() && pass.trim() ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
                      </svg>
                      <span>Ingresar</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  className="flex-1 py-4 px-4 text-green-800 text-sm hover:text-green-900 transition-colors border border-slate-300 rounded-lg hover:bg-green-50"
                  onClick={onSalir}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancelar
                </motion.button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-1">
            <p className="text-xs text-slate-500">Versión 1.0</p>
            <p className="text-xs text-slate-500">Departamento de Informática Santo Tomas Temuco 2025</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;
