import { useState, useEffect } from 'react';
import {
  subscribeToEventos,
  subscribeToEventoActivo,
  crearEventosEjemplo,
} from '../services/eventosService';

export default function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeEventos;
    let unsubscribeEventoActivo;

    const setupSubscriptions = async () => {
      try {
        // Crear eventos de ejemplo si no existen
        await crearEventosEjemplo();

        // Suscribirse a todos los eventos
        unsubscribeEventos = subscribeToEventos(
          eventosData => {
            setEventos(eventosData);
            setLoading(false);
          },
          error => {
            console.error('Error en suscripción de eventos:', error);
            setError(error.message);
            setLoading(false);
          }
        );

        // Suscribirse al evento activo
        unsubscribeEventoActivo = subscribeToEventoActivo(
          eventoActivoData => {
            setEventoActivo(eventoActivoData);
          },
          error => {
            console.error('Error en suscripción de evento activo:', error);
            setError(error.message);
          }
        );
      } catch (error) {
        console.error('Error al configurar suscripciones:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeEventos) {
        unsubscribeEventos();
      }
      if (unsubscribeEventoActivo) {
        unsubscribeEventoActivo();
      }
    };
  }, []);

  return {
    eventos,
    eventoActivo,
    loading,
    error,
  };
}
