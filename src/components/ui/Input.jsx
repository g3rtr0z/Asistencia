import React from 'react';

const Input = ({
  label,
  error,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className='w-full'>
      {label && (
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          {label}
        </label>
      )}
      <div className='relative'>
        <input
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-green-500 focus:border-transparent 
            outline-none transition-all duration-200 text-sm
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};

export default Input;
