<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, shallowRef } from 'vue'
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '../stores/auth'
import { CheckIcon, XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import { safeGet, safeArrayLength } from '../utils/safeAccess'
import { useAdminErrorHandling } from '../composables/useAdminErrorHandling'

const authStore = useAuthStore()
const db = getFirestore()
const { handleError, logError } = useAdminErrorHandling()

interface PendingUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  profileCompleted: boolean;
  createdAt: string;
  availability?: {
    type: 'complete' | 'partial';
    schedule: { day: string; startTime: string; endTime: string; enabled: boolean }[];
  };
}

const pendingUsers = ref<PendingUser[]>([])
const isLoading = ref(true)
const error = ref('')
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedUser = ref<PendingUser | null>(null)
const rejectReason = ref('')
const isProcessing = ref(false)
const selectedRole = ref('') // New: Role to asign

// Definir los eventos emitidos
const emit = defineEmits(['request-processed', 'pending-count-changed'])

// Referencia para la suscripción
const unsubscribeRef = shallowRef<(() => void) | null>(null)

// Suscribir a cambios en tiempo real de manera eficiente
const subscribeToPendingRequests = () => {
  // Cancelar suscripción previa si existe
  if (unsubscribeRef.value) {
    unsubscribeRef.value();
    unsubscribeRef.value = null;
  }
  
  const usersRef = collection(db, 'USERS')
  const q = query(usersRef, where('status', '==', 'pendiente'))
  
  unsubscribeRef.value = onSnapshot(q, (snapshot) => {
    pendingUsers.value = snapshot.docs.map(doc => {
      const data = doc.data() as PendingUser
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt || new Date().toISOString()
      }
    }).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
      // Emitir el número actual de solicitudes pendientes
    emit('pending-count-changed', safeArrayLength(pendingUsers.value));
    isLoading.value = false;  }, (err) => {
    logError('Error al obtener usuarios pendientes', err)
    error.value = handleError(err, 'Error al cargar las solicitudes')
    isLoading.value = false
  });
  
  return unsubscribeRef.value;
};

// Agregar validación para el rol
const validateApproval = () => {
  if (!selectedRole.value) {
    error.value = 'Por favor, selecciona un rol antes de aprobar la solicitud'
    return false
  }
  error.value = ''
  return true
}

// Actualizar la función de aprobación para validar el rol primero
const approveUser = async () => {
  if (!selectedUser.value) return
  
  // Validar que se haya seleccionado un rol
  if (!validateApproval()) return
  
  isProcessing.value = true
  try {
    const userRef = doc(db, 'USERS', selectedUser.value.id)
    await updateDoc(userRef, {
      status: 'aprobado',
      role: selectedRole.value, // asignar el rol seleccionado
      updatedAt: new Date().toISOString()
    })
    
    // La actualización en tiempo real manejará la eliminación de la lista
    emit('request-processed')
    
    // Cerrar modal y resetear el rol seleccionado
    closeModals()  } catch (err) {
    logError('Error al aprobar usuario', err)
    error.value = handleError(err, 'Error al aprobar la solicitud')
  } finally {
    isProcessing.value = false
  }
}

// Rechazar un usuario
const rejectUser = async () => {
  if (!selectedUser.value) return
  
  isProcessing.value = true
  try {
    const userRef = doc(db, 'USERS', selectedUser.value.id)
    await updateDoc(userRef, {
      status: 'rechazado',
      rejectionReason: rejectReason.value,
      updatedAt: new Date().toISOString()
    })
    
    // La actualización en tiempo real manejará la eliminación de la lista
    emit('request-processed')
    
    // Cerrar modal
    closeModals()  } catch (err) {
    logError('Error al rechazar usuario', err)
    error.value = handleError(err, 'Error al rechazar la solicitud')
  } finally {
    isProcessing.value = false
  }
}

// Actualizar la función para mostrar el modal de aprobación
const showApproveConfirm = (user: PendingUser) => {
  selectedUser.value = user
  // Limpiar el rol seleccionado para obligar a elegir uno nuevo
  selectedRole.value = ''
  // Mostrar el modal
  showApproveModal.value = true
}

// Gestión de modales
const showRejectConfirm = (user: PendingUser) => {
  selectedUser.value = user
  rejectReason.value = ''
  showRejectModal.value = true
}

// Actualizar la función de cerrar modales para resetear el rol
const closeModals = () => {
  showApproveModal.value = false
  showRejectModal.value = false
  selectedUser.value = null
  selectedRole.value = ''
  rejectReason.value = ''
  error.value = ''
}

// Formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar solicitudes al montar el componente
onMounted(() => {
  if (!['Director', 'Administrador'].includes(authStore.user?.role || '')) {
    error.value = 'No tienes permisos para ver esta sección'
    isLoading.value = false
    return
  }
  
  // Iniciar suscripción
  subscribeToPendingRequests();
})

// Limpiar suscripción al desmontar
onUnmounted(() => {
  if (unsubscribeRef.value) {
    unsubscribeRef.value();
    unsubscribeRef.value = null;
  }
})

// Observar cambios en el estado de autenticación
watch(() => authStore.user, (newValue) => {
  if (newValue && ['Director', 'Administrador'].includes(newValue.role || '')) {
    subscribeToPendingRequests()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Solicitudes de Acceso</h2>      <button 
        @click="subscribeToPendingRequests"
        class="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
      >
        Actualizar
      </button>
    </div>
    
    <!-- Estado de carga -->
    <div v-if="isLoading" class="py-8 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
    
    <!-- Error -->      <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {{ error }}
        <button 
          @click="subscribeToPendingRequests" 
          class="text-sm underline ml-2 hover:text-red-800 dark:hover:text-red-300"
        >
          Reintentar
        </button>
      </div>
      <!-- Sin solicitudes -->
    <div v-else-if="safeArrayLength(pendingUsers) === 0" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
      <UserIcon class="h-12 w-12 mx-auto text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">No hay solicitudes pendientes</h3>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        Todas las solicitudes de acceso han sido procesadas.
      </p>
    </div>
    
    <!-- Lista de solicitudes -->
    <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
      <div 
        v-for="user in pendingUsers" 
        :key="user.id"
        class="py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
      >
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4">
          <!-- Información del usuario -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="bg-primary-100 dark:bg-primary-900/30 rounded-full p-2">
                <UserIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ safeGet(user, 'name', 'Usuario') }}
                </h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Rol: {{ safeGet(user, 'role', 'No especificado') }}
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">              <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <EnvelopeIcon class="h-4 w-4 flex-shrink-0" />
                <span>{{ safeGet(user, 'email', 'No disponible') }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <PhoneIcon class="h-4 w-4 flex-shrink-0" />
                <span>{{ safeGet(user, 'phone', 'No disponible') }}</span>
              </div>              <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400 sm:col-span-2">
                <CalendarIcon class="h-4 w-4 flex-shrink-0" />
                <span>Registro: {{ formatDate(safeGet(user, 'createdAt', new Date().toISOString())) }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400 sm:col-span-2">
                <CalendarIcon class="h-4 w-4 flex-shrink-0" />
                <span>
                  <span class="font-medium">Disponibilidad:</span> 
                  {{ safeGet(user, 'availability.type') === 'complete' ? 'Tiempo Completo' : 'Tiempo Parcial' }}
                </span>
              </div>
                <div v-if="safeGet(user, 'availability.type') === 'partial'" class="sm:col-span-2 mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  <div class="font-medium mb-1">Horario disponible:</div>
                  <div v-for="day in safeGet(user, 'availability.schedule', [])" :key="day.day" class="flex gap-1">
                    <template v-if="safeGet(day, 'enabled', false)">
                      <span class="w-20">{{ safeGet(day, 'day', '') }}:</span>
                      <span>{{ safeGet(day, 'startTime', '') }} - {{ safeGet(day, 'endTime', '') }}</span>
                    </template>
                  </div>
                  <div v-if="!safeGet(user, 'availability.schedule', []).some(d => safeGet(d, 'enabled', false))" class="italic">
                    No especificó días disponibles
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2">              <span 
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  safeGet(user, 'profileCompleted', false)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                ]"
              >
                {{ safeGet(user, 'profileCompleted', false) ? 'Perfil completo' : 'Perfil incompleto' }}
              </span>
            </div>
          </div>
          
          <!-- Acciones -->
          <div class="flex flex-row sm:flex-col gap-2 justify-start sm:items-end">
            <button 
              @click="showApproveConfirm(user)"
              class="btn-sm btn-success flex items-center gap-1"
            >
              <CheckIcon class="h-4 w-4" />
              <span>Aprobar</span>
            </button>
            <button 
              @click="showRejectConfirm(user)"
              class="btn-sm btn-danger flex items-center gap-1"
            >
              <XMarkIcon class="h-4 w-4" />
              <span>Rechazar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para aprobar -->
    <div v-if="showApproveModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModals"></div>

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <CheckIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                  Asignar rol y aprobar
                </h3>
                <div class="mt-2">                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Asigne un rol para <span class="font-semibold">{{ safeGet(selectedUser, 'name', 'Usuario') }}</span> 
                    antes de aprobar su acceso a la plataforma.
                  </p>
                  
                  <!-- Mostrar mensaje de error si existe -->
                  <div v-if="error" class="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded">
                    {{ error }}
                  </div>
                  
                  <!-- Selector de rol (mejorado y más destacado) -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seleccione un rol: <span class="text-red-600">*</span>
                    </label>
                    <select 
                      v-model="selectedRole" 
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="" disabled>-- Seleccionar rol --</option>
                      <option value="Maestro">Maestro</option>
                      <option value="Director">Director</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                  
                  <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p class="text-xs text-blue-700 dark:text-blue-300">
                      <span class="font-medium">Nota:</span> Los permisos del usuario serán establecidos según el rol asignado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              @click="approveUser"
              :disabled="isProcessing || !selectedRole"
            >
              {{ isProcessing ? 'Procesando...' : 'Aprobar acceso' }}
            </button>
            <button 
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="closeModals"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para rechazar -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModals"></div>

        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <XMarkIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                  Rechazar acceso
                </h3>                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    ¿Estás seguro de que deseas rechazar el acceso de <span class="font-semibold">{{ safeGet(selectedUser, 'name', 'Usuario') }}</span>?
                  </p>
                  <div>
                    <label for="rejection-reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Motivo del rechazo (opcional)
                    </label>
                    <textarea
                      id="rejection-reason"
                      v-model="rejectReason"
                      rows="3"
                      class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Indique el motivo por el que se rechaza la solicitud..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              @click="rejectUser"
              :disabled="isProcessing"
            >
              {{ isProcessing ? 'Procesando...' : 'Rechazar' }}
            </button>
            <button 
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="closeModals"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.btn-sm {
  @apply px-3 py-1 text-sm font-medium rounded-md transition-colors;
}

.btn-success {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50;
}

.btn-danger {
  @apply bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50;
}
</style>