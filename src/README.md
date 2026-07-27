# Estructura del Proyecto Mi Asistencia

Este documento describe la organización y estructura del proyecto Mi Asistencia.

## 📁 Estructura de Carpetas

```
src/
├── components/          # Componentes de React
│   ├── ui/             # Componentes de interfaz reutilizables
│   ├── forms/          # Formularios
│   ├── layout/         # Componentes de layout
│   ├── modals/         # Modales y diálogos
│   ├── admin/          # Componentes específicos del admin
│   ├── alumnos/        # Componentes relacionados con alumnos
│   └── eventos/        # Componentes relacionados con eventos
├── hooks/              # Custom hooks de React
├── services/           # Servicios de API y lógica de negocio
├── utils/              # Utilidades y helpers
├── constants/          # Constantes del proyecto
├── types/              # Definiciones de tipos (JSDoc)
├── assets/             # Recursos estáticos
└── connection/         # Configuración de conexiones
```

## 🎨 Componentes UI

Los componentes en `components/ui/` son reutilizables y siguen el diseño de Santo Tomás:

- **Button**: Botones con diferentes variantes y estados
- **Input**: Campos de entrada con validación
- **Card**: Contenedores de contenido
- **Modal**: Ventanas modales
- **Table**: Tablas de datos
- **Badge**: Etiquetas y badges

## 🎯 Convenciones de Nomenclatura

### Archivos y Carpetas

- **PascalCase** para componentes: `AlumnosLista.jsx`
- **camelCase** para utilidades: `formatters.js`
- **kebab-case** para assets: `logo-santo-tomas.png`

### Componentes

- **PascalCase** para nombres de componentes
- **camelCase** para props y métodos
- **UPPER_CASE** para constantes

### Estilos

- Usar **Tailwind CSS** para estilos
- Colores de la marca Santo Tomás definidos en `constants/colors.js`
- Componentes responsivos por defecto

## 🔧 Utilidades

### Formatters (`utils/formatters.js`)

- `formatRut()`: Formatea RUTs chilenos
- `validateRut()`: Valida RUTs
- `formatDate()`: Formatea fechas
- `formatPhone()`: Formatea teléfonos

### Validators (`utils/validators.js`)

- `validateRequired()`: Valida campos requeridos
- `validateEmail()`: Valida emails
- `validateRutField()`: Valida RUTs
- `validateMinLength()`: Valida longitud mínima
- `validateMaxLength()`: Valida longitud máxima
- `validatePhone()`: Valida teléfonos

## 🎨 Colores y Tema

Los colores están definidos en `constants/colors.js` siguiendo la paleta de Santo Tomás:

- **Verde Santo Tomás**: `#16a34a` (primary)
- **Azul**: `#0ea5e9` (secondary)
- **Grises**: Escala completa para textos y fondos
- **Estados**: Success, Warning, Error, Info

## 📱 Responsive Design

Todos los componentes son responsivos por defecto usando Tailwind CSS:

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Flexbox/Grid**: Layouts modernos y flexibles

## 🔄 Hooks Personalizados

Los hooks en `hooks/` encapsulan lógica reutilizable:

- `useAlumnos.js`: Gestión de alumnos
- `useEventos.js`: Gestión de eventos
- `useAlumnosEvento.js`: Relación alumnos-eventos

## 🌐 Servicios

Los servicios en `services/` manejan la comunicación con APIs:

- `alumnosService.js`: Operaciones CRUD de alumnos
- `eventosService.js`: Operaciones CRUD de eventos
- `eventosAlumnosService.js`: Gestión de asistencias
- `migracionService.js`: Migración de datos

## 📝 Tipos de Datos

Los tipos están documentados en `types/index.js` usando JSDoc:

- `Alumno`: Estructura de datos de alumno
- `Evento`: Estructura de datos de evento
- `Asistencia`: Estructura de datos de asistencia
- `Usuario`: Estructura de datos de usuario
- `Estadisticas`: Estructura de datos de estadísticas

## 🚀 Mejores Prácticas

1. **Componentes Funcionales**: Usar hooks en lugar de clases
2. **Props Destructuring**: Desestructurar props al inicio
3. **Error Boundaries**: Manejar errores apropiadamente
4. **Loading States**: Mostrar estados de carga
5. **Accessibility**: Seguir estándares de accesibilidad
6. **Performance**: Usar React.memo y useMemo cuando sea necesario
7. **Testing**: Escribir tests para componentes críticos

## 📦 Imports

Usar imports absolutos cuando sea posible:

```javascript
// ✅ Bueno
import { Button } from '@/components/ui';
import { formatRut } from '@/utils';
import { COLORS } from '@/constants';

// ❌ Evitar
import { Button } from '../../../components/ui/Button';
```

## 🔍 Debugging

- Usar `DebugInfo` component para información de desarrollo
- Implementar logging consistente
- Usar React DevTools para debugging
- Mantener console.logs solo en desarrollo
