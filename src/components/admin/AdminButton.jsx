import React from 'react';

function AdminButton({ onClick }) {
  return (
    <button
      className="fixed top-8 right-4 z-50 bg-green-800 text-white w-12 h-12 p-3 rounded-full shadow-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center justify-center"
      title="Entrar como Administrador"
      onClick={onClick}
      style={{ transition: 'background 0.2s' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
      </svg>
    </button>
  );
}

export default AdminButton; 