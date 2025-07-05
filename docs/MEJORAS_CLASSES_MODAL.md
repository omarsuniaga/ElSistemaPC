# Mejoras en ClassesModal - Mostrar Clases Programadas y con Asistencia Registrada

## 📋 Descripción de las Mejoras

Se ha mejorado el componente `ClassesModal.vue` y la función `fetchClassesForDate` en `AttendanceView.vue` para mostrar tanto las **clases programadas** como las **clases con asistencia registrada** para una fecha específica.

## 🎯 Objetivos Cumplidos

1. ✅ **Mostrar clases programadas**: Las clases que corresponden al día de la semana seleccionado
2. ✅ **Mostrar clases con asistencia registrada**: Clases extra, de recuperación o no programadas que tienen asistencia registrada
3. ✅ **Distinguir visualmente**: Separación clara entre ambos tipos de clases
4. ✅ **Información completa**: Estado de asistencia, horarios, número de estudiantes, etc.

## 🔧 Cambios Implementados

### 1. Mejoras en `AttendanceView.vue` - Función `fetchClassesForDate`

#### Antes:

- Solo mostraba clases programadas para el día de la semana
- No incluía clases extra o de recuperación

#### Después:

- **Obtiene clases programadas** usando `classesStore.getClassesByDayAndTeacherId()`
- **Obtiene clases con asistencia registrada** filtrando `attendanceStore.attendanceDocuments`
- **Combina ambas listas** sin duplicar usando un Map
- **Clasifica las clases** como:
  - `type: 'scheduled'` - Clases programadas
  - `type: 'recorded'` - Clases con asistencia registrada
- **Ordena los resultados**: Primero programadas, luego extra

### 2. Mejoras en `ClassesModal.vue`

#### Nuevas Secciones Visuales:

1. **Sección "Clases Programadas"**:
   - Icono de calendario
   - Contador de clases
   - Badge azul para "Programada" o verde para "Registrado"
   - Información completa de horarios y estudiantes

2. **Sección "Clases Extra/Recuperación"**:
   - Icono de "+" (plus)
   - Contador de clases extra
   - Fondo naranja distintivo
   - Badge verde "Registrado"
   - Indicador especial "Clase extra o de recuperación"

#### Nuevas Computed Properties:

- `scheduledClasses`: Filtra clases programadas
- `extraClasses`: Filtra clases extra/recuperación

## 📊 Estructura de Datos

### Propiedades Añadidas a las Clases:

```typescript
{
  // Propiedades existentes...
  id: string,
  name: string,
  // Nuevas propiedades de clasificación
  classType: 'scheduled' | 'recorded',
  isScheduledClass: boolean,
  hasAttendanceRecord: boolean,
  attendanceRecord?: AttendanceDocument
}
```

## 🎨 Mejoras Visuales

### Clases Programadas:

- **Color**: Azul para pendientes, verde para registradas
- **Icono**: Calendario
- **Badge**: "Programada" / "Registrado"

### Clases Extra:

- **Color**: Fondo naranja distintivo
- **Icono**: Plus (+)
- **Badge**: "Registrado" (siempre verde)
- **Indicador**: "Clase extra o de recuperación"

## 🔍 Casos de Uso Cubiertos

1. **Día normal con clases programadas**: Muestra todas las clases del horario
2. **Clases con asistencia registrada**: Indica cuáles ya tienen asistencia
3. **Clases extra/recuperación**: Muestra clases no programadas pero con asistencia
4. **Día sin clases**: Mensaje apropiado
5. **Combinación**: Clases programadas + clases extra en el mismo día

## 🚀 Beneficios

1. **Visibilidad completa**: El maestro ve todo lo que ha pasado en una fecha
2. **Organización clara**: Separación visual entre tipos de clases
3. **Información completa**: Estado de asistencia, horarios, estudiantes
4. **Navegación intuitiva**: Click para ir directamente a la asistencia
5. **Flexibilidad**: Soporta clases extra, recuperación, etc.

## 🔧 Uso

1. **Abrir el modal**: Click en una fecha del calendario
2. **Ver clases programadas**: Sección superior con clases del horario
3. **Ver clases extra**: Sección inferior con fondo naranja
4. **Registrar asistencia**: Click en cualquier clase para navegar

## 📝 Notas Técnicas

- Las clases se ordenan automáticamente: programadas primero, extra después
- Se evita duplicación usando Map con clave `classId`
- La información se combina de múltiples fuentes (store de clases + registros de asistencia)
- Soporte completo para dark mode
- Responsive design para diferentes tamaños de pantalla

## 🐛 Consideraciones

- Las clases extra se identifican por tener asistencia registrada sin estar programadas
- El sistema mantiene compatibilidad con la funcionalidad existente
- Los registros de asistencia se cargan automáticamente al abrir el modal
