Resumen Explicativo del Proyecto MiAsistenciaST

2. Flujo Principal de la Aplicación

App.jsx: Componente raíz que gestiona el estado global: usuarios, modo admin, filtros y lógica de asistencia. Renderiza el formulario de asistencia (Inicio.jsx) o el panel de administración (AdminPanel.jsx) según el modo. Usa el componente AdminButton para acceder al panel de administración. Utiliza hooks personalizados para cargar y filtrar alumnos desde Firebase.

main.jsx: Punto de entrada de React. Renderiza el componente App en el DOM.

3. Componentes Principales

Inicio.jsx: Formulario de ingreso de RUT para marcar asistencia. Muestra la información del alumno (nombre, RUT, carrera, institución) al marcar como presente. Todo ocurre en la misma página, sin redirecciones. Centrado y adaptado para móviles y escritorio.

AdminPanel.jsx: Panel de administración con pestañas para gestión y estadísticas. Permite importar alumnos desde un archivo JSON (ImportJSON.jsx). Permite borrar toda la colección de alumnos (DeleteCollection.jsx). Muestra la lista de alumnos con filtros y estado de asistencia. Usa Tailwind CSS para un diseño moderno y responsivo.

AdminButton.jsx: Botón flotante para acceder al panel de administración.

AlumnosLista.jsx: Muestra una tabla de alumnos con filtros por carrera, institución y RUT. Indica el estado de asistencia (presente/ausente) de cada alumno.

EstadisticasPanel.jsx: Muestra estadísticas de asistencia en tarjetas, adaptadas a dispositivos móviles.

4. Componentes de Administración

ImportJSON.jsx: Permite importar una lista de alumnos desde un archivo JSON. Valida el formato y muestra mensajes de éxito o error.

DeleteCollection.jsx: Permite borrar todos los alumnos de la base de datos con confirmación. Muestra mensajes de advertencia y éxito/error.

5. Servicios y Lógica de Datos

alumnosService.js: Funciones para interactuar con Firebase Firestore: Obtener todos los alumnos. Suscribirse a cambios en tiempo real. Buscar alumno por RUT. Agregar, actualizar y borrar alumnos. Actualizar el estado de presencia.

firebase.js: Configuración e inicialización de Firebase para el proyecto.

6. Estilos y Experiencia de Usuario

Tailwind CSS se utiliza en todos los componentes para un diseño limpio, moderno y responsivo. El formulario y las tablas están centrados y adaptados a móviles. Los modales y menús usan React Portal para aparecer sobre todo el contenido. El flujo de usuario es claro: marcar asistencia, ver confirmación y datos, y volver a ingresar otro RUT si se desea.

7. Buenas Prácticas

Código modular y organizado por responsabilidades. Separación clara entre lógica de negocio, presentación y servicios. Componentes reutilizables y fáciles de mantener. Uso de hooks personalizados para lógica de datos.


