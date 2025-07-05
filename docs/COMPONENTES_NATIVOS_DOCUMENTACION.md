# Componentes Nativos para Super Admin Dashboard

Esta documentación describe los componentes nativos creados para reemplazar cualquier dependencia de Vuetify y proporcionar una interfaz completamente personalizada con Vue 3 + Tailwind CSS.

## 🎯 Objetivo

Eliminar dependencias de Vuetify y crear componentes nativos, modernos y totalmente personalizables que mantengan una excelente experiencia de usuario.

## 📦 Componentes Creados

### 1. `MetricCard.vue`

**Propósito**: Mostrar métricas con iconos, valores y tendencias.

**Props**:

- `icon`: Componente de icono
- `value`: Valor a mostrar (string | number)
- `label`: Etiqueta descriptiva
- `color`: Color del tema ('blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo')
- `trend`: Objeto con información de tendencia (opcional)

**Ejemplo**:

```vue
<MetricCard
  :icon="UsersIcon"
  :value="319"
  label="Estudiantes Activos"
  color="blue"
  :trend="{direction: 'up', percentage: 12, period: 'vs mes anterior'}"
/>
```

### 2. `ActionButton.vue`

**Propósito**: Botón de acción reutilizable con diferentes variantes y tamaños.

**Props**:

- `icon`: Icono del botón (opcional)
- `label`: Texto del botón (opcional)
- `variant`: Estilo ('primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost')
- `size`: Tamaño ('xs' | 'sm' | 'md' | 'lg')
- `disabled`: Estado deshabilitado

**Ejemplo**:

```vue
<ActionButton :icon="PlusIcon" label="Crear Nuevo" variant="success" size="md" @click="createNew" />
```

### 3. `StudentsList.vue`

**Propósito**: Lista estilizada de estudiantes con avatares, información y estados.

**Props**:

- `students`: Array de objetos estudiante
- `title`: Título de la sección
- `showClass`: Mostrar información de clase
- `showStatus`: Mostrar estado activo/inactivo

**Características**:

- Avatares automáticos generados si no existe imagen
- Indicadores visuales de estado
- Manejo de errores de imagen
- Responsive design

### 4. `QuickActionsCard.vue`

**Propósito**: Tarjeta con acciones rápidas agrupadas por categoría.

**Props**:

- `title`: Título de la tarjeta
- `actions`: Array de acciones con id, label, icon y color

**Ejemplo**:

```vue
<QuickActionsCard
  title="Importar/Exportar"
  :actions="[
    {id: 'import', label: 'Importar Estudiantes', icon: 'DocumentArrowUpIcon', color: 'green'},
    {id: 'export', label: 'Exportar Datos', icon: 'DocumentArrowDownIcon', color: 'blue'},
  ]"
  @action-click="handleAction"
/>
```

### 5. `ManagementSuperCard.vue` (Mejorado)

**Propósito**: Tarjeta de gestión con métricas, acciones y navegación.

**Mejoras Implementadas**:

- ✅ Clases estáticas en lugar de dinámicas para mejor rendimiento
- ✅ Mejor sistema de colores predefinidos
- ✅ Iconos y animaciones mejoradas
- ✅ TypeScript tipado estricto
- ✅ Accesibilidad mejorada

### 6. `ModernManagementCard.vue` (Nuevo)

**Propósito**: Versión moderna y completa de la tarjeta de gestión con características avanzadas.

**Características Únicas**:

- 🎨 Diseño moderno con gradientes y sombras
- 📊 Indicador de progreso circular (opcional)
- 📈 Indicadores de tendencia visual
- 🏷️ Estados de actividad
- 🎯 Sistema de acciones personalizable
- ✨ Efectos hover avanzados
- 🌙 Soporte completo para modo oscuro

**Ejemplo Completo**:

```vue
<ModernManagementCard
  title="Estudiantes"
  description="Gestión completa de estudiantes activos"
  icon="UsersIcon"
  :count="319"
  :recent="12"
  color="blue"
  route="/admin/students"
  status="active"
  :progress="85"
  trend="up"
  :actions="[
    {id: 'create', label: 'Nuevo', icon: 'PlusIcon', variant: 'success'},
    {id: 'import', label: 'Importar', icon: 'DocumentArrowUpIcon', variant: 'secondary'},
    {id: 'export', label: 'Exportar', icon: 'DocumentArrowDownIcon', variant: 'secondary'},
  ]"
  @action="handleAction"
>
  <template #extra-actions>
    <div class="flex justify-between text-xs">
      <span class="text-gray-500">Última actualización:</span>
      <span class="text-gray-700">Hace 5 min</span>
    </div>
  </template>
</ModernManagementCard>
```

## 🎨 Sistema de Colores

Todos los componentes usan un sistema de colores consistente:

```typescript
type ColorVariant = "blue" | "green" | "purple" | "yellow" | "red" | "indigo" | "pink" | "gray"
```

Cada color incluye:

- Fondos claros y oscuros
- Variantes para texto
- Bordes y anillos
- Gradientes
- Estados hover y activos

## 🌙 Soporte de Modo Oscuro

Todos los componentes tienen soporte completo para modo oscuro usando las clases `dark:` de Tailwind CSS.

## 📱 Responsive Design

Los componentes están diseñados mobile-first con breakpoints:

- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+
- `xl:` 1280px+

## 🔧 Configuración TypeScript

Todos los componentes usan TypeScript con:

- Interfaces tipadas para props
- Emisión de eventos tipada
- Computed properties tipadas
- Manejo de errores robusto

## 🚀 Ventajas de la Implementación Nativa

1. **Performance**: Sin dependencias externas pesadas
2. **Personalización**: Control total sobre estilos y comportamiento
3. **Consistencia**: Design system unificado
4. **Mantenibilidad**: Código limpio y documentado
5. **Flexibilidad**: Fácil extensión y modificación
6. **Bundle Size**: Menor tamaño final de la aplicación

## 📋 Migración

Para migrar de componentes existentes:

### Antes (con clases dinámicas problemáticas):

```vue
<div :class="`bg-${color}-100 text-${color}-600`"></div>
```

### Después (con sistema estático):

```vue
<div :class="colorClasses.background"></div>
```

```typescript
const colorClasses = computed(() => {
  const colorMap = {
    blue: {background: "bg-blue-100 text-blue-600"},
    green: {background: "bg-green-100 text-green-600"},
    // ...
  }
  return colorMap[props.color]
})
```

## 📈 Próximos Pasos

1. Implementar animaciones adicionales con CSS transitions
2. Agregar más variantes de componentes
3. Crear sistema de themes dinámicos
4. Añadir tests unitarios
5. Documentar patrones de accesibilidad

---

## 🤝 Contribución

Para añadir nuevos componentes:

1. Seguir el patrón TypeScript + Composition API
2. Usar sistema de colores consistente
3. Implementar soporte para modo oscuro
4. Añadir documentación y ejemplos
5. Asegurar responsive design

## Componentes de Clases Refactorizados

### ClassList.vue (Refactorizado)

**Ubicación:** `src/modulos/Classes/components/ClassList.vue`

Componente refactorizado que reemplaza la funcionalidad de Vuetify con una implementación nativa moderna:

**Características:**

- ✅ Búsqueda en tiempo real sin dependencias externas
- ✅ Vista de tabla responsive para desktop
- ✅ Vista de tarjetas para móvil
- ✅ Tooltips nativos con CSS puro
- ✅ Estados de carga y vacío
- ✅ Acciones contextuales (editar, ver horario, eliminar)
- ✅ Soporte completo para dark mode
- ✅ TypeScript completamente tipado

**Props:**

```typescript
interface Props {
  classes: ClassData[]
  loading?: boolean
}
```

**Eventos:**

```typescript
interface Emits {
  (e: "edit", classItem: ClassData): void
  (e: "delete", classItem: ClassData): void
  (e: "view-schedule", classItem: ClassData): void
}
```

**Uso:**

```vue
<ClassList
  :classes="classes"
  :loading="loading"
  @edit="handleEdit"
  @delete="handleDelete"
  @view-schedule="handleViewSchedule"
/>
```

**Funcionalidades:**

- Búsqueda por nombre, nivel, instrumento y profesor
- Visualización optimizada para diferentes tamaños de pantalla
- Gestión completa de estados (loading, empty, error)
- Integración con store de profesores para nombres

### ClassAssignmentManager.vue (Nuevo)

**Ubicación:** `src/modulos/Classes/components/ClassAssignmentManager.vue`

Componente completamente nuevo para gestionar asignaciones de clases:

**Características:**

- ✅ Dashboard de estadísticas de asignaciones
- ✅ Interfaz expandible por clase
- ✅ Asignación de profesores con dropdown
- ✅ Asignación múltiple de estudiantes con checkboxes
- ✅ Configuración completa de horarios
- ✅ Indicadores visuales de estado
- ✅ Acciones de guardado y reseteo
- ✅ Completamente responsive

**Props:**

```typescript
interface Props {
  classes: ClassData[]
}
```

**Eventos:**

```typescript
interface Emits {
  (e: "update-class", classId: string, updates: Partial<ClassData>): void
  (e: "save-assignments", classId: string): void
}
```

**Uso:**

```vue
<ClassAssignmentManager
  :classes="classes"
  @update-class="handleUpdateClass"
  @save-assignments="handleSaveAssignments"
/>
```

**Funcionalidades de Gestión:**

1. **Asignación de Profesores:**
   - Dropdown con profesores disponibles
   - Filtrado automático por especialidad
   - Estado visual de asignación

2. **Asignación de Estudiantes:**
   - Lista con checkboxes múltiples
   - Contador de estudiantes asignados
   - Scroll automático para listas largas

3. **Configuración de Horarios:**
   - Selección de día de la semana
   - Hora de inicio y fin
   - Validación automática de conflictos

4. **Dashboard de Estadísticas:**
   - Total de clases
   - Clases con profesor asignado
   - Clases con estudiantes
   - Clases con horario configurado

**Integración con Sesiones Personales:**
El componente está diseñado para que cuando se asigne un profesor (teacherId) a una clase, esta aparezca automáticamente en la sesión personal del profesor correspondiente.

**Estados Visuales:**

- 🟢 Verde: Asignación completada
- 🔴 Rojo: Falta asignación
- 🟡 Amarillo: Asignación parcial
