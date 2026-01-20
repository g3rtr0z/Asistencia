# Propuesta de Solución: Sistema de Gestión de Asistencia Digital

## 1. Resumen Ejecutivo

### Problema Identificado
La Sede Temuco de Santo Tomás requería un sistema eficiente para gestionar la asistencia de alumnos y funcionarios en eventos académicos e institucionales. El proceso manual era lento, propenso a errores y no permitía un seguimiento en tiempo real de la asistencia.

### Solución Propuesta
Sistema web de gestión de asistencia digital que permite:
- Registro rápido de asistencia mediante escaneo de código QR o ingreso manual de RUT
- Gestión centralizada de eventos y participantes
- Importación masiva de datos desde Excel
- Visualización de estadísticas en tiempo real
- Interfaz intuitiva y responsiva para uso en dispositivos móviles y de escritorio

---

## 2. Objetivos del Sistema

### Objetivos Generales
- Digitalizar el proceso de registro de asistencia
- Reducir el tiempo de registro por asistente
- Eliminar errores de transcripción manual
- Proporcionar estadísticas en tiempo real
- Facilitar la gestión de múltiples eventos simultáneos

### Objetivos Específicos
- Permitir registro de asistencia en menos de 3 segundos por persona
- Soportar eventos con hasta 1000+ participantes
- Proporcionar exportación de datos a Excel
- Mantener historial completo de asistencias
- Garantizar disponibilidad 24/7

---

## 3. Arquitectura de la Solución

### 3.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Inicio     │  │ Admin Panel  │  │  QR Scanner  │  │
│  │  (Usuario)   │  │ (Admin)      │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│              Firebase Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Firestore   │  │  Real-time   │  │  Storage     │  │
│  │  (Database)  │  │  Updates     │  │  (Assets)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Stack Tecnológico

#### Frontend
- **React 19.1.0**: Framework principal para la interfaz de usuario
- **React Router 7.7.1**: Navegación y enrutamiento
- **Tailwind CSS 4.1.11**: Framework de estilos responsivos
- **Framer Motion 12.23.9**: Animaciones y transiciones
- **HTML5 QR Code 2.3.8**: Escaneo de códigos QR desde cámara
- **XLSX 0.18.5**: Procesamiento de archivos Excel

#### Backend/Servicios
- **Firebase Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Authentication**: Autenticación de administradores
- **Firebase Storage**: Almacenamiento de archivos (opcional)

#### Herramientas de Desarrollo
- **Vite 7.0.4**: Build tool y servidor de desarrollo
- **ESLint**: Linter para calidad de código
- **Prettier**: Formateador de código

---

## 4. Funcionalidades Principales

### 4.1 Módulo de Registro de Asistencia

#### Características
- **Escaneo QR**: Lectura automática de RUT desde código QR del carnet chileno
- **Ingreso Manual**: Entrada de RUT con validación en tiempo real
- **Auto-completado**: Envío automático al completar el RUT (1.5 segundos de inactividad)
- **Validación de RUT**: Verificación del dígito verificador
- **Confirmación Visual**: Tarjeta de confirmación con información del asistente

#### Flujo de Usuario
1. Usuario escanea QR o ingresa RUT manualmente
2. Sistema busca el RUT en la base de datos del evento activo
3. Si existe, marca como presente y muestra información
4. Si no existe, muestra mensaje de error
5. Usuario puede ingresar otro asistente inmediatamente

### 4.2 Módulo de Administración

#### Gestión de Eventos
- Crear, editar y activar/desactivar eventos
- Configurar tipo de evento (alumnos o trabajadores)
- Asignar fechas de inicio y fin
- Visualizar eventos activos e inactivos

#### Gestión de Participantes
- **Importación Masiva**: 
  - Desde archivo Excel (.xlsx, .xls)
  - Columnas soportadas: RUT, Nombres, Apellidos, Carrera, Institución, Grupo, N° de Lista, Presente, Fecha y Hora de Registro
  - Validación de datos antes de importar
  - Detección y omisión de duplicados
- **Importación Individual**: Agregar participantes manualmente
- **Eliminación**: Eliminar participantes individuales o toda la colección
- **Edición**: Modificar datos de participantes existentes

#### Visualización de Datos
- **Lista de Participantes**: Tabla con filtros por:
  - Carrera
  - Institución
  - Grupo
  - RUT
  - Estado (Presente/Ausente)
- **Estadísticas en Tiempo Real**:
  - Total de participantes
  - Presentes vs Ausentes
  - Porcentaje de asistencia
  - Por carrera/institución

#### Exportación
- Exportar lista completa a Excel
- Exportar solo presentes
- Exportar solo ausentes
- Incluir todos los campos de información

### 4.3 Módulo de Escaneo QR

#### Características Técnicas
- Acceso a cámara del dispositivo (móvil o webcam)
- Enfoque automático continuo
- Enfoque manual al tocar la pantalla
- Zoom automático para mejor lectura
- Soporte para códigos QR de carnet chileno
- Extracción automática de RUT desde URL del QR

---

## 5. Estructura de Datos

### 5.1 Modelo de Evento
```javascript
{
  id: string,
  nombre: string,
  tipo: 'alumnos' | 'trabajadores',
  activo: boolean,
  fechaInicio: Date,
  fechaFin: Date,
  fechaCreacion: Date
}
```

### 5.2 Modelo de Alumno/Participante
```javascript
{
  id: string,
  nombres: string,
  apellidos: string,
  nombre: string, // Nombre completo
  rut: string, // Sin puntos ni guiones
  carrera: string,
  institucion: string,
  departamento: string | null, // Solo para trabajadores
  grupo: string | null,
  numeroLista: string | null,
  asiento: string | null,
  presente: boolean,
  asiste: boolean, // Pre-confirmación
  fechaRegistro: Date | null,
  ultimaActualizacion: Date,
  observacion: string | null
}
```

### 5.3 Organización en Firestore
```
eventos/
  {eventoId}/
    alumnos/
      {alumnoId}/
        {datos del alumno}
```

---

## 6. Flujos de Trabajo Principales

### 6.1 Flujo de Registro de Asistencia

```
Usuario → Escanea QR / Ingresa RUT
    ↓
Sistema valida RUT
    ↓
¿RUT existe en evento?
    ├─ SÍ → Marca como presente → Muestra información
    └─ NO → Muestra error
    ↓
Usuario puede ingresar otro asistente
```

### 6.2 Flujo de Importación Masiva

```
Admin → Selecciona archivo Excel
    ↓
Sistema valida formato y tamaño
    ↓
Sistema procesa filas
    ↓
Para cada fila:
    ├─ Normaliza nombres de columnas
    ├─ Valida datos requeridos
    ├─ Verifica duplicados
    └─ Guarda en Firestore
    ↓
Muestra resumen: exitosos, errores, duplicados
```

### 6.3 Flujo de Activación de Evento

```
Admin → Crea/Edita evento
    ↓
Admin → Activa evento
    ↓
Sistema actualiza estado en Firestore
    ↓
Frontend detecta cambio en tiempo real
    ↓
Interfaz muestra evento activo
```

---

## 7. Características Técnicas Destacadas

### 7.1 Tiempo Real
- Actualizaciones instantáneas mediante Firestore listeners
- Sincronización automática entre múltiples dispositivos
- Estadísticas actualizadas sin recargar página

### 7.2 Responsividad
- Diseño mobile-first
- Adaptación automática a diferentes tamaños de pantalla
- Optimización para tablets y escritorio

### 7.3 Rendimiento
- Carga inicial optimizada
- Lazy loading de componentes
- Caché de datos frecuentes
- Compresión de assets

### 7.4 Seguridad
- Autenticación de administradores
- Validación de datos en cliente y servidor
- Protección contra inyección de datos
- Validación de RUT con dígito verificador

### 7.5 Usabilidad
- Interfaz intuitiva y clara
- Feedback visual inmediato
- Mensajes de error descriptivos
- Animaciones suaves para transiciones
- Accesibilidad básica (ARIA labels)

---

## 8. Ventajas y Beneficios

### Para los Organizadores
- ✅ Reducción del tiempo de registro en 80%
- ✅ Eliminación de errores de transcripción
- ✅ Estadísticas en tiempo real
- ✅ Historial completo de asistencias
- ✅ Exportación fácil de datos

### Para los Participantes
- ✅ Registro rápido (menos de 3 segundos)
- ✅ Confirmación inmediata de asistencia
- ✅ Visualización de su información registrada

### Para la Institución
- ✅ Sistema escalable y mantenible
- ✅ Sin costos de infraestructura (Firebase)
- ✅ Actualizaciones automáticas
- ✅ Disponibilidad 24/7
- ✅ Datos respaldados automáticamente

---

## 9. Casos de Uso

### Caso 1: Evento Académico Grande
**Escenario**: Seminario con 500+ alumnos
- Organizador importa lista desde Excel
- Múltiples puntos de registro con tablets
- Escaneo QR masivo
- Monitoreo en tiempo real de asistencia

### Caso 2: Evento de Funcionarios
**Escenario**: Reunión de personal
- Lista pre-cargada de funcionarios
- Registro rápido en entrada
- Estadísticas por departamento

### Caso 3: Evento Recurrente
**Escenario**: Clases semanales
- Reutilización de eventos
- Historial por sesión
- Comparación de asistencia entre sesiones

---

## 10. Consideraciones Técnicas

### 10.1 Limitaciones Conocidas
- Requiere conexión a internet
- Depende de disponibilidad de cámara para QR
- Tamaño máximo de archivo Excel: 10MB
- Límites de Firestore (gestionables con paginación)

### 10.2 Escalabilidad
- Soporta eventos con 1000+ participantes
- Múltiples usuarios simultáneos
- Actualizaciones en tiempo real eficientes

### 10.3 Mantenibilidad
- Código modular y organizado
- Separación de responsabilidades
- Documentación en código
- Estructura de carpetas clara

---

## 11. Plan de Implementación

### Fase 1: Configuración Inicial ✅
- Configuración de Firebase
- Estructura de base de datos
- Autenticación de administradores

### Fase 2: Funcionalidades Core ✅
- Registro de asistencia
- Gestión de eventos
- Importación de datos

### Fase 3: Mejoras y Optimizaciones ✅
- Escaneo QR mejorado
- Validaciones avanzadas
- Exportación de datos

### Fase 4: Mantenimiento Continuo
- Monitoreo de uso
- Corrección de bugs
- Mejoras basadas en feedback

---

## 12. Métricas de Éxito

### Técnicas
- Tiempo de registro promedio: < 3 segundos
- Tasa de error en importación: < 1%
- Disponibilidad del sistema: > 99%
- Tiempo de carga inicial: < 2 segundos

### Operacionales
- Reducción de tiempo de registro: 80%
- Satisfacción de usuarios: > 90%
- Adopción del sistema: 100% de eventos

---

## 13. Conclusiones

El Sistema de Gestión de Asistencia Digital para Santo Tomás Temuco proporciona una solución completa, escalable y fácil de usar para la gestión de asistencia en eventos. La combinación de tecnologías modernas, diseño intuitivo y funcionalidades robustas garantiza una experiencia óptima tanto para organizadores como para participantes.

### Puntos Clave
- ✅ Solución completa y operativa
- ✅ Tecnologías modernas y mantenibles
- ✅ Interfaz intuitiva y responsiva
- ✅ Escalable y eficiente
- ✅ Sin costos de infraestructura adicional

---

## 14. Información del Proyecto

**Desarrollador**: Gerson Uziel Valdebenito  
**Departamento**: Departamento de Informática  
**Institución**: Santo Tomás Temuco  
**Versión**: 2.0  
**Año**: 2026

---

*Este documento describe la propuesta de solución técnica del Sistema de Gestión de Asistencia Digital desarrollado para la Sede Temuco de Santo Tomás.*


