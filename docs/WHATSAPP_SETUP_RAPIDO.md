# 🚀 Guía de Integración Rápida - Modal WhatsApp Inasistencias

## ⚡ Setup en 5 Minutos

### 1. Copiar Archivos Creados ✅

Los siguientes archivos ya están creados y listos:
- `src/components/WhatsAppInasistenciasModal.vue`
- `src/composables/useWhatsAppInasistenciasModal.ts`  
- `src/components/demo/WhatsAppInasistenciasDemo.vue`

### 2. Integración Básica

#### En tu componente principal (ej: DashboardAdmin.vue):

```vue
<template>
  <div>
    <!-- Botón para abrir modal -->
    <v-btn 
      color="green" 
      @click="openModal"
      prepend-icon="mdi-whatsapp"
    >
      Gestionar WhatsApp
    </v-btn>

    <!-- Modal -->
    <WhatsAppInasistenciasModal
      :is-visible="isModalVisible"
      @close="closeModal"
      @messages-sent="handleMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
// Importaciones necesarias
import WhatsAppInasistenciasModal from '@/components/WhatsAppInasistenciasModal.vue'
import { useWhatsAppInasistenciasModal } from '@/composables/useWhatsAppInasistenciasModal'

// Usar el composable
const { isModalVisible, openModal, closeModal, handleMessagesSent } = useWhatsAppInasistenciasModal()
</script>
```

### 3. Verificar Dependencias

#### Stores necesarios:
```typescript
// Asegúrate de que estos stores estén funcionando:
import { useStudentsStore } from '@/modulos/Students/store/students'
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance'
```

#### Servicios necesarios:
```typescript
// Verificar que este servicio exista y funcione:
import { notifyUnexcusedAbsences } from '@/services/attendanceNotifications'
```

### 4. Testing Rápido

#### Opción A: Usar el Demo
```vue
<!-- En cualquier vista de admin -->
<WhatsAppInasistenciasDemo />
```

#### Opción B: Test Manual
1. Abrir el modal
2. Verificar que se cargan estudiantes con inasistencias
3. Seleccionar algunos estudiantes
4. Modificar mensaje si es necesario
5. Enviar mensajes de prueba

## 🔧 Configuración Avanzada

### Variables de Entorno (si es necesario)

```env
# Firebase Functions
VITE_FIREBASE_FUNCTIONS_URL=your-functions-url

# WhatsApp API
VITE_WHATSAPP_API_ENABLED=true
```

### Personalizar Mensajes por Defecto

En `src/services/attendanceNotifications.ts`:
```typescript
const MESSAGE_TEMPLATES = [
  {
    id: "inasistencia_nivel_1",
    level: 1,
    content: "Tu mensaje personalizado aquí..."
  }
  // Modificar según necesidades
]
```

## 🐛 Troubleshooting Rápido

### Error: "No se cargan estudiantes"
**Solución**: Verificar que `AttendanceStore` tenga datos:
```typescript
const attendanceStore = useAttendanceStore()
console.log('Asistencias cargadas:', attendanceStore.asistencias)
```

### Error: "WhatsApp no funciona"
**Solución**: Verificar Firebase Functions:
```bash
# En terminal
firebase functions:log --only notifyUnexcusedAbsences
```

### Error: "Modal no se abre"
**Solución**: Verificar estado del composable:
```typescript
const { isModalVisible } = useWhatsAppInasistenciasModal()
console.log('Modal visible:', isModalVisible.value)
```

## 📍 Ubicaciones Recomendadas

### Para Administradores:
- Dashboard principal de admin
- Vista de reportes de asistencia
- Panel de gestión de estudiantes

### Para Maestros:
- Dashboard del maestro
- Vista de clases del día
- Panel de asistencia por clase

## 🎯 Casos de Uso Principales

### 1. Envío Masivo Semanal
```typescript
// Configurar para enviar todos los lunes
const enviarMensajesSemanal = () => {
  // Filtrar por semana actual
  // Seleccionar todos los estudiantes con 2+ ausencias
  // Enviar mensajes automáticamente
}
```

### 2. Seguimiento Personalizado
```typescript
// Para casos especiales que requieren atención específica
const seguimientoPersonalizado = (studentIds: string[]) => {
  // Abrir modal con estudiantes preseleccionados
  // Permitir personalización completa del mensaje
  // Guardar como plantilla para casos similares
}
```

### 3. Escalación Manual
```typescript
// Cuando se necesita intervenir en el proceso automático
const escalarManualmente = (studentId: string, newLevel: number) => {
  // Cambiar nivel de escalación
  // Enviar mensaje correspondiente al nuevo nivel
  // Registrar la intervención manual
}
```

## ✅ Checklist Final

- [ ] Modal se abre correctamente
- [ ] Se cargan estudiantes con inasistencias
- [ ] Funciona la selección por checkbox
- [ ] Se muestran niveles de escalación correctos
- [ ] Editor de mensajes permite personalización
- [ ] Variables se reemplazan correctamente en vista previa
- [ ] Envío de mensajes funciona (probar con números de prueba)
- [ ] Se muestra resultado del envío
- [ ] Modal se cierra después del envío
- [ ] Se puede guardar y cargar plantillas

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del navegador (F12 → Console)
2. Verificar logs de Firebase Functions
3. Comprobar que todas las dependencias estén instaladas
4. Consultar documentación completa en `docs/WHATSAPP_INASISTENCIAS_MODAL.md`

---

**¡Listo para usar!** 🎉

Una vez completado este setup, tendrás un sistema completo para gestionar mensajes de WhatsApp a estudiantes con inasistencias, con control granular sobre quién recibe qué mensaje y cuándo.
