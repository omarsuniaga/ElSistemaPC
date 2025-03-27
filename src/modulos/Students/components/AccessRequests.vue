<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const requests = ref([])
const isLoading = ref(true)
const error = ref('')

onMounted(() => {
  if (!authStore.isDirector) {
    error.value = 'No tienes permisos para ver esta sección'
    isLoading.value = false
    return
  }

  // Escuchar cambios en tiempo real de las solicitudes pendientes
  const q = query(collection(db, 'USERS'), where('status', '==', 'pendiente'))
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    requests.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    isLoading.value = false
  }, (err) => {
    console.error('Error al obtener solicitudes:', err)
    error.value = 'Error al cargar las solicitudes'
    isLoading.value = false
  })

  // Limpiar suscripción al desmontar
  onUnmounted(() => unsubscribe())
})

const handleRequest = async (userId: string, approved: boolean) => {
  try {
    // Actualizar estado de la solicitud
    await updateDoc(doc(db, 'USERS', userId), {
      status: approved ? 'aprobado' : 'rechazado',
      updatedAt: new Date().toISOString()
    })

    // Filtrar la solicitud de la lista local
    requests.value = requests.value.filter(req => req.id !== userId)
  } catch (err) {
    console.error('Error al procesar solicitud:', err)
    error.value = 'Error al procesar la solicitud'
  }
}
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Solicitudes de Acceso Pendientes</h2>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="requests.length === 0" class="text-gray-500 dark:text-gray-400">
      No hay solicitudes pendientes
    </div>

    <!-- Requests List -->
    <div v-else class="space-y-4">
      <div 
        v-for="request in requests" 
        :key="request.id"
        class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div>
          <h3 class="font-medium">{{ request.email }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Solicitud: {{ new Date(request.createdAt).toLocaleDateString() }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleRequest(request.id, true)"
            class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Aprobar
          </button>
          <button
            @click="handleRequest(request.id, false)"
            class="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>