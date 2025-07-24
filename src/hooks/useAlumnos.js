import { useState, useEffect, useCallback } from 'react';
import { subscribeToAlumnos, borrarColeccionAlumnos } from '../services/alumnosService';

export default function useAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;
    let timeoutId = null;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      // Timeout para detectar si Firebase no responde
      timeoutId = setTimeout(() => {
        setError('Firebase no responde. Verifica la configuración.');
        setLoading(false);
      }, 10000);
      unsubscribe = subscribeToAlumnos((alumnosData) => {
        clearTimeout(timeoutId);
        setAlumnos(alumnosData);
        setLoading(false);
      }, (error) => {
        clearTimeout(timeoutId);
        setError('Error al conectar con Firebase: ' + error.message);
        setLoading(false);
      });
    };
    loadData();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Refrescar datos después de importar
  const handleImportComplete = useCallback(() => {
  }, []);

  // Borrar colección
  const handleDeleteComplete = useCallback(async () => {
    try {
      await borrarColeccionAlumnos();
      // Los datos se actualizarán automáticamente
      console.log('Borrado completado');
    } catch (e) {
      setError('Error al borrar la colección: ' + e.message);
    }
  }, []);

  return {
    alumnos,
    loading,
    error,
    handleImportComplete,
    handleDeleteComplete
  };
} 