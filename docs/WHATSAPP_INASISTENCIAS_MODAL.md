# 📱 Modal de Gestión de Mensajes WhatsApp para Inasistencias

## Descripción

El `WhatsAppInasistenciasModal` es un componente avanzado que permite a los administradores y maestros gestionar el envío de mensajes de WhatsApp a estudiantes con inasistencias recurrentes. El sistema implementa un mecanismo de escalación automática basado en el número de ausencias.

## Características

### ✨ Funcionalidades Principales

- **📋 Lista Inteligente**: Muestra estudiantes con inasistencias ordenados por nivel de escalación
- **🎯 Selección Flexible**: Permite seleccionar estudiantes individuales o por grupos
- **📝 Mensajes Personalizables**: Editor de mensajes con plantillas por nivel de escalación
- **📊 Vista Previa**: Previsualización de mensajes antes del envío
- **💾 Plantillas Guardadas**: Opción de guardar y reutilizar plantillas personalizadas
- **📈 Escalación Automática**: Sistema de 4 niveles de escalación automática

### 🎚️ Niveles de Escalación

1. **🟢 Nivel 1 (1 ausencia)**: Recordatorio amable
2. **🟡 Nivel 2 (2 ausencias)**: Tono disciplinario sobre responsabilidad
3. **🟠 Nivel 3 (3 ausencias)**: Solicitud formal de explicación
4. **🔴 Nivel 4 (4+ ausencias)**: Citación obligatoria y evaluación de continuidad

## Instalación y Uso

### 1. Importar el Componente

```vue
<template>
  <div>
    <!-- Tu contenido -->
    <button @click="openModal">Gestionar Mensajes WhatsApp</button>
    
    <!-- Modal -->
    <WhatsAppInasistenciasModal
      :is-visible="isModalVisible"
      @close="closeModal"
      @messages-sent="handleMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import WhatsAppInasistenciasModal from '@/components/WhatsAppInasistenciasModal.vue'
import { useWhatsAppInasistenciasModal } from '@/composables/useWhatsAppInasistenciasModal'

const { isModalVisible, openModal, closeModal, handleMessagesSent } = useWhatsAppInasistenciasModal()
</script>
```

### 2. Usar el Composable

```typescript
import { useWhatsAppInasistenciasModal } from '@/composables/useWhatsAppInasistenciasModal'

const { 
  isModalVisible,    // Estado de visibilidad del modal
  openModal,         // Función para abrir el modal
  closeModal,        // Función para cerrar el modal
  handleMessagesSent // Handler para mensajes enviados
} = useWhatsAppInasistenciasModal()
```

## API del Componente

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `isVisible` | `boolean` | ✅ | Controla la visibilidad del modal |

### Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `close` | - | Se emite cuando se cierra el modal |
| `messages-sent` | `{ success: number, failed: number, messages: any[] }` | Se emite después de enviar mensajes |

## Funcionalidades Avanzadas

### 🔍 Filtrado y Búsqueda

- **Filtro por período**: Semana actual, mes actual o período personalizado
- **Búsqueda en tiempo real**: Por nombre del estudiante o instrumento
- **Selección masiva**: Seleccionar todos o limpiar selección

### 📝 Editor de Mensajes

- **Variables dinámicas**: `{studentName}`, `{date}`, `{absenceCount}`, `{academyName}`
- **Plantillas por nivel**: Mensajes específicos para cada nivel de escalación
- **Vista previa en tiempo real**: Ver cómo se verá el mensaje final
- **Guardar plantillas**: Persistir mensajes personalizados

### 📊 Información Detallada

Para cada estudiante se muestra:
- Nombre completo e instrumento
- Número total de inasistencias
- Nivel de escalación actual
- Números de teléfono disponibles (madre/padre)
- Fecha de última ausencia

## Integración con el Sistema Existente

### Servicios Utilizados

```typescript
// Servicios principales
import { 
  notifyUnexcusedAbsences,     // Envío de mensajes
  getStudentMessageHistory,    // Historial de mensajes
  MESSAGE_TEMPLATES           // Plantillas predefinidas
} from '@/services/attendanceNotifications'

// Stores utilizados
import { useStudentsStore } from '@/modulos/Students/store/students'
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance'

// Firebase Functions
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
```

### Flujo de Datos

1. **Carga inicial**: Se obtienen estudiantes con inasistencias del `AttendanceStore`
2. **Enriquecimiento**: Se agregan datos del `StudentsStore` y se calcula escalación
3. **Selección**: Usuario selecciona estudiantes objetivo
4. **Personalización**: Usuario modifica mensajes por nivel
5. **Envío**: Se procesan mensajes y se envían via WhatsApp API
6. **Historial**: Se registran resultados en Firebase

## Personalización

### Modificar Plantillas por Defecto

```typescript
// En src/services/attendanceNotifications.ts
const MESSAGE_TEMPLATES = [
  {
    id: "inasistencia_nivel_1",
    type: "inasistencia_nivel_1",
    level: 1,
    content: `Tu mensaje personalizado para nivel 1...`
  },
  // ... más plantillas
]
```

### Agregar Variables Personalizadas

```typescript
const personalizeMessage = (template: string, student: Student, additionalData: any = {}) => {
  return template
    .replace(/{studentName}/g, `${student.nombre} ${student.apellido}`)
    .replace(/{customVariable}/g, additionalData.customValue)
    // ... más variables
}
```

## Ejemplos de Uso

### Ejemplo Básico

```vue
<template>
  <div class="dashboard">
    <button 
      class="btn-primary" 
      @click="openWhatsAppModal"
    >
      📱 Gestionar Mensajes WhatsApp
    </button>
    
    <WhatsAppInasistenciasModal
      :is-visible="showModal"
      @close="showModal = false"
      @messages-sent="onMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WhatsAppInasistenciasModal from '@/components/WhatsAppInasistenciasModal.vue'

const showModal = ref(false)

const openWhatsAppModal = () => {
  showModal.value = true
}

const onMessagesSent = (result) => {
  console.log(`Enviados: ${result.success}, Fallidos: ${result.failed}`)
  // Mostrar notificación de éxito
  showModal.value = false
}
</script>
```

### Ejemplo con Dashboard Completo

Consulta el archivo `src/components/demo/WhatsAppInasistenciasDemo.vue` para ver un ejemplo completo con:
- Estadísticas por nivel de escalación
- Historial de mensajes recientes
- Integración con el sistema de notificaciones existente

## Requisitos del Sistema

### Dependencias

- Vue 3 con Composition API
- TypeScript
- Firebase (Firestore, Functions)
- Stores de Pinia para Students y Attendance
- Sistema de notificaciones WhatsApp configurado

### Permisos Necesarios

- Acceso a Firebase Functions
- Lectura de colección `ALUMNOS`
- Lectura de colección `ASISTENCIAS`
- Escritura en colección `historial_mensajes_whatsapp`

## Troubleshooting

### Problemas Comunes

1. **No se cargan estudiantes**
   - Verificar que el `AttendanceStore` esté funcionando
   - Comprobar permisos de Firebase
   
2. **Error al enviar mensajes**
   - Verificar configuración de WhatsApp API
   - Comprobar que Firebase Functions estén desplegadas
   
3. **Plantillas no se guardan**
   - Verificar localStorage del navegador
   - Implementar persistencia en backend si es necesario

### Logs y Debugging

```typescript
// Habilitar logs detallados
console.log('Estudiantes cargados:', studentsWithAbsences.value)
console.log('Mensajes personalizados:', customMessages.value)
console.log('Resultado de envío:', result)
```

## Próximas Mejoras

- [ ] Programación de mensajes para envío futuro
- [ ] Integración con otros canales (SMS, Email)
- [ ] Analytics detallados de efectividad de mensajes
- [ ] Plantillas con condicionales avanzadas
- [ ] Múltiples idiomas para mensajes

## Contribución

Para contribuir al desarrollo:
1. Revisar el código existente en `src/services/attendanceNotifications.ts`
2. Seguir las convenciones de naming del proyecto
3. Agregar tests para nuevas funcionalidades
4. Documentar cambios en este archivo
