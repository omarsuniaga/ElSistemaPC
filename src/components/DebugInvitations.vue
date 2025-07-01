<template>
  <div v-if="showDebug" class="debug-panel">
    <div class="debug-header">
      <h3>🔧 Debug: Invitaciones</h3>
      <button class="close-btn" @click="showDebug = false">&times;</button>
    </div>
    <div class="debug-content">
      <div class="debug-section">
        <h4>Usuario Autenticado:</h4>
        <p>{{ authStore.user?.uid || "No autenticado" }}</p>
        <p>Rol: {{ authStore.user?.role || "Sin rol" }}</p>
      </div>

      <div class="debug-section">
        <h4>Notificaciones ({{ notifications.length }}):</h4>
        <div v-if="notifications.length === 0" class="empty">No hay notificaciones</div>
        <div v-for="notification in notifications" :key="notification.id" class="notification-item">
          <strong>{{ notification.title }}</strong> - {{ notification.status }}
          <br />
          <small>{{ notification.createdAt?.toLocaleString() }}</small>
        </div>
      </div>

      <div class="debug-section">
        <h4>Invitaciones Pendientes ({{ pendingInvitations.length }}):</h4>
        <div v-if="pendingInvitations.length === 0" class="empty">
          No hay invitaciones pendientes
        </div>
        <div v-for="invitation in pendingInvitations" :key="invitation.id" class="invitation-item">
          <strong>{{ invitation.className }}</strong>
          <br />
          De: {{ invitation.fromUserName }}
          <br />
          <small>{{ invitation.createdAt?.toLocaleString() }}</small>
        </div>
      </div>

      <div class="debug-section">
        <h4>Acciones:</h4>
        <button class="debug-btn" @click="loadNotifications">Recargar</button>
        <button class="debug-btn" @click="createTestInvitation">Crear Prueba</button>
      </div>

      <div class="debug-section">
        <h4>Estados:</h4>
        <p>Cargando: {{ isLoading ? "Sí" : "No" }}</p>
        <p>Error: {{ error || "Ninguno" }}</p>
        <p>Debe mostrar manager: {{ shouldShowInvitationManager ? "Sí" : "No" }}</p>
      </div>
    </div>
  </div>

  <!-- Botón flotante para mostrar debug -->
  <button
    v-if="!showDebug && isDev"
    class="debug-toggle"
    title="Mostrar panel de depuración"
    @click="showDebug = true"
  >
    🔧
  </button>
</template>

<script setup lang="ts">
import {ref, computed} from "vue"
import {useAuthStore} from "../stores/auth"
import {useTeacherNotifications} from "../modulos/Teachers/composables/useTeacherNotifications"
import {createClassInvitationNotification} from "../modulos/Teachers/services/teacherNotifications"

const showDebug = ref(false)
const isDev = ref(import.meta.env.DEV)

const authStore = useAuthStore()
const {notifications, pendingInvitations, isLoading, error, loadNotifications} =
  useTeacherNotifications()

const shouldShowInvitationManager = computed(() => {
  return (
    authStore.isLoggedIn &&
    authStore.user &&
    (authStore.user.role?.toLowerCase() === "maestro" ||
      authStore.user.role?.toLowerCase() === "profesor")
  )
})

const createTestInvitation = async () => {
  if (!authStore.user?.uid) {
    alert("No hay usuario autenticado")
    return
  }

  try {
    await createClassInvitationNotification({
      teacherId: authStore.user.uid,
      teacherName: authStore.user.displayName || "Usuario de Prueba",
      classId: "test-class-" + Date.now(),
      className: "Clase de Prueba",
      fromUserId: "system",
      fromUserName: "Sistema de Prueba",
      permissions: {
        canTakeAttendance: true,
        canAddObservations: true,
        canViewAttendanceHistory: true,
      },
    })

    alert("Invitación de prueba creada")
  } catch (err: any) {
    alert("Error creando invitación: " + err.message)
  }
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 350px;
  max-height: 80vh;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}

.debug-header {
  background: #007bff;
  color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.debug-content {
  padding: 10px;
  max-height: calc(80vh - 50px);
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.debug-section:last-child {
  border-bottom: none;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.debug-section p {
  margin: 4px 0;
  font-size: 11px;
}

.notification-item,
.invitation-item {
  background: #f8f9fa;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 11px;
}

.invitation-item {
  background: #e7f3ff;
  border-left: 3px solid #007bff;
}

.empty {
  color: #999;
  font-style: italic;
  font-size: 11px;
}

.debug-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-right: 5px;
}

.debug-btn:hover {
  background: #218838;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9998;
}

.debug-toggle:hover {
  background: #0056b3;
  transform: scale(1.1);
}
</style>
