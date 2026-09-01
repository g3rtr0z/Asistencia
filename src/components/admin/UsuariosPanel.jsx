import React, { useState, useEffect } from 'react';
import {
  escucharUsuarios,
  guardarUsuario,
  actualizarUsuario,
  eliminarUsuario,
  PERMISOS_DEFAULT_ADMIN,
  PERMISOS_DEFAULT_COORDINADOR,
  PERMISOS_DEFAULT_OPERADOR,
} from '../../services/authService';
import {
  Users,
  UserPlus,
  Shield,
  User,
  UserCheck,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Mail,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  // Modal para Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'coordinador',
    cargo: '',
    permisos: { ...PERMISOS_DEFAULT_COORDINADOR },
  });

  // Modal para Confirmar Eliminación
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = escucharUsuarios((lista) => {
      setUsuarios(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4500);
  };

  const cambiarRol = (nuevoRol) => {
    let nuevosPermisos = { ...PERMISOS_DEFAULT_OPERADOR };
    if (nuevoRol === 'admin') nuevosPermisos = { ...PERMISOS_DEFAULT_ADMIN };
    if (nuevoRol === 'coordinador') nuevosPermisos = { ...PERMISOS_DEFAULT_COORDINADOR };

    setFormData({
      ...formData,
      rol: nuevoRol,
      permisos: nuevosPermisos,
    });
  };

  const togglePermiso = (seccion) => {
    if (formData.rol === 'admin') return; // Admin siempre tiene todos los permisos
    setFormData({
      ...formData,
      permisos: {
        ...formData.permisos,
        [seccion]: !formData.permisos?.[seccion],
      },
    });
  };

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setShowPassword(false);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'coordinador',
      cargo: '',
      permisos: { ...PERMISOS_DEFAULT_COORDINADOR },
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (usuario) => {
    setEditandoId(usuario.id);
    setShowPassword(false);
    const rolActual = usuario.rol || 'usuario';
    const permisosActuales = usuario.permisos || (
      rolActual === 'admin'
        ? PERMISOS_DEFAULT_ADMIN
        : rolActual === 'coordinador'
        ? PERMISOS_DEFAULT_COORDINADOR
        : PERMISOS_DEFAULT_OPERADOR
    );

    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: rolActual,
      cargo: usuario.cargo || '',
      permisos: { ...permisosActuales },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      mostrarMensaje('error', 'El correo institucional es obligatorio.');
      return;
    }

    if (!editandoId && (!formData.password || formData.password.length < 6)) {
      mostrarMensaje('error', 'La contraseña para Authentication debe tener al menos 6 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, formData);
        mostrarMensaje('success', 'Usuario y permisos actualizados correctamente.');
      } else {
        await guardarUsuario(formData);
        mostrarMensaje('success', 'Usuario registrado con permisos asignados.');
      }
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', error.message || 'Error al guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setEliminarModalOpen(true);
  };

  const handleEliminar = async () => {
    if (!usuarioAEliminar) return;
    setGuardando(true);
    try {
      await eliminarUsuario(usuarioAEliminar.id);
      mostrarMensaje('success', 'Usuario eliminado de la plataforma.');
      setEliminarModalOpen(false);
      setUsuarioAEliminar(null);
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', 'Error al eliminar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const textoMatch =
      (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.cargo || '').toLowerCase().includes(busqueda.toLowerCase());

    const rolMatch =
      filtroRol === 'todos' ||
      (filtroRol === 'admin' && (u.rol === 'admin' || !u.rol)) ||
      (filtroRol === 'coordinador' && u.rol === 'coordinador') ||
      (filtroRol === 'usuario' && (u.rol === 'usuario' || u.rol === 'operador'));

    return textoMatch && rolMatch;
  });

  return (
    <div className='space-y-6'>
      {/* Header y botón de acción */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-st-verde/10 flex items-center justify-center text-st-verde'>
              <Users className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-slate-800 tracking-tight'>
                Gestión de Usuarios y Permisos
              </h2>
              <p className='text-xs sm:text-sm text-slate-500'>
                Define roles (Admin, Coordinador, Operador) y personaliza los módulos permitidos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={abrirModalNuevo}
          className='w-full sm:w-auto px-4 py-2.5 bg-st-verde text-white rounded-xl hover:bg-[#004b30] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm active:scale-95'
        >
          <UserPlus className='w-4 h-4' />
          <span>Registrar Usuario</span>
        </button>
      </div>

      {/* Alertas */}
      <AnimatePresence>
        {mensaje.texto && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              mensaje.tipo === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <AlertCircle className='w-5 h-5 shrink-0' />
            <span>{mensaje.texto}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buscador y Filtros */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm'>
        <div className='sm:col-span-2 relative flex items-center'>
          <Search className='w-4 h-4 absolute left-3.5 text-slate-400' />
          <input
            type='text'
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder='Buscar por nombre, correo o cargo...'
            className='w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
          />
        </div>

        <div className='flex items-center gap-2'>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className='w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
          >
            <option value='todos'>Todos los roles</option>
            <option value='admin'>Administradores</option>
            <option value='coordinador'>Coordinadores / Supervisores</option>
            <option value='usuario'>Operadores de Asistencia</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className='bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'>
        {loading ? (
          <div className='py-16 flex flex-col items-center justify-center text-slate-400 gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-st-verde' />
            <p className='text-sm font-medium'>Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className='py-16 px-4 text-center'>
            <div className='w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3'>
              <Users className='w-7 h-7' />
            </div>
            <h3 className='text-base font-bold text-slate-700'>No se encontraron usuarios</h3>
            <p className='text-xs text-slate-400 mt-1 max-w-sm mx-auto'>
              {busqueda || filtroRol !== 'todos'
                ? 'Prueba modificando los filtros o el texto de búsqueda.'
                : 'Registra al primer usuario y define sus secciones permitidas.'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>
                  <th className='py-3.5 px-4 sm:px-6'>Usuario</th>
                  <th className='py-3.5 px-4'>Correo</th>
                  <th className='py-3.5 px-4'>Rol Principal</th>
                  <th className='py-3.5 px-4'>Módulos Permitidos</th>
                  <th className='py-3.5 px-4'>Cargo</th>
                  <th className='py-3.5 px-4 sm:px-6 text-right'>Acciones</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 text-sm font-medium text-slate-700'>
                {usuariosFiltrados.map((u) => {
                  const rol = (u.rol || 'admin').toLowerCase();
                  const esAdmin = rol === 'admin';
                  const esCoord = rol === 'coordinador';
                  const permisos = u.permisos || (esAdmin ? PERMISOS_DEFAULT_ADMIN : esCoord ? PERMISOS_DEFAULT_COORDINADOR : PERMISOS_DEFAULT_OPERADOR);

                  return (
                    <tr key={u.id} className='hover:bg-slate-50/60 transition-colors'>
                      <td className='py-4 px-4 sm:px-6'>
                        <div className='flex items-center gap-3'>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            esAdmin ? 'bg-emerald-100 text-st-verde' : esCoord ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(u.nombre || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className='font-bold text-slate-800 text-sm'>
                              {u.nombre || 'Sin nombre asignado'}
                            </div>
                            <div className='text-[11px] text-slate-400'>
                              ID: {u.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className='py-4 px-4'>
                        <span className='text-slate-600 text-xs font-mono bg-slate-100/70 px-2.5 py-1 rounded-lg border border-slate-200/60'>
                          {u.email || 'Sin correo'}
                        </span>
                      </td>

                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            esAdmin
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/70'
                              : esCoord
                              ? 'bg-amber-100 text-amber-800 border border-amber-200/70'
                              : 'bg-blue-50 text-blue-800 border border-blue-200/70'
                          }`}
                        >
                          {esAdmin ? (
                            <Shield className='w-3 h-3' />
                          ) : esCoord ? (
                            <UserCheck className='w-3 h-3' />
                          ) : (
                            <User className='w-3 h-3' />
                          )}
                          <span>
                            {esAdmin
                              ? 'Administrador'
                              : esCoord
                              ? 'Coordinador'
                              : 'Operador Asistencia'}
                          </span>
                        </span>
                      </td>

                      {/* Módulos Permitidos (Badges) */}
                      <td className='py-4 px-4'>
                        <div className='flex flex-wrap gap-1.5'>
                          {permisos.eventos && (
                            <span className='text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold'>
                              Eventos
                            </span>
                          )}
                          {permisos.participantes && (
                            <span className='text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold'>
                              Participantes
                            </span>
                          )}
                          {permisos.asistencia && (
                            <span className='text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md font-semibold'>
                              Ingreso RUT
                            </span>
                          )}
                          {permisos.usuarios && (
                            <span className='text-[10px] bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-md font-semibold'>
                              Usuarios
                            </span>
                          )}
                        </div>
                      </td>

                      <td className='py-4 px-4 text-xs text-slate-500'>
                        {u.cargo || '—'}
                      </td>

                      <td className='py-4 px-4 sm:px-6 text-right'>
                        <div className='flex items-center justify-end gap-1.5'>
                          <button
                            onClick={() => abrirModalEditar(u)}
                            className='p-2 rounded-lg text-slate-400 hover:text-st-verde hover:bg-emerald-50 transition-colors'
                            title='Editar usuario y permisos'
                          >
                            <Edit2 className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => confirmarEliminar(u)}
                            className='p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                            title='Eliminar usuario'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar con Permisos Granulares */}
      <AnimatePresence>
        {modalOpen && (
          <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 max-h-[90vh] overflow-y-auto'
            >
              <button
                onClick={() => setModalOpen(false)}
                className='absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition'
              >
                <X className='w-5 h-5' />
              </button>

              <div className='flex items-center gap-3 mb-6'>
                <div className='w-11 h-11 bg-st-verde/10 rounded-2xl flex items-center justify-center text-st-verde'>
                  {editandoId ? <Edit2 className='w-5 h-5' /> : <UserPlus className='w-5 h-5' />}
                </div>
                <div>
                  <h3 className='text-lg font-bold text-slate-800'>
                    {editandoId ? 'Editar Usuario y Permisos' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className='text-xs text-slate-500'>
                    {editandoId
                      ? 'Actualiza los datos, rol o módulos habilitados.'
                      : 'Crea una cuenta institucional y selecciona a qué secciones puede entrar.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                      Nombre Completo
                    </label>
                    <input
                      type='text'
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder='Ej: María González'
                      className='w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                      Cargo / Área
                    </label>
                    <div className='relative flex items-center'>
                      <Briefcase className='w-4 h-4 absolute left-3.5 text-slate-400' />
                      <input
                        type='text'
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        placeholder='Ej: Asistente / Supervisor'
                        className='w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                    Correo Institucional *
                  </label>
                  <div className='relative flex items-center'>
                    <Mail className='w-4 h-4 absolute left-3.5 text-slate-400' />
                    <input
                      type='email'
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder='correo@santotomas.cl'
                      className='w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
                    />
                  </div>
                </div>

                {!editandoId && (
                  <div>
                    <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                      Contraseña de Acceso (Authentication) *
                    </label>
                    <div className='relative flex items-center'>
                      <Lock className='w-4 h-4 absolute left-3.5 text-slate-400' />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder='Mínimo 6 caracteres'
                        className='w-full h-11 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-st-verde focus:ring-2 focus:ring-st-verde/10 transition-all'
                        autoComplete='new-password'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 text-slate-400 hover:text-slate-600 p-1'
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selección de Perfil / Nivel de Usuario */}
                <div>
                  <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                    Nivel / Perfil de Usuario *
                  </label>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
                    <label
                      onClick={() => cambiarRol('admin')}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        formData.rol === 'admin'
                          ? 'border-st-verde bg-emerald-50/50 text-st-verde shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Shield className='w-5 h-5' />
                      <span className='text-xs font-bold'>Administrador</span>
                      <span className='text-[10px] text-slate-400 text-center leading-tight'>
                        Acceso Total
                      </span>
                    </label>

                    <label
                      onClick={() => cambiarRol('coordinador')}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        formData.rol === 'coordinador'
                          ? 'border-amber-500 bg-amber-50/60 text-amber-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <UserCheck className='w-5 h-5 text-amber-600' />
                      <span className='text-xs font-bold'>Coordinador</span>
                      <span className='text-[10px] text-slate-400 text-center leading-tight'>
                        Nivel Intermedio
                      </span>
                    </label>

                    <label
                      onClick={() => cambiarRol('usuario')}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        formData.rol === 'usuario'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <User className='w-5 h-5 text-blue-600' />
                      <span className='text-xs font-bold'>Operador</span>
                      <span className='text-[10px] text-slate-400 text-center leading-tight'>
                        Solo Asistencia
                      </span>
                    </label>
                  </div>
                </div>

                {/* Selector Granular de Secciones Permitidas */}
                <div className='pt-2'>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      Secciones y Permisos Asignados
                    </label>
                    {formData.rol === 'admin' && (
                      <span className='text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold'>
                        Todas habilitadas por rol
                      </span>
                    )}
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80'>
                    {/* Eventos */}
                    <div
                      onClick={() => togglePermiso('eventos')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        formData.permisos?.eventos
                          ? 'bg-white border-st-verde text-slate-800 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className='flex items-center gap-2.5'>
                        <Calendar className='w-4 h-4 text-st-verde' />
                        <div>
                          <div className='text-xs font-bold'>Gestión de Eventos</div>
                          <div className='text-[10px] text-slate-400'>Crear y ver eventos</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        formData.permisos?.eventos ? 'bg-st-verde border-st-verde text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formData.permisos?.eventos && <Check className='w-3.5 h-3.5' />}
                      </div>
                    </div>

                    {/* Participantes */}
                    <div
                      onClick={() => togglePermiso('participantes')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        formData.permisos?.participantes
                          ? 'bg-white border-st-verde text-slate-800 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className='flex items-center gap-2.5'>
                        <Users className='w-4 h-4 text-st-verde' />
                        <div>
                          <div className='text-xs font-bold'>Participantes</div>
                          <div className='text-[10px] text-slate-400'>Nóminas y asistencia</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        formData.permisos?.participantes ? 'bg-st-verde border-st-verde text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formData.permisos?.participantes && <Check className='w-3.5 h-3.5' />}
                      </div>
                    </div>

                    {/* Ingreso Asistencia (RUT) */}
                    <div
                      onClick={() => togglePermiso('asistencia')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        formData.permisos?.asistencia
                          ? 'bg-white border-emerald-600 text-slate-800 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className='flex items-center gap-2.5'>
                        <CheckSquare className='w-4 h-4 text-emerald-600' />
                        <div>
                          <div className='text-xs font-bold'>Ingreso de RUT</div>
                          <div className='text-[10px] text-slate-400'>Toma de asistencia</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        formData.permisos?.asistencia ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formData.permisos?.asistencia && <Check className='w-3.5 h-3.5' />}
                      </div>
                    </div>

                    {/* Gestión de Usuarios */}
                    <div
                      onClick={() => togglePermiso('usuarios')}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        formData.permisos?.usuarios
                          ? 'bg-white border-purple-600 text-slate-800 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className='flex items-center gap-2.5'>
                        <Shield className='w-4 h-4 text-purple-600' />
                        <div>
                          <div className='text-xs font-bold'>Gestión Usuarios</div>
                          <div className='text-[10px] text-slate-400'>Administrar accesos</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        formData.permisos?.usuarios ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formData.permisos?.usuarios && <Check className='w-3.5 h-3.5' />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='pt-4 flex items-center justify-end gap-3'>
                  <button
                    type='button'
                    onClick={() => setModalOpen(false)}
                    className='px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    disabled={guardando}
                    className='px-5 py-2.5 rounded-xl bg-st-verde text-white font-bold text-xs hover:bg-[#004b30] shadow-md transition flex items-center gap-2'
                  >
                    {guardando ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className='w-4 h-4' />
                        <span>{editandoId ? 'Guardar Cambios' : 'Registrar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {eliminarModalOpen && (
          <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center'
            >
              <div className='w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4'>
                <Trash2 className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-slate-800 mb-1'>¿Eliminar usuario?</h3>
              <p className='text-xs text-slate-500 mb-6'>
                Se revocarán todos los accesos para <strong>{usuarioAEliminar?.email}</strong>.
              </p>

              <div className='flex items-center justify-center gap-3'>
                <button
                  onClick={() => setEliminarModalOpen(false)}
                  className='flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  disabled={guardando}
                  className='flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-md transition flex items-center justify-center gap-2'
                >
                  {guardando ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
