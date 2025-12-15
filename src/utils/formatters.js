/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado
 */
export const formatRut = rut => {
  if (!rut) return '';

  // Limpiar el RUT de caracteres no válidos
  let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();

  // Limitar a 9 caracteres máximo
  clean = clean.slice(0, 9);

  return clean;
};

/**
 * Valida si un RUT es válido
 * @param {string} rut - RUT a validar
 * @returns {boolean} true si es válido
 */
export const validateRut = rut => {
  if (!rut || rut.length < 8) return false;

  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  const dv = cleanRut.slice(-1);
  const rutNumber = cleanRut.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv =
    expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === calculatedDv;
};

/**
 * Formatea una fecha a formato legible
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = date => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export const formatPhone = phone => {
  if (!phone) return '';

  const clean = phone.replace(/\D/g, '');

  if (clean.length === 9) {
    return `+56 ${clean.slice(0, 1)} ${clean.slice(1, 5)} ${clean.slice(5)}`;
  }

  return phone;
};
