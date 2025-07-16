<template>
  <div class="emergent-classes-indicator">
    <!-- Indicador visual (spinner durante la carga) -->
    <div v-if="isLoading" class="flex items-center">
      <svg
        class="animate-spin h-5 w-5 mr-2 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span class="text-sm text-gray-500">Verificando clases emergentes...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-red-500 flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Error: {{ error }}
    </div>

    <!-- Resultados -->
    <div v-else class="flex items-center">
      <!-- Indicador SÍ -->
      <div
        v-if="hasApprovedEmergentClasses"
        class="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full"
        role="status"
        aria-live="polite"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="font-medium"
          >{{ emergentClassesCount }}
          {{ emergentClassesCount === 1 ? "clase emergente" : "clases emergentes" }} hoy</span
        >
        <button
          class="ml-2 text-amber-800 hover:text-amber-900 underline text-sm"
          aria-label="Ver detalles de clases emergentes"
          @click="openModal"
        >
          Ver detalles
        </button>
      </div>

      <!-- Indicador NO -->
      <div
        v-else
        class="flex items-center bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
        role="status"
        aria-live="polite"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span class="font-medium">No hay clases emergentes hoy</span>
      </div>
    </div>

    <!-- Modal para detalles adicionales -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div
        class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 id="modal-title" class="text-lg font-medium text-gray-900">
            Clases Emergentes Aprobadas Hoy
          </h3>
          <button
            class="text-gray-400 hover:text-gray-500"
            aria-label="Cerrar modal"
            @click="closeModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Lista de clases emergentes -->
        <div v-if="emergentClasses.length > 0" class="space-y-4">
          <div
            v-for="(clase, index) in emergentClasses"
            :key="index"
            class="border-b pb-4 last:border-b-0"
          >
            <h4 class="font-medium text-gray-800">{{ clase.title }}</h4>
            <div class="grid grid-cols-1 gap-2 text-sm mt-2">
              <div class="flex items-center">
                <span class="font-medium mr-2">Hora:</span>
                <span>{{ formatTime(clase.startTime) }} - {{ formatTime(clase.endTime) }}</span>
              </div>
              <div class="flex items-center">
                <span class="font-medium mr-2">Profesor original:</span>
                <span>{{ clase.originalTeacher }}</span>
              </div>
              <div class="flex items-start">
                <span class="font-medium mr-2">Profesor sustituto:</span>
                <span class="text-green-600">{{ clase.replacementTeacher }}</span>
              </div>
              <div class="flex items-start">
                <span class="font-medium mr-2">Ubicación:</span>
                <span>{{ clase.location }}</span>
              </div>
              <div class="flex items-start">
                <span class="font-medium mr-2">Motivo:</span>
                <span class="text-gray-600">{{ clase.reason }}</span>
              </div>
              <div class="flex items-start">
                <span class="font-medium mr-2">Notas:</span>
                <span class="text-gray-600">{{ clase.notes || "Sin notas adicionales" }}</span>
              </div>
              <div class="flex items-start">
                <span class="font-medium mr-2">Estado:</span>
                <span :class="getEstadoClaseStyle(clase)">{{ getEstadoClase(clase).estado }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- No hay clases emergentes (no debería mostrarse ya que solo se abre el modal si hay clases) -->
        <div v-else class="text-center py-4 text-gray-500">
          No hay información disponible sobre clases emergentes para hoy.
        </div>

        <!-- Botones de acción -->
        <div class="mt-6 flex justify-end space-x-3">
          <button
            v-if="!notificationSent && emergentClasses.length > 0"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
            :disabled="isNotifying"
            @click="notifyStudents"
          >
            <svg
              v-if="isNotifying"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ isNotifying ? "Enviando..." : "Notificar a estudiantes" }}
          </button>
          <button
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition"
            @click="closeModal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useEmergentClassesCheck } from '../composables/useEmergentClassesCheck';
import { sendEmergentClassNotifications } from '../services/notifications';

// Estado del componente
const showModal = ref(false);
const notificationSent = ref(false);
const isNotifying = ref(false);

// Obtener datos de clases emergentes desde el composable
const { isLoading, error, emergentClasses, hasApprovedEmergentClasses, emergentClassesCount } =
  useEmergentClassesCheck();

// Métodos
const openModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Determina el estado actual de una clase según la hora actual
 * @param {Object} clase - Objeto con información de la clase incluido horarioInicio y horarioFin
 * @returns {Object} - Objeto con el estado y los datos asociados
 */
const getEstadoClase = (clase) => {
  const ahora = new Date();
  const horaInicio = clase.startTime ? new Date(clase.startTime) : null;
  const horaFin = clase.endTime ? new Date(clase.endTime) : null;

  if (!horaInicio || !horaFin) {
    return { estado: 'Sin información de horario', color: 'gray' };
  }

  // Para clases pendientes (aún no inician)
  if (ahora < horaInicio) {
    return {
      estado: 'En espera',
      color: 'blue',
      tiempoRestante: Math.floor((horaInicio.getTime() - ahora.getTime()) / 60000), // minutos restantes
    };
  }
  // Para clases en curso
  else if (ahora >= horaInicio && ahora <= horaFin) {
    return {
      estado: 'En proceso',
      color: 'green',
      progreso: Math.floor(
        ((ahora.getTime() - horaInicio.getTime()) / (horaFin.getTime() - horaInicio.getTime())) *
          100,
      ),
    };
  }
  // Para clases ya terminadas
  else {
    return {
      estado: 'Terminado',
      color: 'gray',
    };
  }
};

/**
 * Devuelve las clases de Tailwind CSS para el estilo del estado de la clase
 * @param {Object} clase - Objeto con información de la clase
 * @returns {String} - Clases de Tailwind CSS
 */
const getEstadoClaseStyle = (clase) => {
  const estado = getEstadoClase(clase);
  const styles = {
    blue: 'text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full',
    green: 'text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full',
    yellow: 'text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full',
    gray: 'text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded-full',
    red: 'text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full',
  };

  return styles[estado.color] || styles['gray'];
};

// Método para enviar notificaciones a los estudiantes sobre las clases emergentes
const notifyStudents = async () => {
  if (isNotifying.value) return;

  isNotifying.value = true;
  try {
    // Llamada al servicio de notificaciones
    const result = await sendEmergentClassNotifications(emergentClasses.value);
    notificationSent.value = true;
    // Mostrar confirmación
    alert(`Notificaciones enviadas correctamente:
    - ${result.sentNotifications} estudiantes notificados
    - ${result.skippedNotifications} estudiantes ya habían sido notificados anteriormente`);
  } catch (error) {
    console.error('Error al enviar notificaciones:', error);
    alert('Error al enviar las notificaciones: ' + error.message);
  } finally {
    isNotifying.value = false;
  }
};
</script>

<style scoped>
/* Estilos específicos para el componente */
</style>
