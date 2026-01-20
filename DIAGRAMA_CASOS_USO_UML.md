# Diagrama de Casos de Uso UML - Versión Simplificada
## Sistema de Gestión de Asistencia Digital

### Actores

**Participante**: Usuario que marca su asistencia en eventos
- Puede ser Alumno o Funcionario según el tipo de evento

**Administrador**: Usuario con permisos para gestionar el sistema completo

---

### Casos de Uso del Participante

1. **Registrar Asistencia**
   - Escaneo de código QR del carnet
   - Ingreso manual de RUT
   - El sistema marca la asistencia automáticamente

2. **Ver Lista de Participantes**
   - Consulta la lista de participantes del evento
   - Puede buscar y filtrar

---

### Casos de Uso del Administrador

1. **Crear/Editar Eventos**
   - Crear nuevos eventos académicos o institucionales
   - Modificar información de eventos existentes

2. **Activar Evento**
   - Seleccionar qué evento está activo para recibir asistencias

3. **Agregar Participantes**
   - Agregar participantes manualmente uno por uno

4. **Editar Participantes**
   - Modificar información de participantes existentes

5. **Importar desde Excel**
   - Cargar múltiples participantes desde archivo Excel
   - Validación automática de datos

6. **Exportar a Excel**
   - Exportar lista de participantes y asistencia
   - Opción de exportar todos, solo presentes o solo ausentes

7. **Ver Estadísticas**
   - Ver estadísticas en tiempo real
   - Total de participantes, presentes y ausentes

8. **Autenticarse**
   - Iniciar sesión como administrador para acceder al panel

---

## Tecnología

- React 19.1.0
- Firebase Firestore (base de datos en tiempo real)
- Tailwind CSS

---

## Cómo Visualizar

El archivo `.puml` puede visualizarse en:
- PlantUML Online: http://www.plantuml.com/plantuml/uml/
- VS Code con extensión PlantUML

