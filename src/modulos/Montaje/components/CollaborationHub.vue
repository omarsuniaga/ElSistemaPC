<template>
  <div class="collaboration-hub bg-white rounded-lg shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Centro de Colaboración</h3>
      <button
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        @click="showNewMessageModal = true"
      >
        Nuevo Mensaje
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex space-x-4 mb-6">
      <select v-model="selectedPriority" class="border border-gray-300 rounded-lg px-3 py-2">
        <option value="">Todas las prioridades</option>
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="baja">Baja</option>
      </select>

      <select v-model="selectedType" class="border border-gray-300 rounded-lg px-3 py-2">
        <option value="">Todos los tipos</option>
        <option value="comentario">Comentario</option>
        <option value="pregunta">Pregunta</option>
        <option value="sugerencia">Sugerencia</option>
        <option value="revision">Revisión</option>
      </select>
    </div>

    <!-- Lista de mensajes -->
    <div class="space-y-4">
      <div
        v-for="message in filteredMessages"
        :key="message.id"
        class="border border-gray-200 rounded-lg p-4"
        :class="{
          'border-red-300 bg-red-50': message.prioridad === 'alta',
          'border-yellow-300 bg-yellow-50': message.prioridad === 'media',
          'border-green-300 bg-green-50': message.prioridad === 'baja',
        }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="font-medium text-gray-900">{{ message.autor }}</span>
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="{
                  'bg-red-100 text-red-800': message.prioridad === 'alta',
                  'bg-yellow-100 text-yellow-800': message.prioridad === 'media',
                  'bg-green-100 text-green-800': message.prioridad === 'baja',
                }"
              >
                {{ message.prioridad.toUpperCase() }}
              </span>
              <span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {{ message.tipo }}
              </span>
            </div>
            <p class="text-gray-700 mb-2">{{ message.contenido }}</p>
            <div class="text-sm text-gray-500">
              {{ formatDate(message.fechaCreacion) }}
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              v-if="!message.resuelto"
              class="text-green-600 hover:text-green-800"
              title="Marcar como resuelto"
              @click="markAsResolved(message.id)"
            >
              ✓
            </button>
            <button
              class="text-red-600 hover:text-red-800"
              title="Eliminar mensaje"
              @click="deleteMessage(message.id)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Archivos adjuntos -->
        <div v-if="message.archivosAdjuntos && message.archivosAdjuntos.length > 0" class="mt-3">
          <div class="text-sm text-gray-600 mb-2">Archivos adjuntos:</div>
          <div class="flex flex-wrap gap-2">
            <a
              v-for="archivo in message.archivosAdjuntos"
              :key="archivo.id"
              :href="archivo.url"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {{ archivo.nombre }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para nuevo mensaje -->
    <div
      v-if="showNewMessageModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h4 class="text-lg font-semibold mb-4">Nuevo Mensaje</h4>

        <form @submit.prevent="submitMessage">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Tipo </label>
            <select
              v-model="newMessage.tipo"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="comentario">Comentario</option>
              <option value="pregunta">Pregunta</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="revision">Revisión</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Prioridad </label>
            <select
              v-model="newMessage.prioridad"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Contenido </label>
            <textarea
              v-model="newMessage.contenido"
              required
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
              @click="showNewMessageModal = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCollaboration } from '../composables/useCollaboration';
import type { MensajeColaboracion, TipoMensaje, PrioridadMensaje } from '../types';

// Composables
const {
  messages,
  loading,
  createMessage,
  deleteMessage: removeMessage,
  markAsResolved: resolveMessage,
} = useCollaboration();

// Estado local
const showNewMessageModal = ref(false);
const selectedPriority = ref<PrioridadMensaje | ''>('');
const selectedType = ref<TipoMensaje | ''>('');

const newMessage = ref({
  tipo: 'comentario' as TipoMensaje,
  prioridad: 'media' as PrioridadMensaje,
  contenido: '',
});

// Computed
const filteredMessages = computed(() => {
  return messages.value.filter((message) => {
    const priorityMatch = !selectedPriority.value || message.prioridad === selectedPriority.value;
    const typeMatch = !selectedType.value || message.tipo === selectedType.value;
    return priorityMatch && typeMatch;
  });
});

// Métodos
const submitMessage = async () => {
  try {
    await createMessage({
      ...newMessage.value,
      obraId: 'current-obra-id', // This should come from props or route
      autor: 'Current User', // This should come from auth
      fechaCreacion: new Date(),
      resuelto: false,
      archivosAdjuntos: [],
    });

    newMessage.value = {
      tipo: 'comentario',
      prioridad: 'media',
      contenido: '',
    };
    showNewMessageModal.value = false;
  } catch (error) {
    console.error('Error al crear mensaje:', error);
  }
};

const deleteMessage = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
    await removeMessage(id);
  }
};

const markAsResolved = async (id: string) => {
  await resolveMessage(id);
};

const formatDate = (date: Date | any) => {
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleString('es-ES');
  }
  if (date instanceof Date) {
    return date.toLocaleString('es-ES');
  }
  return 'Fecha no disponible';
};

// Lifecycle
onMounted(() => {
  // Los mensajes se cargarán automáticamente a través del composable
});
</script>

<style scoped>
.collaboration-hub {
  max-height: 600px;
  overflow-y: auto;
}
</style>
