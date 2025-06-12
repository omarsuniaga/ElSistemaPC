<template>
  <Transition name="slide-down">
    <div v-if="shouldShowStatus" :class="['network-status', statusClass]">
      <div class="status-content">
        <div class="status-indicator">
          <span :class="['status-dot', dotClass]"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        
        <div v-if="showDetails" class="status-details">
          <p class="status-message">{{ statusMessage }}</p>
          <div v-if="lastChecked" class="last-check">
            Última verificación: {{ formatTime(lastChecked) }}
          </div>
        </div>

        <div class="status-actions">
          <button 
            v-if="!isOnline" 
            @click="forceCheck" 
            :disabled="isChecking"
            class="retry-btn"
          >
            <span v-if="isChecking" class="spinner"></span>
            {{ isChecking ? 'Verificando...' : 'Reintentar' }}
          </button>
          
          <button 
            @click="toggleDetails" 
            class="details-btn"
            :title="showDetails ? 'Ocultar detalles' : 'Mostrar detalles'"
          >
            <span :class="['arrow', { 'rotated': showDetails }]">▼</span>
          </button>
        </div>
      </div>

      <!-- Barra de progreso para conexión lenta -->
      <div v-if="connectionQuality === 'slow'" class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { 
  isOnline, 
  connectionQuality, 
  lastChecked, 
  isChecking, 
  forceCheck 
} = useNetworkStatus()

const showDetails = ref(false)

const shouldShowStatus = computed(() => {
  return !isOnline.value || connectionQuality.value === 'slow'
})

const statusClass = computed(() => {
  if (!isOnline.value) return 'offline'
  if (connectionQuality.value === 'slow') return 'slow'
  return 'online'
})

const dotClass = computed(() => {
  if (!isOnline.value) return 'pulse-dot'
  if (connectionQuality.value === 'slow') return 'slow-dot'
  return 'online-dot'
})

const statusText = computed(() => {
  if (!isOnline.value) return 'Sin conexión'
  if (connectionQuality.value === 'slow') return 'Conexión lenta'
  return 'Conectado'
})

const statusMessage = computed(() => {
  if (!isOnline.value) {
    return 'Los cambios se sincronizarán cuando vuelvas a tener conexión. Puedes seguir trabajando normalmente.'
  }
  if (connectionQuality.value === 'slow') {
    return 'La conexión es lenta. Algunas funciones pueden tardar más de lo normal.'
  }
  return 'Conexión estable'
})

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.offline {
  background: linear-gradient(135deg, #e94560 0%, #d73651 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.3);
}

.slow {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(243, 156, 18, 0.3);
}

.online {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.status-content {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pulse-dot {
  background: white;
  animation: pulse 1.5s infinite;
}

.slow-dot {
  background: white;
  animation: blink 2s infinite;
}

.online-dot {
  background: white;
  animation: none;
}

.status-text {
  font-weight: 600;
  font-size: 14px;
}

.status-details {
  flex: 2;
  font-size: 13px;
  opacity: 0.9;
}

.status-message {
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.last-check {
  font-size: 12px;
  opacity: 0.7;
}

.status-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.retry-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.details-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.details-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.arrow {
  font-size: 12px;
  transition: transform 0.2s;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  animation: progress 2s ease-in-out infinite;
}

/* Animations */
@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.5; 
    transform: scale(0.8);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.4; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .status-content {
    padding: 10px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .status-indicator {
    justify-content: center;
  }
  
  .status-details {
    text-align: center;
  }
  
  .status-actions {
    justify-content: center;
  }
}
</style>
