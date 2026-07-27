import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToAlumnos,
  borrarColeccionAlumnos,
} from '../services/alumnosService';

export default function useAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;
    let timeoutId = null;

    const loadData = async () => {
      setLoading(true);

      // Timeout para detectar si Firebase no responde
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, 10000);

      unsubscribe = subscribeToAlumnos(
        alumnosData => {
          clearTimeout(timeoutId);
          setAlumnos(alumnosData);
          setLoading(false);
        },
        _error => {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      );
    };

    loadData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Borrar colección
  const handleDeleteComplete = useCallback(async eventoId => {
    try {
      await borrarColeccionAlumnos(eventoId);
    } catch (_e) {
      // Error silenciado intencionalmente
    }
  }, []);

  return {
    alumnos,
    loading,
    handleDeleteComplete,
  };
}
