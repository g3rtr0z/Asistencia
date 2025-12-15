import { useState, useEffect } from 'react';
import {
  subscribeToAlumnosEventoActivo,
  subscribeToAlumnosPorEvento,
} from '../services/alumnosService';

export default function useAlumnosEvento(eventoId = null) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const setupSubscription = () => {
      try {
        if (eventoId) {
          // Si se proporciona un eventoId específico, suscribirse a ese evento
          unsubscribe = subscribeToAlumnosPorEvento(
            eventoId,
            alumnosData => {
              setAlumnos(alumnosData);
              setLoading(false);
            },
            error => {
              console.error(
                'Error en suscripción de alumnos por evento:',
                error
              );
              setError(error.message);
              setLoading(false);
            }
          );
        } else {
          // Si no se proporciona eventoId, suscribirse al evento activo
          unsubscribe = subscribeToAlumnosEventoActivo(
            alumnosData => {
              setAlumnos(alumnosData);
              setLoading(false);
            },
            error => {
              console.error(
                'Error en suscripción de alumnos evento activo:',
                error
              );
              setError(error.message);
              setLoading(false);
            }
          );
        }
      } catch (error) {
        console.error('Error al configurar suscripción de alumnos:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventoId]);

  return {
    alumnos,
    loading,
    error,
  };
}
