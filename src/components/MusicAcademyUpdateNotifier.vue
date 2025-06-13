<template>
  <Transition name="music-academy-update">
    <div v-if="showUpdatePrompt" class="music-academy-update-overlay">
      <div class="update-modal">
        <!-- Header con branding -->
        <div class="update-header">
          <div class="app-logo">
            <div class="logo-icon">🎵</div>
            <div class="logo-text">
              <h2>Music Academy</h2>
              <span class="version-badge">v{{ displayVersion }}</span>
            </div>
          </div>
          <button @click="closeUpdate" class="close-btn" v-if="!isUpdating">✕</button>
        </div>

        <!-- Contenido principal -->
        <div class="update-content">
          <div class="update-title">
            <h3>🚀 Nueva versión disponible</h3>
            <p>Hemos mejorado Music Academy para ti</p>
          </div>

          <!-- Características nuevas -->
          <div class="update-features" v-show="showFeatures">
            <h4>✨ Novedades en esta versión:</h4>
            <div class="features-grid">
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span>Sistema de asistencias mejorado</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <span>Mejor rendimiento offline</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔧</span>
                <span>Correcciones de errores</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎨</span>
                <span>Interfaz optimizada</span>
              </div>
            </div>
          </div>

          <!-- Progress bar si está actualizando -->
          <div v-if="isUpdating" class="update-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: updateProgress + '%' }"></div>
            </div>
            <p class="progress-text">{{ updateStatusText }}</p>
          </div>

          <!-- Mensaje de iPad si se detecta -->
          <div v-if="isIPad" class="ipad-notice">
            <div class="notice-icon">📱</div>
            <p>
              <strong>Usuarios de iPad:</strong> 
              Esta actualización resolverá los problemas de versiones antiguas en Safari.
            </p>
          </div>
        </div>

        <!-- Acciones -->
        <div class="update-actions">
          <button 
            v-if="!isUpdating" 
            @click="postponeUpdate" 
            class="btn-postpone"
          >
            <span class="btn-icon">⏰</span>
            Recordar después
          </button>
          
          <button 
            @click="applyUpdate" 
            class="btn-update"
            :disabled="isUpdating"
          >
            <span v-if="isUpdating" class="spinner"></span>
            <span v-else class="btn-icon">🔄</span>
            {{ updateButtonText }}
          </button>
        </div>

        <!-- Footer -->
        <div class="update-footer">
          <small>
            Esta actualización mejorará tu experiencia con Music Academy
            {{ isIPad ? ' y resolverá problemas específicos de iPad' : '' }}
          </small>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Estado reactivo
const showUpdatePrompt = ref(false)
const showFeatures = ref(false)
const isUpdating = ref(false)
const updateProgress = ref(0)
const newVersion = ref('')
const updateStatusText = ref('')

// Detección de dispositivo
const isIPad = ref(false)

// Referencias del Service Worker
let swRegistration: ServiceWorkerRegistration | null = null
let updateCheckInterval: ReturnType<typeof setInterval> | null = null

// Computed properties
const displayVersion = computed(() => {
  return newVersion.value.split('-')[0] || '1.2.0'
})

const updateButtonText = computed(() => {
  if (isUpdating.value) return updateStatusText.value
  return isIPad.value ? 'Actualizar y Corregir' : 'Actualizar Ahora'
})

onMounted(() => {
  console.log('🎵 Music Academy Update Notifier inicializado')
  detectDevice()
  initializeUpdateSystem()
})

onUnmounted(() => {
  cleanup()
})

// Inicialización
const detectDevice = () => {
  // Detectar iPad
  isIPad.value = /iPad/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  
  if (isIPad.value) {
    console.log('📱 iPad detectado - optimizaciones activadas')
  }
}

const initializeUpdateSystem = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker no soportado')
    return
  }

  try {
    // Escuchar mensajes del SW
    navigator.serviceWorker.addEventListener('message', handleSWMessage)
    
    // Verificación periódica más frecuente para iPad
    const checkInterval = isIPad.value ? 15000 : 30000
    updateCheckInterval = setInterval(checkForUpdates, checkInterval)
    
    // Verificación inicial
    await checkForUpdates()
    
    console.log('✅ Sistema de actualizaciones de Music Academy activo')
  } catch (error) {
    console.error('❌ Error inicializando actualizaciones:', error)
  }
}

const cleanup = () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
  }
  navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
}

// Manejo de mensajes del Service Worker
const handleSWMessage = (event: MessageEvent) => {
  const { type, version, action } = event.data
  
  if (type === 'MUSIC_ACADEMY_UPDATED' && action === 'RELOAD_REQUIRED') {
    console.log('🎵 Nueva versión de Music Academy detectada:', version)
    
    newVersion.value = version
    showUpdatePrompt.value = true
    
    // Mostrar características después de un momento
    setTimeout(() => {
      showFeatures.value = true
    }, 1500)
    
    // Log específico para iPad
    if (isIPad.value) {
      console.log('📱 Actualización crítica para iPad disponible')
    }
  }
  
  if (type === 'MUSIC_ACADEMY_SYNC_COMPLETE') {
    console.log('✅ Sincronización completada:', event.data)
  }
}

// Verificación de actualizaciones
const checkForUpdates = async () => {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      swRegistration = registration
      
      // Forzar verificación
      await registration.update()
      
      // Verificar si hay SW esperando
      if (registration.waiting && !showUpdatePrompt.value) {
        console.log('⏳ Music Academy SW esperando activación')
        showUpdatePrompt.value = true
      }
    }
  } catch (error) {
    console.error('❌ Error verificando actualizaciones de Music Academy:', error)
  }
}

// Aplicar actualización
const applyUpdate = async () => {
  isUpdating.value = true
  updateProgress.value = 0
  
  try {
    console.log('🎵 Aplicando actualización de Music Academy...')
    
    // Paso 1: Preparando
    updateStatusText.value = 'Preparando actualización...'
    updateProgress.value = 20
    await delay(500)
    
    // Paso 2: Limpiando caches
    updateStatusText.value = 'Limpiando versiones anteriores...'
    updateProgress.value = 40
    await clearMusicAcademyCaches()
    
    // Paso 3: Activando nuevo SW
    updateStatusText.value = 'Activando nueva versión...'
    updateProgress.value = 60
    
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'MUSIC_ACADEMY_SKIP_WAITING' })
    }
    
    await delay(800)
    
    // Paso 4: Preparando recarga
    updateStatusText.value = isIPad.value ? 'Optimizando para iPad...' : 'Finalizando...'
    updateProgress.value = 80
    await delay(600)
    
    // Paso 5: Recarga final
    updateStatusText.value = 'Recargando Music Academy...'
    updateProgress.value = 100
    await delay(400)
    
    console.log('✅ Actualización aplicada, recargando Music Academy...')
    
    // Recarga optimizada para iPad
    const url = new URL(window.location.href)
    url.searchParams.set('v', Date.now().toString())
    url.searchParams.set('app', 'music-academy')
    if (isIPad.value) {
      url.searchParams.set('ipad', '1')
    }
    
    window.location.href = url.toString()
    
  } catch (error) {
    console.error('❌ Error aplicando actualización:', error)
    updateStatusText.value = 'Error - Reintentando...'
    
    // Fallback: recarga simple
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

// Posponer actualización
const postponeUpdate = () => {
  console.log('⏰ Actualización de Music Academy pospuesta')
  showUpdatePrompt.value = false
  showFeatures.value = false
  
  // Recordatorio más frecuente en iPad
  const reminderTime = isIPad.value ? 5 * 60 * 1000 : 10 * 60 * 1000
  
  setTimeout(() => {
    if (!showUpdatePrompt.value) {
      showUpdatePrompt.value = true
      console.log('🔔 Recordatorio: Actualización de Music Academy pendiente')
    }
  }, reminderTime)
}

// Cerrar sin actualizar
const closeUpdate = () => {
  showUpdatePrompt.value = false
  showFeatures.value = false
  
  // Recordatorio en 30 minutos
  setTimeout(() => {
    showUpdatePrompt.value = true
  }, 30 * 60 * 1000)
}

// Limpiar caches específicos de Music Academy
const clearMusicAcademyCaches = async () => {
  try {
    const cacheNames = await caches.keys()
    
    // Filtrar caches de Music Academy
    const musicAcademyCaches = cacheNames.filter(name => 
      name.includes('music-academy') || 
      name.includes('attendance') ||
      name.includes('students') ||
      name.includes('auth')
    )
    
    console.log('🧹 Limpiando caches de Music Academy:', musicAcademyCaches)
    
    await Promise.all(
      musicAcademyCaches.map(name => caches.delete(name))
    )
    
    // Limpiar localStorage específico
    const storageKeys = Object.keys(localStorage)
    storageKeys.forEach(key => {
      if (key.includes('music-academy') || 
          key.includes('attendance') || 
          key.includes('auth') ||
          key.includes('punta-cana')) {
        localStorage.removeItem(key)
      }
    })
    
    // Limpiar sessionStorage
    sessionStorage.clear()
    
    console.log('✅ Caches de Music Academy limpiados exitosamente')
  } catch (error) {
    console.error('❌ Error limpiando caches:', error)
    throw error
  }
}

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
</script>

<style scoped>
.music-academy-update-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.update-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(233, 69, 96, 0.3);
  overflow: hidden;
  color: white;
}

.update-header {
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #e94560, #f39c12);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #e94560, #f39c12);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.version-badge {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.update-content {
  padding: 24px;
}

.update-title h3 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: #e94560;
}

.update-title p {
  margin: 0 0 24px 0;
  opacity: 0.8;
  font-size: 1rem;
}

.update-features {
  background: rgba(233, 69, 96, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border-left: 4px solid #e94560;
}

.update-features h4 {
  margin: 0 0 16px 0;
  color: #e94560;
  font-size: 1rem;
}

.features-grid {
  display: grid;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.feature-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.update-progress {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #f39c12);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.8;
}

.ipad-notice {
  background: rgba(243, 156, 18, 0.1);
  border: 1px solid rgba(243, 156, 18, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notice-icon {
  font-size: 1.5rem;
  margin-top: 2px;
}

.ipad-notice p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.update-actions {
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
}

.btn-postpone, .btn-update {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-postpone {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-postpone:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-update {
  background: linear-gradient(135deg, #e94560, #f39c12);
  color: white;
}

.btn-update:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(233, 69, 96, 0.4);
}

.btn-update:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.1rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.update-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
}

.update-footer small {
  opacity: 0.7;
  font-size: 0.8rem;
  line-height: 1.4;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.music-academy-update-enter-active,
.music-academy-update-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.music-academy-update-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.music-academy-update-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Responsive */
@media (max-width: 580px) {
  .update-modal {
    margin: 10px;
    border-radius: 16px;
  }
  
  .update-header {
    padding: 20px 20px 0 20px;
  }
  
  .logo-text h2 {
    font-size: 1.3rem;
  }
  
  .update-content {
    padding: 20px;
  }
  
  .update-actions {
    padding: 0 20px 20px 20px;
    flex-direction: column;
  }
  
  .features-grid {
    gap: 10px;
  }
  
  .feature-item {
    font-size: 0.85rem;
  }
}
</style>
