# 🚀 Guía de Migración: Sistema de Notificaciones WhatsApp Mejorado

## ⚡ Cambios Principales

### ✅ Lo que se Mantiene:
- **API del Modal**: Mismos props y eventos
- **Composables**: Misma estructura, solo cambio de nombre
- **Servicios Backend**: Sin cambios en `attendanceNotifications.ts`
- **Integración**: Funciona igual que el sistema anterior

### ⭐ Lo que Mejora:
- **Selección de Destinatarios**: Ahora puedes elegir madre/padre específicamente
- **Tipos de Notificación**: Ausencias + Tardanzas + Justificadas (antes solo ausencias)
- **Plantillas Específicas**: Mensajes adaptados al tipo de situación
- **Verificación de Teléfonos**: Validación completa antes del envío

## 🔄 Pasos de Migración

### 1. Actualizar Imports

#### En ReporteAsistenciaDiaria.vue:
```vue
<!-- ❌ Antes -->
<WhatsAppInasistenciasModal
  :is-visible="showModal"
  @close="closeModal"
  @messages-sent="handleMessagesSent"
/>

<!-- ✅ Después -->
<WhatsAppNotificacionesModal
  :is-visible="showModal"
  @close="closeModal" 
  @messages-sent="handleMessagesSent"
/>
```

```typescript
// ❌ Antes
import WhatsAppInasistenciasModal from '@/components/WhatsAppInasistenciasModal.vue'
import { useWhatsAppInasistenciasModal } from '@/composables/useWhatsAppInasistenciasModal'

// ✅ Después
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'
import { useWhatsAppNotificacionesModal } from '@/composables/useWhatsAppNotificacionesModal'
```

### 2. Actualizar en GlobalOverview.vue

```vue
<!-- Agregar el botón de notificaciones en la vista principal -->
<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
    <!-- Contenido existente -->
    
    <!-- ⭐ NUEVO: Botón de gestión de notificaciones -->
    <div class="mt-6 border-t pt-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Gestión de Notificaciones
      </h3>
      <button
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        @click="openNotificationsModal"
      >
        📱 Gestionar Notificaciones WhatsApp
      </button>
    </div>

    <!-- Modal -->
    <WhatsAppNotificacionesModal
      :is-visible="showNotificationsModal"
      @close="showNotificationsModal = false"
      @messages-sent="handleNotificationsSent"
    />
  </div>
</template>

<script setup lang="ts">
// Imports existentes...
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'

// Variables existentes...
const showNotificationsModal = ref(false)

// Métodos nuevos
const openNotificationsModal = () => {
  showNotificationsModal.value = true
}

const handleNotificationsSent = (result) => {
  console.log('📱 Notificaciones enviadas:', result)
  alert(`✅ Mensajes enviados!\n\nExitosos: ${result.success}\nFallidos: ${result.failed}`)
  showNotificationsModal.value = false
}
</script>
```

### 3. Actualizar en AdminMotherDashboard.vue

```vue
<template>
  <div class="min-h-screen bg-gradient-to-br mb-16 from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
    <!-- Contenido existente -->
    
    <!-- ⭐ NUEVO: Agregar en el menú de accesos directos -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <RouterLink
        to="/admin/notifications"
        class="block p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
      >
        <h2 class="font-semibold text-lg">Notificaciones</h2>
        <p class="text-sm text-gray-600">Revisa las notificaciones recientes.</p>
      </RouterLink>
      
      <!-- ⭐ NUEVO: Botón directo para gestión de WhatsApp -->
      <button
        class="block p-4 border border-green-200 rounded-lg shadow-sm hover:shadow-md transition bg-green-50 hover:bg-green-100"
        @click="openWhatsAppModal"
      >
        <h2 class="font-semibold text-lg text-green-800">📱 WhatsApp</h2>
        <p class="text-sm text-green-600">Gestionar mensajes automáticos.</p>
      </button>
    </div>

    <!-- Modal -->
    <WhatsAppNotificacionesModal
      :is-visible="showWhatsAppModal"
      @close="showWhatsAppModal = false"
      @messages-sent="handleWhatsAppMessages"
    />
  </div>
</template>

<script setup lang="ts">
// Imports existentes...
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'

const showWhatsAppModal = ref(false)

const openWhatsAppModal = () => {
  showWhatsAppModal.value = true
}

const handleWhatsAppMessages = (result) => {
  console.log('Dashboard: Mensajes enviados:', result)
  // Mostrar notificación toast o alert
  showWhatsAppModal.value = false
}
</script>
```

## 📋 Checklist de Migración

### ✅ Archivos Actualizados:
- [ ] `src/views/ReporteAsistenciaDiaria.vue` - ✅ Completado
- [ ] `src/components/Admin/Dashboard/GlobalOverview.vue` - Pendiente
- [ ] `src/views/AdminMotherDashboard.vue` - Pendiente 
- [ ] `src/views/WhatsAppPanel.vue` - Opcional (agregar enlace)

### ✅ Componentes Nuevos Creados:
- [ ] `src/components/WhatsAppNotificacionesModal.vue` - ✅ Completado
- [ ] `src/composables/useWhatsAppNotificacionesModal.ts` - ✅ Completado
- [ ] `src/components/demo/WhatsAppNotificacionesDemo.vue` - ✅ Completado

### ✅ Documentación:
- [ ] `docs/WHATSAPP_NOTIFICACIONES_MODAL.md` - ✅ Completado
- [ ] `docs/MIGRACION_WHATSAPP.md` - ✅ Este archivo

## 🎯 Características Nuevas Disponibles

### 1. **Tabs por Tipo de Situación**
```typescript
// El modal ahora organiza estudiantes en tabs:
const notificationTabs = [
  { id: "ausentes", name: "Ausentes", icon: "❌" },      // Sin justificar
  { id: "tarde", name: "Tardanzas", icon: "⏰" },        // Llegadas tardías  
  { id: "justificado", name: "Justificadas", icon: "📝" } // Con justificación
]
```

### 2. **Selección de Destinatarios**
```typescript
// Para cada estudiante, ahora puedes elegir:
interface MessageDestination {
  studentId: string
  recipientType: 'madre' | 'padre'  // ⭐ NUEVO
  phoneNumber: string
  studentData: StudentData
}

// Ejemplo de uso:
const sendToMother = (studentId, motherPhone) => {
  // Envía específicamente a la madre
}

const sendToFather = (studentId, fatherPhone) => {
  // Envía específicamente al padre  
}

const sendToBoth = (studentId, motherPhone, fatherPhone) => {
  // Envía a ambos padres
}
```

### 3. **Plantillas Específicas**
```typescript
// Plantillas adaptadas al tipo de situación:
const messageTemplates = {
  ausentes: [
    // Plantillas para ausencias (con escalación)
    { id: "ausente_amable", tone: "Amigable" },
    { id: "ausente_disciplinario", tone: "Formal" },
    { id: "ausente_explicacion", tone: "Requerimiento" }
  ],
  tarde: [
    // Plantillas para tardanzas
    { id: "tarde_recordatorio", tone: "Amigable" },
    { id: "tarde_disciplinario", tone: "Formal" }
  ],
  justificado: [
    // Plantillas para justificadas
    { id: "justificado_informativo", tone: "Informativo" },
    { id: "justificado_seguimiento", tone: "Personalizado" }
  ]
}
```

### 4. **Variables Dinámicas Mejoradas**
```typescript
// Variables disponibles en todas las plantillas:
const availableVariables = {
  '{studentName}': 'Nombre completo del estudiante',
  '{parentType}': 'Madre/Padre según destinatario',  // ⭐ NUEVO
  '{date}': 'Fecha actual',
  '{academyName}': 'Nombre de la academia'
}
```

## 🔧 Configuración Adicional

### Variables de Entorno (si es necesario)
```env
# Nuevas configuraciones opcionales
VITE_WHATSAPP_MULTIPLE_RECIPIENTS=true
VITE_WHATSAPP_PARENT_SELECTION=true
VITE_WHATSAPP_TEMPLATE_TYPES=ausentes,tarde,justificado
```

### Configuración de Plantillas
```typescript
// En src/services/attendanceNotifications.ts
// Las plantillas existentes siguen funcionando
// Se pueden agregar nuevas plantillas específicas:

export const TEMPLATE_TYPES = {
  AUSENTE: 'ausente',
  TARDE: 'tarde', 
  JUSTIFICADO: 'justificado'
}

export const getTemplatesByType = (type: string) => {
  return MESSAGE_TEMPLATES.filter(template => 
    template.type === type || template.categories?.includes(type)
  )
}
```

## 🐛 Troubleshooting de Migración

### Error: "Component not found"
**Solución**: Verificar que los imports estén correctos
```typescript
// Asegurar que el path sea correcto
import WhatsAppNotificacionesModal from '@/components/WhatsAppNotificacionesModal.vue'
```

### Error: "Composable function not found"  
**Solución**: Verificar el import del composable
```typescript
// Verificar que el nombre sea correcto
import { useWhatsAppNotificacionesModal } from '@/composables/useWhatsAppNotificacionesModal'
```

### Error: "No phone numbers shown"
**Solución**: Verificar campos en la base de datos
```typescript
// Asegurar que los estudiantes tengan estos campos:
interface Student {
  numero_telefono_madre?: string
  numero_telefono_padre?: string
  // ...otros campos
}
```

## 📈 Próximos Pasos

1. **Testing**: Probar el modal en diferentes vistas
2. **Feedback**: Recopilar comentarios de usuarios
3. **Optimización**: Mejorar rendimiento si es necesario
4. **Extensión**: Agregar más tipos de notificación si se requiere

## 🎉 ¡Migración Completada!

Una vez completados estos pasos, tendrás:

- ✅ Sistema de notificaciones más flexible
- ✅ Control granular de destinatarios  
- ✅ Plantillas específicas por situación
- ✅ Mejor experiencia de usuario
- ✅ Compatibilidad con el sistema existente

¿Necesitas ayuda con algún paso específico? ¡El nuevo sistema está listo para mejorar la comunicación con los padres de familia! 🚀
