# 📱 Modal de Notificaciones WhatsApp - Sistema Completo

## Descripción

El `WhatsAppNotificacionesModal` es un componente avanzado que permite gestionar el envío de mensajes de WhatsApp según el tipo de situación: **ausencias sin justificar**, **tardanzas** y **ausencias justificadas**. El sistema implementa selección inteligente de destinatarios (padre/madre) y plantillas específicas para cada tipo de notificación.

## Nuevas Características

### ✨ Funcionalidades Principales

- **📋 Gestión por Tabs**: Organización por tipo de situación (Ausentes, Tardanzas, Justificadas)
- **👨‍👩‍👦 Selección de Destinatarios**: Permite elegir entre enviar a madre, padre o ambos
- **📞 Verificación de Teléfonos**: Valida la disponibilidad de números antes del envío
- **📝 Plantillas Específicas**: Mensajes personalizados según el tipo de situación
- **🎯 Variables Dinámicas**: Personalización automática con datos del estudiante
- **📊 Vista Previa**: Previsualización de mensajes antes del envío

### 🎚️ Tipos de Notificación

#### 1. **❌ Ausencias Sin Justificar**
- **Escalación Automática**: Sistema de 4 niveles según historial
- **Plantillas**: Amable → Disciplinario → Explicación → Citación
- **Variables**: `{studentName}`, `{parentType}`, `{date}`, `{academyName}`

#### 2. **⏰ Tardanzas**
- **Recordatorio de Puntualidad**: Mensajes amigables
- **Llamados de Atención**: Para tardanzas repetidas
- **Enfoque**: Importancia de la puntualidad en el aprendizaje

#### 3. **📝 Ausencias Justificadas**
- **Información de Recuperación**: Próximas actividades
- **Seguimiento Personalizado**: Apoyo para mantenerse al día
- **Materiales**: Contenido de estudio y actividades de refuerzo

## Instalación y Uso

### 1. Importar el Nuevo Componente

```vue
<template>
  <div>
    <!-- Tu contenido -->
    <button @click="openModal">📱 Gestionar Notificaciones</button>
    
    <!-- Nuevo Modal -->
    <WhatsAppNotificacionesModal
      :is-visible="isModalVisible"
      @close="closeModal"
      @messages-sent="handleMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'
import { useWhatsAppNotificacionesModal } from '@/composables/useWhatsAppNotificacionesModal'

const { isModalVisible, openModal, closeModal, handleMessagesSent } = useWhatsAppNotificacionesModal()
</script>
```

### 2. Usar el Nuevo Composable

```typescript
import { useWhatsAppNotificacionesModal } from '@/composables/useWhatsAppNotificacionesModal'

const { 
  isModalVisible,    // Estado de visibilidad del modal
  openModal,         // Función para abrir el modal
  closeModal,        // Función para cerrar el modal
  handleMessagesSent // Handler para mensajes enviados
} = useWhatsAppNotificacionesModal()
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

### 🎯 Selección Inteligente de Destinatarios

```typescript
// Para cada estudiante se puede seleccionar:
interface MessageDestination {
  studentId: string
  recipientType: 'madre' | 'padre'  // ⭐ NUEVA FUNCIONALIDAD
  phoneNumber: string
  studentData: StudentData
}
```

**Características:**
- **Verificación Automática**: Valida si hay números de madre/padre disponibles
- **Selección Multiple**: Permite enviar a madre, padre o ambos
- **Advertencias Visuales**: Indica estudiantes sin números registrados

### 📝 Sistema de Plantillas por Tipo

#### Ausencias Sin Justificar
```typescript
const templateAusencias = [
  {
    id: "ausente_amable",
    name: "Recordatorio Amable",
    tone: "Amigable",
    content: `Hola {parentType}, notamos que {studentName} no asistió hoy...`
  },
  {
    id: "ausente_disciplinario", 
    name: "Tono Disciplinario",
    tone: "Formal",
    content: `Estimado/a {parentType}, la constancia es fundamental...`
  },
  // ... más plantillas
]
```

#### Tardanzas
```typescript
const templateTardanzas = [
  {
    id: "tarde_recordatorio",
    name: "Recordatorio de Puntualidad", 
    tone: "Amigable",
    content: `Hola {parentType}, {studentName} llegó tarde...`
  },
  // ... más plantillas
]
```

#### Ausencias Justificadas
```typescript
const templateJustificadas = [
  {
    id: "justificado_informativo",
    name: "Información de Recuperación",
    tone: "Informativo", 
    content: `Hola {parentType}, para mantener el progreso de {studentName}...`
  },
  // ... más plantillas
]
```

### 🔍 Variables Dinámicas Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{studentName}` | Nombre completo del estudiante | "Juan Pérez" |
| `{parentType}` | Tipo de destinatario | "Madre" / "Padre" |
| `{date}` | Fecha actual | "05/07/2025" |
| `{academyName}` | Nombre de la academia | "Music Academy" |

## Integración con el Sistema Existente

### Servicios Utilizados

```typescript
// Servicios principales (sin cambios)
import { 
  notifyUnexcusedAbsences,     // Para ausencias
  notifyLateStudents,          // Para tardanzas
  notifyJustifiedAbsences,     // Para justificadas ⭐ NUEVO
} from '@/services/attendanceNotifications'
```

### Flujo de Datos Actualizado

1. **Carga por Tabs**: Se cargan estudiantes según el tab activo
2. **Verificación de Teléfonos**: Se validan números disponibles
3. **Selección de Destinatarios**: Usuario elige madre/padre para cada estudiante
4. **Plantillas Específicas**: Se muestran plantillas según el tipo de situación
5. **Personalización**: Usuario modifica mensajes con variables
6. **Envío Dirigido**: Se procesan mensajes por destinatario específico
7. **Historial Detallado**: Se registran resultados con destinatario

## Ejemplos de Uso

### Ejemplo Básico en Vista de Reporte

```vue
<template>
  <div class="dashboard">
    <!-- Botón integrado en header -->
    <div class="flex items-center space-x-4">
      <input v-model="selectedDate" type="date" />
      <button 
        class="px-4 py-2 bg-green-600 text-white rounded-md"
        @click="openWhatsAppModal"
      >
        📱 Gestionar Notificaciones
      </button>
    </div>
    
    <!-- Modal integrado -->
    <WhatsAppNotificacionesModal
      :is-visible="showWhatsAppModal"
      @close="showWhatsAppModal = false"
      @messages-sent="handleWhatsAppMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'

const showWhatsAppModal = ref(false)

const openWhatsAppModal = () => {
  showWhatsAppModal.value = true
}

const handleWhatsAppMessagesSent = (result) => {
  console.log(`📱 Enviados: ${result.success}, Fallidos: ${result.failed}`)
  alert(`✅ Mensajes enviados!\n\nExitosos: ${result.success}\nFallidos: ${result.failed}`)
  showWhatsAppModal.value = false
}
</script>
```

### Ejemplo con Dashboard Completo

Consulta el archivo `src/components/demo/WhatsAppNotificacionesDemo.vue` para ver un ejemplo completo con:
- Estadísticas por tipo de situación
- Historial de mensajes recientes
- Integración completa con el nuevo sistema

## Comparación con el Sistema Anterior

### ⭐ Nuevas Funcionalidades

| Característica | Sistema Anterior | Sistema Nuevo |
|----------------|------------------|---------------|
| **Tipos de Mensaje** | Solo ausencias | Ausencias + Tardanzas + Justificadas |
| **Selección de Destinatario** | Automático | Manual (madre/padre) |
| **Plantillas** | Por nivel de escalación | Por tipo de situación |
| **Verificación de Teléfonos** | Básica | Validación completa |
| **Organización** | Lista única | Tabs por tipo |

### 🔄 Migración desde el Sistema Anterior

El nuevo sistema es **compatible** con el anterior. Para migrar:

1. **Cambiar Import**:
```typescript
// Antes
import WhatsAppInasistenciasModal from '@/components/WhatsAppInasistenciasModal.vue'

// Después  
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'
```

2. **Actualizar Composable**:
```typescript
// Antes
import { useWhatsAppInasistenciasModal } from '@/composables/useWhatsAppInasistenciasModal'

// Después
import { useWhatsAppNotificacionesModal } from '@/composables/useWhatsAppNotificacionesModal'
```

3. **Misma API**: Los eventos y props siguen siendo los mismos

## Casos de Uso Específicos

### 1. **Gestión de Ausencias con Escalación**
```typescript
// Tab "Ausentes" → Selección automática de plantilla según nivel
// Usuario puede modificar mensaje y elegir destinatarios
const sendEscalatedMessages = () => {
  // El sistema aplica la plantilla correcta según el historial
  // Usuario tiene control final sobre destinatarios
}
```

### 2. **Notificaciones de Tardanzas**
```typescript
// Tab "Tardanzas" → Mensajes de puntualidad
// Plantillas específicas para recordatorios amigables
const sendLateNotifications = () => {
  // Mensajes enfocados en la importancia de la puntualidad
  // Sin escalación, solo recordatorios
}
```

### 3. **Seguimiento de Ausencias Justificadas**
```typescript
// Tab "Justificadas" → Información de recuperación
// Plantillas con contenido académico y apoyo
const sendRecoveryInfo = () => {
  // Mensajes informativos sobre próximas actividades
  // Opciones de recuperación y materiales
}
```

## Próximas Mejoras

- [ ] **Plantillas Personalizadas**: Guardar plantillas custom por usuario
- [ ] **Programación**: Envío diferido de mensajes  
- [ ] **Analytics**: Métricas de efectividad por tipo de mensaje
- [ ] **Múltiples Idiomas**: Soporte para mensajes en varios idiomas
- [ ] **Integración SMS**: Respaldo por SMS si WhatsApp falla
- [ ] **Respuestas Automáticas**: Manejo de respuestas de padres

## Troubleshooting

### Problemas Específicos del Nuevo Sistema

1. **No aparecen números de teléfono**
   - Verificar que `numero_telefono_madre` y `numero_telefono_padre` estén en la DB
   - Comprobar que no sean `null` o strings vacíos

2. **Plantillas no cargan por tab**
   - Verificar que el `activeTab` esté correctamente configurado
   - Comprobar que las plantillas estén definidas para el tipo correcto

3. **Error al enviar a destinatario específico**
   - Verificar que la función de notificación soporte el nuevo formato
   - Comprobar que se esté pasando correctamente el `recipientType`

---

**¡El nuevo sistema está listo para producción!** 🚀

Con estas mejoras, tienes un control granular completo sobre las notificaciones WhatsApp, con verificación de destinatarios y plantillas específicas para cada situación.
