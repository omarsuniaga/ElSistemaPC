# Vista Director/Administrador - Panel de Monitoreo de Clases

## Descripción

Se ha implementado una vista profesional y completa para la gestión de usuarios Director/Administrador, específicamente enfocada en el monitoreo de clases en tiempo real y la gestión de estudiantes críticos.

## Archivos Implementados

### 1. AdminReportsView.vue (`src/modulos/Admin/views/AdminReportsView.vue`)

**Panel Principal del Director/Administrador** que incluye:

#### Características Principales:

- **Header con navegación de fechas**: Permite navegar entre días, seleccionar fechas específicas y regresar al día actual
- **KPIs del día**: Muestra métricas clave como clases programadas, maestros esperados, estudiantes esperados y tasa de asistencia
- **Monitoreo en tiempo real**: Visualización de clases actuales con estado en tiempo real (programada, en curso, completada, cancelada)
- **Tabla de estudiantes críticos**: Lista de estudiantes con problemas de asistencia, filtrable y ordenable
- **Sistema de comunicación integrado**: Modal con plantillas predefinidas para comunicación con representantes vía WhatsApp

#### Funcionalidades Específicas:

1. **Navegación de Fechas**:
   - Botones de navegación anterior/siguiente
   - Selector de fecha
   - Botón "Hoy" para volver al día actual

2. **KPIs Dinámicos**:
   - Clases programadas del día
   - Maestros esperados
   - Estudiantes esperados
   - Tasa de asistencia global

3. **Monitoreo de Clases**:
   - Estado visual de cada clase (colores según estado)
   - Información de asistencia en tiempo real
   - Barra de progreso de asistencia
   - Detalles de maestro, horario y aula

4. **Gestión de Estudiantes Críticos**:
   - Filtros múltiples (más ausentes, por instrumento, edad, etc.)
   - Búsqueda por nombre o instrumento
   - Información detallada de cada estudiante
   - Botón de acción directa para comunicación

5. **Sistema de Comunicación**:
   - 5 plantillas predefinidas:
     - Amonestación
     - Falta Leve
     - Carta de Expulsión
     - Entrega de Instrumento
     - Citación al Representante
   - Vista previa del mensaje personalizado
   - Envío directo por WhatsApp

6. **Reportes**:
   - Botón de acceso rápido a reporte semanal
   - Generación de PDF (simulado)

### 2. useClassMonitoring.ts (`src/modulos/Admin/composables/useClassMonitoring.ts`)

**Composable especializado** para el manejo de datos de monitoreo:

#### Funcionalidades:

- **Gestión de estado reactivo**: Métricas del día, clases actuales, estudiantes críticos
- **Permisos RBAC**: Validación de permisos para diferentes acciones
- **Filtrado y búsqueda avanzados**: Múltiples criterios de ordenamiento y filtrado
- **Comunicación**: Generación de mensajes personalizados y envío por WhatsApp
- **Reportes**: Generación de reportes semanales y exportación de datos
- **Tiempo real**: Sistema de actualización automática cada 30 segundos
- **Utilidades**: Funciones helper para formateo y manipulación de datos

#### Tipos de Datos:

```typescript
interface ClassMonitoringData {
  id: string
  name: string
  teacher: string
  schedule: string
  presentStudents: number
  totalStudents: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  attendancePercentage: number
  instrument: string
  room: string
  lastUpdate: Date
}

interface CriticalStudent {
  id: string
  fullName: string
  instrument: string
  age: number
  assignedClasses: number
  absences: number
  attendanceRate: number
  representative: {
    name: string
    phone: string
    email: string
  }
  lastAttendance: Date | null
  riskLevel: "low" | "medium" | "high" | "critical"
}
```

### 3. Router Actualizado (`src/modulos/Admin/router/index.ts`)

Se agregó nueva ruta para el monitoreo:

```typescript
{
  path: '/admin/monitoring',
  name: 'AdminClassMonitoring',
  component: () => import('../views/AdminReportsView.vue'),
  meta: {
    title: 'Monitoreo de Clases - Panel Director',
    requiresAuth: true,
    permissions: {
      module: 'classes',
      action: 'monitor'
    }
  }
}
```

## Integración con RBAC

### Permisos Requeridos:

- `classes_monitor`: Ver monitoreo de clases
- `students_view_reports`: Ver reportes de estudiantes
- `communication_send`: Enviar comunicaciones
- `reports_generate`: Generar reportes
- `admin_full_access`: Acceso completo administrativo

## Características Profesionales

### Diseño y UX:

- **Diseño responsivo**: Compatible con desktop, tablet y móvil
- **Dark mode**: Soporte completo para modo oscuro
- **Animaciones suaves**: Transiciones y efectos visuales profesionales
- **Colores intuitivos**: Sistema de colores que indica estados y prioridades
- **Tipografía clara**: Jerarquía visual bien definida

### Interactividad:

- **Actualizaciones en tiempo real**: Datos que se actualizan automáticamente
- **Filtros dinámicos**: Búsqueda y ordenamiento instantáneos
- **Modales informativos**: Interfaces claras para acciones complejas
- **Feedback visual**: Indicadores de estado y progreso

### Accesibilidad:

- **Navegación por teclado**: Soporte completo para navegación sin mouse
- **Contraste adecuado**: Cumple estándares de accesibilidad WCAG
- **Texto descriptivo**: Labels y descripciones claras
- **Indicadores visuales**: Estados claramente diferenciados

## Datos Mock Incluidos

Para facilitar el desarrollo y pruebas, se incluyen datos mock realistas:

- 12 clases programadas
- 8 maestros esperados
- 48 estudiantes esperados
- 87% tasa de asistencia promedio
- 3 estudiantes críticos con diferentes niveles de riesgo
- 3 clases en diferentes estados (en curso, completada, programada)

## Próximos Pasos Recomendados

### Integraciones Pendientes:

1. **API Real**: Conectar con endpoints reales para datos de clases y estudiantes
2. **WebSocket**: Implementar actualizaciones en tiempo real vía WebSocket
3. **Notificaciones Push**: Sistema de notificaciones para eventos críticos
4. **Exportación PDF**: Implementar generación real de reportes PDF
5. **Historial de Comunicaciones**: Registro de mensajes enviados
6. **Dashboard Analytics**: Gráficos y métricas avanzadas
7. **Alertas Automáticas**: Sistema de alertas basado en reglas

### Mejoras Futuras:

1. **Filtros Avanzados**: Más criterios de filtrado y búsqueda
2. **Bulk Actions**: Acciones masivas sobre múltiples estudiantes
3. **Calendaring**: Integración con calendario institucional
4. **Mobile App**: Versión móvil nativa para directores
5. **AI Insights**: Predicciones y recomendaciones basadas en IA

## Rutas de Acceso

- **Panel Principal**: `/admin/monitoring`
- **Reportes**: `/admin/reports`
- **Dashboard**: `/admin/dashboard`

## Uso Recomendado

1. **Inicio de Jornada**: Revisar KPIs y clases del día
2. **Durante el Día**: Monitorear asistencia en tiempo real
3. **Casos Críticos**: Usar filtros para identificar estudiantes en riesgo
4. **Comunicación Inmediata**: Enviar mensajes personalizados a representantes
5. **Fin de Jornada**: Generar reportes semanales para análisis

Esta implementación proporciona una base sólida y profesional para la gestión directiva/administrativa del sistema académico musical.
