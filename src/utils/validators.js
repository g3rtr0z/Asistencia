import { validateRut } from './formatters';

/**
 * Valida un campo requerido
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateRequired = (value, fieldName = 'Este campo') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} es requerido`;
  }
  return null;
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateEmail = email => {
  if (!email) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  return null;
};

/**
 * Valida un RUT
 * @param {string} rut - RUT a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateRutField = rut => {
  if (!rut) return null;

  if (!validateRut(rut)) {
    return 'RUT inválido';
  }
  return null;
};

/**
 * Valida longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateMinLength = (
  value,
  minLength,
  fieldName = 'Este campo'
) => {
  if (!value) return null;

  if (value.length < minLength) {
    return `${fieldName} debe tener al menos ${minLength} caracteres`;
  }
  return null;
};

/**
 * Valida longitud máxima
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateMaxLength = (
  value,
  maxLength,
  fieldName = 'Este campo'
) => {
  if (!value) return null;

  if (value.length > maxLength) {
    return `${fieldName} debe tener máximo ${maxLength} caracteres`;
  }
  return null;
};

/**
 * Valida un número de teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validatePhone = phone => {
  if (!phone) return null;

  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length !== 9) {
    return 'El teléfono debe tener 9 dígitos';
  }

  return null;
};
