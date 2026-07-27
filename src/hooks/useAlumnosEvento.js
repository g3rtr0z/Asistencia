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
        setLoading(true);

        if (eventoId) {
          // Si se proporciona un eventoId específico, suscribirse a ese evento
          console.log('[useAlumnosEvento] Suscribiendo a evento específico:', eventoId);
          unsubscribe = subscribeToAlumnosPorEvento(
            eventoId,
            alumnosData => {
              console.log('[useAlumnosEvento] Datos recibidos para evento', eventoId, ':', alumnosData.length, 'alumnos');
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
          console.log('[useAlumnosEvento] Suscribiendo a evento activo');
          unsubscribe = subscribeToAlumnosEventoActivo(
            alumnosData => {
              console.log('[useAlumnosEvento] Datos recibidos del evento activo:', alumnosData.length, 'alumnos');
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
      console.log('[useAlumnosEvento] Limpiando suscripción para eventoId:', eventoId || 'activo');
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
