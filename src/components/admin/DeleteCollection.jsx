import React, { useState } from 'react';
import { borrarColeccionAlumnos } from '../../services/alumnosService';

function DeleteCollection({ onDeleteComplete, totalAlumnos }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    setMessage('Borrando colección...');
    try {
      const result = await borrarColeccionAlumnos();
      if (result.success) {
        setMessage(
          `Colección borrada exitosamente. ${result.deletedCount} alumnos eliminados.`
        );
        setShowConfirm(false);
        if (onDeleteComplete) {
          onDeleteComplete();
        }
      }
    } catch (error) {
      setMessage(`Error al borrar la colección: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setMessage('');
  };

  return (
    <div className='bg-white p-10 rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl mx-auto'>
      <h3 className='text-2xl font-bold text-red-700 mb-6'>Borrar Colección</h3>
      {!showConfirm ? (
        <div>
          <p className='mb-4 text-lg text-gray-700'>
            Esta acción eliminará permanentemente todos los{' '}
            <span className='font-bold'>{totalAlumnos}</span> alumnos de la base
            de datos.
          </p>
          <p className='text-red-600 text-base mb-6 font-semibold'>
            ⚠️ Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleDelete}
            className='bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-red-700 transition w-full'
          >
            Borrar Colección
          </button>
        </div>
      ) : (
        <div>
          <p className='text-red-700 font-bold mb-4 text-lg'>
            ¿Estás seguro de que quieres borrar todos los {totalAlumnos}{' '}
            alumnos?
          </p>
          <p className='text-gray-700 mb-6 text-base'>
            Esta acción eliminará permanentemente todos los datos y no se puede
            deshacer.
          </p>
          {message && (
            <div
              className={`p-4 rounded-md mb-6 text-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
            >
              {message}
            </div>
          )}
          <div className='flex gap-4'>
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`px-6 py-3 rounded-lg text-white font-bold text-lg w-full ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Borrando...' : 'Sí, borrar todo'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className='px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold text-lg w-full'
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeleteCollection;
