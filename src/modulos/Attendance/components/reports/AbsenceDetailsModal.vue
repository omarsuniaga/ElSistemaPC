<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      />

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                👥 Estudiantes Ausentes - {{ formatDate(date) }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ absenceDetails.length }} estudiante{{ absenceDetails.length !== 1 ? 's' : '' }} ausente{{ absenceDetails.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4 max-h-96 overflow-y-auto">
          <!-- Empty state -->
          <div v-if="absenceDetails.length === 0" class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">
              <CheckCircleIcon class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p class="text-sm">¡Excelente! No hay ausencias registradas en esta fecha.</p>
            </div>
          </div>

          <!-- Absences list -->
          <div v-else class="space-y-4">
            <div
              v-for="absence in absenceDetails"
              :key="`${absence.studentId}-${absence.classId}`"
              class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <!-- Student Info -->
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {{ getInitials(absence.studentName) }}
                    </div>
                    <div>
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ absence.studentName }}
                      </h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ absence.className }}
                      </p>
                    </div>
                  </div>

                  <!-- Absence Stats -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      <div class="font-medium text-yellow-800 dark:text-yellow-300">Semana</div>
                      <div class="text-yellow-600 dark:text-yellow-400">{{ absence.previousAbsences }} falta{{ absence.previousAbsences !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <div class="font-medium text-red-800 dark:text-red-300">Total</div>
                      <div class="text-red-600 dark:text-red-400">{{ absence.totalAbsences }} falta{{ absence.totalAbsences !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <div class="font-medium text-blue-800 dark:text-blue-300">Contacto</div>
                      <div class="text-blue-600 dark:text-blue-400 truncate">{{ absence.parentContact || 'N/A' }}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div class="font-medium text-gray-800 dark:text-gray-300">Estado</div>
                      <div :class="absence.isJustified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'">
                        {{ absence.isJustified ? 'Justificada' : 'Sin justificar' }}
                      </div>
                    </div>
                  </div>

                  <!-- Justification Info -->
                  <div v-if="absence.isJustified && absence.justificationReason" class="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div class="font-medium text-green-800 dark:text-green-300 mb-1">Justificación:</div>
                    <div class="text-green-700 dark:text-green-400">{{ absence.justificationReason }}</div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col space-y-2 ml-4">
                  <!-- Justify Button -->
                  <button
                    v-if="!absence.isJustified"
                    @click="handleJustify(absence)"
                    class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    <DocumentCheckIcon class="h-3 w-3 mr-1" />
                    Justificar
                  </button>

                  <!-- WhatsApp Button -->
                  <button
                    v-if="absence.parentContact && absence.requiresNotification"
                    @click="handleSendNotification(absence)"
                    class="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon class="h-3 w-3 mr-1" />
                    WhatsApp
                  </button>

                  <!-- View Profile -->
                  <button
                    @click="viewStudentProfile(absence.studentId)"
                    class="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                  >
                    <UserIcon class="h-3 w-3 mr-1" />
                    Ver Perfil
                  </button>
                </div>
              </div>

              <!-- Critical Alert -->
              <div v-if="absence.previousAbsences >= 3" class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                <div class="flex items-center">
                  <ExclamationTriangleIcon class="h-4 w-4 text-red-500 mr-2" />
                  <span class="font-medium text-red-800 dark:text-red-300">
                    ⚠️ Ausencias críticas: Requiere notificación inmediata a los padres
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ criticalAbsencesCount }} estudiante{{ criticalAbsencesCount !== 1 ? 's' : '' }} con ausencias críticas
          </div>
          <div class="flex space-x-3">
            <button
              v-if="hasUnjustifiedAbsences"
              @click="justifyAllAbsences"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <DocumentCheckIcon class="h-4 w-4 mr-2" />
              Justificar Todas
            </button>
            <button
              v-if="hasNotifiableAbsences"
              @click="sendAllNotifications"
              class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon class="h-4 w-4 mr-2" />
              Notificar a Todos
            </button>
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Justification Modal -->
    <JustificationModal
      v-if="showJustificationModal"
      :is-open="showJustificationModal"
      :student="selectedStudent"
      :absence-date="date"
      @close="closeJustificationModal"
      @justify="handleJustificationSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline';

// Components
import JustificationModal from './JustificationModal.vue';

// Types
import type { AbsenceDetail } from '../../types/reports';

interface Props {
  isOpen: boolean;
  date: string;
  absenceDetails: AbsenceDetail[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  justifyAbsence: [studentId: string, date: string];
  sendNotification: [studentId: string];
}>();

// Modal states
const showJustificationModal = ref(false);
const selectedStudent = ref<AbsenceDetail | null>(null);

// Computed properties
const criticalAbsencesCount = computed(() => 
  props.absenceDetails.filter(absence => absence.previousAbsences >= 3).length
);

const hasUnjustifiedAbsences = computed(() =>
  props.absenceDetails.some(absence => !absence.isJustified)
);

const hasNotifiableAbsences = computed(() =>
  props.absenceDetails.some(absence => absence.requiresNotification && absence.parentContact)
);

// Methods
const formatDate = (date: string) => {
  return format(new Date(date), 'PPPP', { locale: es });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const handleJustify = (absence: AbsenceDetail) => {
  selectedStudent.value = absence;
  showJustificationModal.value = true;
};

const closeJustificationModal = () => {
  showJustificationModal.value = false;
  selectedStudent.value = null;
};

const handleJustificationSubmit = (data: any) => {
  emit('justifyAbsence', data.studentId, props.date);
  closeJustificationModal();
};

const handleSendNotification = (absence: AbsenceDetail) => {
  emit('sendNotification', absence.studentId);
};

const viewStudentProfile = (studentId: string) => {
  // Navigate to student profile
  console.log('View student profile:', studentId);
};

const justifyAllAbsences = () => {
  // Handle bulk justification
  console.log('Justify all absences for date:', props.date);
};

const sendAllNotifications = () => {
  // Handle bulk notifications
  console.log('Send all notifications for date:', props.date);
};
</script>