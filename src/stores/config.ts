import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../firebase'
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useConfigStore = defineStore('config', () => {
  // Estado
  const configs = ref<Record<string, any>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  
  // Getters
  const getConfig = computed(() => (key: string) => {
    return configs.value[key] || null
  })
  // Webhook específico para asistencia
  const attendanceWebhookUrl = computed(() => {
    // Priorizar makeWebhookUrl sobre attendance_webhook_url
    return configs.value['makeWebhookUrl'] || configs.value['attendance_webhook_url'] || null
  })
  
  // Acciones
  async function fetchConfigs() {
    isLoading.value = true
    error.value = null
    
    try {
      const configRef = doc(db, 'CONFIGURACION', 'app_config')
      const docSnap = await getDoc(configRef)
      
      if (docSnap.exists()) {
        configs.value = docSnap.data()
        // Asignar makeWebhookUrl a attendance_webhook_url si existe
        if (docSnap.data().makeWebhookUrl) {
          configs.value.attendance_webhook_url = docSnap.data().makeWebhookUrl
        }
      } else {
        // Si el documento no existe, crear uno con valores predeterminados
        const defaultConfigs = {
          attendance_webhook_url: "https://hook.us2.make.com/mzdmd69zpfo9rwo6yiiuqoz93vdg65xd",
          makeWebhookUrl: "https://hook.us2.make.com/mzdmd69zpfo9rwo6yiiuqoz93vdg65xd",
          created_at: new Date().toISOString(),
          created_by: authStore.user?.email || 'system'
        }
        
        await setDoc(configRef, defaultConfigs)
        configs.value = defaultConfigs
      }
      
      // Escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(configRef, (doc) => {
        if (doc.exists()) {
          configs.value = doc.data()
        }
      })
      
      // Retornar la función para cancelar la suscripción
      return unsubscribe
    } catch (err: any) {
      console.error("Error fetching configs:", err)
      error.value = `Error al cargar configuraciones: ${err.message}`
    } finally {
      isLoading.value = false
    }
  }
  
  async function updateConfig(key: string, value: any) {
    if (!authStore.user || !authStore.user.userRoles?.some(role => ['Admin', 'Director'].includes(role))) {
      error.value = 'No tiene permisos para modificar configuraciones'
      throw new Error('No tiene permisos para modificar configuraciones')
    }
    
    isLoading.value = true
    error.value = null
      try {
      const configRef = doc(db, 'CONFIGURACION', 'app_config')
      await updateDoc(configRef, {
        [key]: value,
        updated_at: new Date().toISOString(),
        updated_by: authStore.user.email
      })
      
      // Actualizar la caché local inmediatamente
      configs.value = {
        ...configs.value,
        [key]: value
      }
      
      return true
    } catch (err: any) {
      console.error("Error updating config:", err)
      error.value = `Error al actualizar configuración: ${err.message}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Específicamente para actualizar el webhook de asistencia
  async function updateAttendanceWebhook(url: string) {
    return updateConfig('attendance_webhook_url', url)
  }
  
  return {
    configs,
    isLoading,
    error,
    getConfig,
    attendanceWebhookUrl,
    fetchConfigs,
    updateConfig,
    updateAttendanceWebhook
  }
})
