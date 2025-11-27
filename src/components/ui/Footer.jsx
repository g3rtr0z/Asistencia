import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-gray-200 bg-white/70 text-gray-600">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center gap-2 text-center text-xs sm:text-sm">
        <p className="font-semibold tracking-wide text-gray-700">Departamento de Informática · Santo Tomás Temuco</p>
        <p className="text-[11px] text-gray-500">
          © {year} Todos los derechos reservados. Registro de asistencia 
        </p>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2rem]">Desarrollado por Gerson Valdebenito</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-400 uppercase tracking-[0.2rem]">

        </div>
      </div>
    </footer>
  );
};

export default Footer;

