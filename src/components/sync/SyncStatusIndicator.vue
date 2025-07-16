<!--
🔄 COMPONENTE DE ESTADO DE SINCRONIZACIÓN
Muestra el estado de conectividad y operaciones pendientes
Fase 1 - Iniciativa 2: UI de Sincronización Offline
-->

<template>
  <div
    v-if="shouldShow"
    :class="[
      'sync-status-card',
      `sync-status-card--${statusColor}`,
      {'sync-status-card--offline': isOffline},
    ]"
  >
    <div class="sync-status-card__content">
      <div class="sync-status-card__header">
        <!-- Icono de estado -->
        <div class="status-icon">
          <i
            :class="[
              'status-icon__symbol',
              statusIcon,
              {rotating: isSyncing},
              `status-icon--${iconColor}`,
            ]"
          />
        </div>

        <!-- Información de estado -->
        <div class="status-info">
          <div class="status-info__title">
            {{ statusTitle }}
          </div>
          <div class="status-info__description">
            {{ statusDescription }}
          </div>
        </div>

        <!-- Botón de sincronización manual -->
        <button
          v-if="canShowSyncButton"
          :disabled="!canSync || isSyncing"
          class="sync-btn sync-btn--primary"
          @click="handleManualSync"
        >
          <i :class="['mdi', 'mdi-sync', {rotating: isSyncing}]" />
          <span v-if="!isSyncing">Sincronizar</span>
          <span v-else>Sincronizando...</span>
        </button>

        <!-- Botón de actualización PWA -->
        <button v-if="needRefresh" class="sync-btn sync-btn--success" @click="handleUpdatePWA">
          <i class="mdi mdi-update" />
          Actualizar
        </button>
      </div>

      <!-- Barra de progreso -->
      <div v-if="isSyncing" class="progress-bar">
        <div class="progress-bar__fill" />
      </div>

      <!-- Detalles de operaciones pendientes -->
      <div v-if="showDetails && hasPendingOperations" class="details-section">
        <div class="details-divider" />
        <div class="details-content">
          <div v-if="pendingAttendance > 0" class="detail-item">
            <span>Asistencias pendientes:</span>
            <span class="detail-chip detail-chip--info">{{ pendingAttendance }}</span>
          </div>
          <div v-if="pendingTeachers > 0" class="detail-item">
            <span>Profesores pendientes:</span>
            <span class="detail-chip detail-chip--warning">{{ pendingTeachers }}</span>
          </div>
          <div v-if="pendingObservations > 0" class="detail-item">
            <span>Observaciones pendientes:</span>
            <span class="detail-chip detail-chip--secondary">{{ pendingObservations }}</span>
          </div>
        </div>
      </div>

      <!-- Última sincronización -->
      <div v-if="lastSyncTime && showDetails" class="last-sync">
        Última sincronización: {{ formattedLastSync }}
      </div>

      <!-- Errores de sincronización -->
      <div v-if="syncErrors && syncErrors.length > 0" class="error-section">
        <div class="error-alert">
          <div class="error-alert__header">
            <i class="mdi mdi-alert-circle" />
            <span>Errores de sincronización</span>
            <button aria-label="Cerrar errores" class="error-alert__close" @click="clearSyncErrors">
              <i class="mdi mdi-close" />
            </button>
          </div>
          <div class="error-alert__content">
            <div v-for="(error, index) in syncErrors" :key="index" class="error-item">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón para expandir detalles -->
    <div v-if="hasPendingOperations || lastSyncTime" class="sync-status-card__actions">
      <button class="details-toggle" @click="showDetails = !showDetails">
        {{ showDetails ? "Ocultar" : "Ver" }} detalles
        <i :class="['mdi', showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down']" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSyncStore } from '@/composables/sync/useOfflineSync';
import { useFormatters } from '@/composables/utils/useFormatters';

// ==================== COMPOSABLES ====================

const syncStore = useSyncStore();
const { formatRelativeTime } = useFormatters();

// ==================== PROPS ====================

interface Props {
  /** Mostrar siempre el componente, incluso cuando esté online sin pendientes */
  alwaysShow?: boolean
  /** Mostrar botón de sincronización manual */
  showSyncButton?: boolean
  /** Tamaño compacto */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alwaysShow: false,
  showSyncButton: true,
  compact: false,
});

// ==================== ESTADO LOCAL ====================

const showDetails = ref(false);

// ==================== COMPUTED PROPERTIES ====================

const isOnline = computed(() => syncStore.isOnline);
const isOffline = computed(() => !syncStore.isOnline);
const isSyncing = computed(() => syncStore.syncStatus === 'syncing');
const hasPendingOperations = computed(() => syncStore.hasPendingOperations);
const canSync = computed(() => syncStore.canSync);
const needRefresh = computed(() => syncStore.needRefresh);
const syncErrors = computed(() => syncStore.syncErrors);
const lastSyncTime = computed(() => syncStore.lastSyncTime);

// Operaciones pendientes detalladas
const pendingAttendance = ref(0);
const pendingTeachers = ref(0);
const pendingObservations = ref(0);

// Debe mostrar el componente
const shouldShow = computed(() => {
  if (props.alwaysShow) return true;
  if (isOffline.value) return true;
  if (hasPendingOperations.value) return true;
  if (isSyncing.value) return true;
  if (needRefresh.value) return true;
  if (syncErrors.value.length > 0) return true;
  return false;
});

// Estado visual
const statusColor = computed(() => {
  if (syncErrors.value.length > 0) return 'error';
  if (needRefresh.value) return 'success';
  if (isOffline.value) return 'warning';
  if (isSyncing.value) return 'info';
  return 'primary';
});

const statusIcon = computed(() => {
  if (syncErrors.value.length > 0) return 'mdi-alert-circle';
  if (needRefresh.value) return 'mdi-update';
  if (isOffline.value) return 'mdi-wifi-off';
  if (isSyncing.value) return 'mdi-sync';
  return 'mdi-wifi';
});

const iconColor = computed(() => {
  if (syncErrors.value.length > 0) return 'error';
  if (needRefresh.value) return 'success';
  if (isOffline.value) return 'warning';
  if (isSyncing.value) return 'info';
  return 'primary';
});

const statusTitle = computed(() => {
  if (syncErrors.value.length > 0) return 'Error de sincronización';
  if (needRefresh.value) return 'Actualización disponible';
  if (isSyncing.value) return 'Sincronizando...';
  if (isOffline.value) return 'Modo offline';
  return 'En línea';
});

const statusDescription = computed(() => {
  if (syncErrors.value.length > 0) {
    return `${syncErrors.value.length} error${syncErrors.value.length > 1 ? 'es' : ''} de sincronización`;
  }
  if (needRefresh.value) return 'Nueva versión disponible';
  if (isSyncing.value) return `Sincronizando ${syncStore.pendingOperations} operaciones`;
  if (isOffline.value && hasPendingOperations.value) {
    return `${syncStore.pendingOperations} operaciones pendientes`;
  }
  if (isOffline.value) return 'Sin conexión a internet';
  return 'Todos los datos están sincronizados';
});

const canShowSyncButton = computed(() => {
  return props.showSyncButton && (hasPendingOperations.value || isOffline.value);
});

const formattedLastSync = computed(() => {
  if (!lastSyncTime.value) return 'Nunca';
  return formatRelativeTime(lastSyncTime.value);
});

// ==================== MÉTODOS ====================

async function handleManualSync() {
  try {
    await syncStore.forceSyncPendingOperations();
  } catch (error) {
    console.error('Error en sincronización manual:', error);
  }
}

async function handleUpdatePWA() {
  try {
    await syncStore.updatePWA();
  } catch (error) {
    console.error('Error actualizando PWA:', error);
  }
}

function clearSyncErrors() {
  syncStore.clearSyncErrors();
}

// Actualizar detalles de operaciones pendientes
async function updatePendingDetails() {
  // Esta función se implementará cuando tengamos el estado detallado del SW
  // Por ahora usamos valores mock
  const total = syncStore.pendingOperations;
  pendingAttendance.value = Math.floor(total * 0.6);
  pendingTeachers.value = Math.floor(total * 0.2);
  pendingObservations.value = total - pendingAttendance.value - pendingTeachers.value;
}

// Inicializar detalles
updatePendingDetails();

// Actualizar detalles cuando cambien las operaciones pendientes
watch(() => syncStore.pendingOperations, updatePendingDetails);
</script>

<style scoped>
/* Color variables for different states */
:root {
  --sync-primary: #1976d2;
  --sync-success: #4caf50;
  --sync-warning: #ff9800;
  --sync-error: #f44336;
  --sync-info: #2196f3;
  --sync-surface: #ffffff;
  --sync-surface-variant: #f5f5f5;
  --sync-on-surface: #212121;
  --sync-on-surface-variant: #757575;
  --sync-border: #e0e0e0;
}

.sync-status-card {
  background: var(--sync-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 16px;
  transition: all 0.3s ease;
  border-left: 4px solid currentColor;
  overflow: hidden;
}

.sync-status-card--primary {
  border-left-color: var(--sync-primary);
}

.sync-status-card--success {
  border-left-color: var(--sync-success);
}

.sync-status-card--warning {
  border-left-color: var(--sync-warning);
}

.sync-status-card--error {
  border-left-color: var(--sync-error);
}

.sync-status-card--info {
  border-left-color: var(--sync-info);
}

.sync-status-card--offline {
  background: rgba(255, 152, 0, 0.1);
}

.sync-status-card__content {
  padding: 16px;
}

.sync-status-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.status-icon__symbol {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.status-icon--primary {
  color: var(--sync-primary);
}

.status-icon--success {
  color: var(--sync-success);
}

.status-icon--warning {
  color: var(--sync-warning);
}

.status-icon--error {
  color: var(--sync-error);
}

.status-icon--info {
  color: var(--sync-info);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-info__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--sync-on-surface);
  margin-bottom: 2px;
}

.status-info__description {
  font-size: 12px;
  color: var(--sync-on-surface-variant);
  line-height: 1.4;
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  min-height: 36px;
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-btn--primary {
  background: rgba(25, 118, 210, 0.12);
  color: var(--sync-primary);
}

.sync-btn--primary:hover:not(:disabled) {
  background: rgba(25, 118, 210, 0.2);
}

.sync-btn--success {
  background: var(--sync-success);
  color: white;
}

.sync-btn--success:hover:not(:disabled) {
  background: #45a049;
}

.progress-bar {
  margin-top: 12px;
  height: 4px;
  background: var(--sync-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--sync-primary);
  border-radius: 2px;
  animation: indeterminate 2s linear infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.details-section {
  margin-top: 16px;
}

.details-divider {
  height: 1px;
  background: var(--sync-border);
  margin-bottom: 12px;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--sync-on-surface-variant);
}

.detail-chip {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.detail-chip--info {
  background: rgba(33, 150, 243, 0.12);
  color: var(--sync-info);
}

.detail-chip--warning {
  background: rgba(255, 152, 0, 0.12);
  color: var(--sync-warning);
}

.detail-chip--secondary {
  background: rgba(103, 58, 183, 0.12);
  color: #673ab7;
}

.last-sync {
  font-size: 12px;
  color: var(--sync-on-surface-variant);
  margin-top: 12px;
}

.error-section {
  margin-top: 16px;
}

.error-alert {
  background: rgba(244, 67, 54, 0.12);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 4px;
  padding: 12px;
}

.error-alert__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-alert__header i {
  color: var(--sync-error);
  font-size: 16px;
}

.error-alert__header span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--sync-error);
}

.error-alert__close {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--sync-error);
  transition: background 0.2s ease;
}

.error-alert__close:hover {
  background: rgba(244, 67, 54, 0.1);
}

.error-alert__content {
  font-size: 12px;
  color: var(--sync-error);
  line-height: 1.4;
}

.error-item {
  margin-bottom: 4px;
}

.error-item:last-child {
  margin-bottom: 0;
}

.sync-status-card__actions {
  padding: 0 16px 16px;
  display: flex;
  justify-content: flex-end;
}

.details-toggle {
  background: none;
  border: none;
  padding: 8px;
  color: var(--sync-primary);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.details-toggle:hover {
  background: rgba(25, 118, 210, 0.08);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .sync-status-card {
    margin: 8px;
  }

  .sync-status-card__content {
    padding: 12px;
  }

  .sync-status-card__header {
    gap: 12px;
  }

  .sync-btn {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --sync-surface: #121212;
    --sync-surface-variant: #1e1e1e;
    --sync-on-surface: #ffffff;
    --sync-on-surface-variant: #b3b3b3;
    --sync-border: #333333;
  }

  .sync-status-card {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}
</style>
