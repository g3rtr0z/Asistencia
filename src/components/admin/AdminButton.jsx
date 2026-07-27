import React from 'react';

function AdminButton({ onClick }) {
  return (
    <button
      className='w-12 h-12 rounded-xl bg-white text-slate-400 border border-slate-200 shadow-sm hover:text-st-verde hover:border-st-verde/30 hover:shadow-md transition-all duration-300 flex items-center justify-center'
      title='Entrar como Administrador'
      onClick={onClick}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-6 h-6'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z'
        />
      </svg>
    </button>
  );
}

export default AdminButton;
