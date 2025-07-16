<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div
      class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            📱 Gestión de Notificaciones WhatsApp
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Envía mensajes personalizados según el tipo de situación: ausencias, tardanzas o justificaciones
          </p>
        </div>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="close"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs para tipo de notificación -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in notificationTabs"
            :key="tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
            ]"
            @click="activeTab = tab.id"
          >
            <span class="text-lg">{{ tab.icon }}</span>
            {{ tab.name }}
            <span
              v-if="getStudentsByType(tab.id).length > 0"
              class="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full"
            >
              {{ getStudentsByType(tab.id).length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex-1 flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
          />
          <p class="text-gray-600 dark:text-gray-400">
            Cargando estudiantes...
          </p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex-1 flex overflow-hidden">
        <!-- Left Panel: Lista de estudiantes -->
        <div class="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <!-- Filtros -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtro por período
              </label>
              <select
                v-model="selectedPeriod"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                @change="fetchStudentsData"
              >
                <option value="today">Solo hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
            </div>

            <!-- Contadores por tab -->
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p>{{ getActiveStudents().length }} estudiantes encontrados</p>
              <p v-if="getSelectedRecipients().length > 0">
                {{ getSelectedRecipients().length }} destinatarios seleccionados
              </p>
            </div>
          </div>

          <!-- Lista de estudiantes -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="getActiveStudents().length === 0" class="p-6 text-center">
              <svg
                class="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8"
                />
              </svg>
              <p class="text-gray-500 dark:text-gray-400 mt-2">
                No hay estudiantes {{ getActiveTabLabel() }}
              </p>
            </div>

            <div v-else class="space-y-3 p-4">
              <div
                v-for="student in getActiveStudents()"
                :key="student.id"
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <!-- Student Info -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {{ student.nombre }} {{ student.apellido }}
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ student.instrumento || "Sin instrumento" }}
                    </p>
                    <div class="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span class="text-lg mr-2">{{ getStatusIcon(activeTab) }}</span>
                      {{ getStatusText(activeTab) }}
                      <span v-if="activeTab === 'ausentes' && student.absenceCount" class="ml-2 font-medium">
                        ({{ student.absenceCount }} ausencias)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Phone Numbers Selection -->
                <div v-if="student.phoneNumbers && hasValidPhoneNumbers(student)" class="space-y-2">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar destinatario:
                  </p>
                  
                  <div
                    v-if="student.phoneNumbers.madre"
                    class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded"
                  >
                    <div class="flex items-center">
                      <input
                        :id="`madre-${student.id}`"
                        type="checkbox"
                        :checked="isRecipientSelected(student.id, 'madre')"
                        class="mr-2"
                        @change="toggleRecipient(student.id, 'madre', student.phoneNumbers.madre, student)"
                      />
                      <label :for="`madre-${student.id}`" class="text-sm text-gray-700 dark:text-gray-300">
                        👩 Madre: {{ student.phoneNumbers.madre }}
                        <span :class="getPhoneValidationClass(student.phoneNumbers.madre)">
                          {{ getPhoneValidationIcon(student.phoneNumbers.madre) }}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div
                    v-if="student.phoneNumbers.padre"
                    class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded"
                  >
                    <div class="flex items-center">
                      <input
                        :id="`padre-${student.id}`"
                        type="checkbox"
                        :checked="isRecipientSelected(student.id, 'padre')"
                        class="mr-2"
                        @change="toggleRecipient(student.id, 'padre', student.phoneNumbers.padre, student)"
                      />
                      <label :for="`padre-${student.id}`" class="text-sm text-gray-700 dark:text-gray-300">
                        👨 Padre: {{ student.phoneNumbers.padre }}
                        <span :class="getPhoneValidationClass(student.phoneNumbers.padre)">
                          {{ getPhoneValidationIcon(student.phoneNumbers.padre) }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- No phone numbers warning -->
                <div
                  v-else
                  class="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200"
                >
                  ⚠️ No hay números de teléfono registrados para este estudiante
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Configuración del mensaje -->
        <div class="flex-1 flex flex-col">
          <!-- Template Selection -->
          <div
            class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📝 Plantilla de Mensaje
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <button
                v-for="template in getTemplatesForActiveTab()"
                :key="template.id"
                :class="[
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
                  'p-3 border rounded-lg text-left transition-colors',
                ]"
                @click="selectTemplate(template.id)"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900 dark:text-white">{{ template.name }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ template.tone }}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ template.description }}
                </p>
              </button>
            </div>
          </div>

          <!-- Message Preview/Editor -->
          <div class="flex-1 p-4 overflow-y-auto">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vista previa del mensaje:
                </label>
                <div
                  class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto"
                >
                  <div class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {{ getPreviewMessage() }}
                  </div>
                </div>
                
                <!-- 🔍 Indicador de validación del mensaje -->
                <div v-if="customMessage" class="mt-2">
                  <div class="flex items-center space-x-2 text-xs">
                    <span :class="getMessageValidationStatus().class">
                      {{ getMessageValidationStatus().icon }}
                    </span>
                    <span :class="getMessageValidationStatus().textClass">
                      {{ getMessageValidationStatus().text }}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editar mensaje:
                </label>
                <textarea
                  v-model="customMessage"
                  rows="8"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Personaliza el mensaje aquí..."
                />
              </div>

              <!-- Variables disponibles -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Variables disponibles:
                </h4>
                <div class="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
                  <div>{studentName} - Nombre del estudiante</div>
                  <div>{date} - Fecha actual</div>
                  <div>{academyName} - Nombre de la academia</div>
                  <div>{parentType} - Tipo de padre (Madre/Padre)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span v-if="getSelectedRecipients().length > 0">
                  {{ getSelectedRecipients().length }} destinatarios seleccionados
                </span>
                <span v-else>Selecciona destinatarios para continuar</span>
              </div>
              
              <!-- 🔍 Resumen de validación antes del envío -->
              <div v-if="getSelectedRecipients().length > 0" class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
                <div class="space-y-2">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📊 Resumen de validación:
                  </h4>
                  <div class="text-xs space-y-1">
                    <div class="flex justify-between">
                      <span>📱 Destinatarios seleccionados:</span>
                      <span class="font-medium">{{ getSelectedRecipients().length }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>✅ Números válidos:</span>
                      <span class="font-medium text-green-600">{{ getValidPhoneCount() }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>⚠️ Números con problemas:</span>
                      <span class="font-medium text-yellow-600">{{ getInvalidPhoneCount() }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>📝 Estado del mensaje:</span>
                      <span :class="getMessageValidationStatus().textClass" class="font-medium">
                        {{ getMessageValidationStatus().text }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex space-x-3">
                <button
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="close"
                >
                  Cancelar
                </button>
                <button
                  :disabled="getSelectedRecipients().length === 0 || sending"
                  :class="[
                    getSelectedRecipients().length === 0 || sending
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700',
                    'px-6 py-2 text-white rounded-md flex items-center',
                  ]"
                  @click="sendMessages"
                >
                  <div
                    v-if="sending"
                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                  />
                  {{ sending ? "Enviando..." : "📱 Enviar Mensajes" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStudentsStore } from '@/modulos/Students/store/students';
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance';
import {
  notifyUnexcusedAbsences,
  notifyLateStudents,
  notifyJustifiedAbsences,
  MESSAGE_TEMPLATES,
  type MessageTemplate,
} from '@/services/attendanceNotifications';
import { WhatsAppMessageValidator, logVerificationReport } from '@/utils/whatsappMessageValidator';

// Props
interface Props {
  isVisible: boolean
  // 📊 Datos del reporte diario para pre-cargar estudiantes
  reportData?: {
    unjustifiedAbsences?: any[]
    lateStudents?: any[]
    justifiedAbsences?: any[]
    selectedDate?: string
  }
  // 🎯 Tipo de notificación inicial (para abrir directamente en la pestaña correcta)
  initialTab?: 'ausentes' | 'tarde' | 'justificado'
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: false,
  reportData: undefined,
  initialTab: 'ausentes',
});

// Emits
const emit = defineEmits<{
  close: []
  messagesSent: [result: { success: number; failed: number; messages: any[] }]
}>();

// Interfaces
interface StudentData {
  id: string
  nombre: string
  apellido: string
  instrumento: string
  phoneNumbers: {
    madre?: string
    padre?: string
  }
  status: 'ausente' | 'tarde' | 'justificado'
  absenceCount?: number
  escalationLevel?: number
  time?: string
  reason?: string
}

interface MessageDestination {
  studentId: string
  recipientType: 'madre' | 'padre'
  phoneNumber: string
  studentData: StudentData
}

// Stores
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();

// State
const loading = ref(false);
const sending = ref(false);
const selectedPeriod = ref('today');
const activeTab = ref('ausentes');
const selectedTemplate = ref('');
const customMessage = ref('');
const selectedRecipients = ref<MessageDestination[]>([]);

// Student data by type
const studentsData = ref<{
  ausentes: StudentData[]
  tarde: StudentData[]
  justificado: StudentData[]
}>({
  ausentes: [],
  tarde: [],
  justificado: [],
});

// Configuration
const notificationTabs = [
  { id: 'ausentes', name: 'Ausentes', icon: '❌' },
  { id: 'tarde', name: 'Tardanzas', icon: '⏰' },
  { id: 'justificado', name: 'Justificadas', icon: '📝' },
];

const messageTemplates = {
  ausentes: [
    {
      id: 'ausente_amable',
      name: 'Recordatorio Amable',
      tone: 'Amigable',
      description: 'Mensaje cordial recordando la importancia de la asistencia',
      content: `Hola {parentType},

Esperamos que estén bien. Notamos que {studentName} no asistió a su clase de música hoy ({date}).

Sabemos que pueden surgir imprevistos, pero queremos asegurar la continuidad en el aprendizaje musical de {studentName}.

Si hay alguna situación especial, no duden en contactarnos.

Saludos cordiales,
{academyName} 🎵`,
    },
    {
      id: 'ausente_disciplinario',
      name: 'Tono Disciplinario',
      tone: 'Formal',
      description: 'Mensaje más serio sobre responsabilidad',
      content: `Estimado/a {parentType},

Le informamos que {studentName} ha faltado a su clase de música el día {date}.

La constancia y disciplina son fundamentales para el progreso musical. Las ausencias frecuentes afectan el desarrollo de habilidades y el avance en el programa.

Le pedimos mantener un compromiso firme con los horarios establecidos.

Atentamente,
{academyName}`,
    },
    {
      id: 'ausente_explicacion',
      name: 'Solicitud de Explicación',
      tone: 'Requerimiento',
      description: 'Solicitud formal de explicación',
      content: `{parentType},

{studentName} ha acumulado varias ausencias en sus clases de música.

Necesitamos que nos proporcione una explicación sobre estas inasistencias y confirme si desea continuar con el programa musical.

Por favor, contacte a la administración a la brevedad para aclarar esta situación.

{academyName}
Administración`,
    },
  ],
  tarde: [
    {
      id: 'tarde_recordatorio',
      name: 'Recordatorio de Puntualidad',
      tone: 'Amigable',
      description: 'Mensaje amable sobre la importancia de la puntualidad',
      content: `Hola {parentType},

{studentName} llegó tarde a su clase de música hoy ({date}).

La puntualidad es importante para aprovechar al máximo el tiempo de clase y no interrumpir la dinámica del aprendizaje.

Agradecemos su colaboración para que {studentName} llegue a tiempo a sus próximas clases.

¡Gracias!
{academyName} 🎵`,
    },
    {
      id: 'tarde_disciplinario',
      name: 'Llamado de Atención',
      tone: 'Formal',
      description: 'Mensaje más serio sobre tardanzas repetidas',
      content: `Estimado/a {parentType},

Le informamos que {studentName} ha llegado tarde a su clase de música.

Las tardanzas afectan el desarrollo normal de la clase y el aprovechamiento del tiempo de aprendizaje.

Le solicitamos ser más puntual para el beneficio de {studentName} y sus compañeros.

Atentamente,
{academyName}`,
    },
  ],
  justificado: [
    {
      id: 'justificado_informativo',
      name: 'Información de Recuperación',
      tone: 'Informativo',
      description: 'Información sobre próximas actividades y recuperación',
      content: `Hola {parentType},

Hemos recibido la justificación por la ausencia de {studentName} el día {date}.

Para mantener el progreso musical de {studentName}, le informamos sobre las próximas actividades:

• Próxima clase: [FECHA Y HORA]
• Material a repasar: [CONTENIDO]
• Actividades de recuperación disponibles

No duden en contactarnos si necesitan apoyo adicional.

Saludos,
{academyName} 🎵`,
    },
    {
      id: 'justificado_seguimiento',
      name: 'Seguimiento Personalizado',
      tone: 'Personalizado',
      description: 'Mensaje de seguimiento con atención personalizada',
      content: `{parentType},

Entendemos la situación que impidió que {studentName} asistiera a su clase ({date}).

Nuestro equipo está preparado para brindar el apoyo necesario para que {studentName} se mantenga al día con su formación musical.

Podemos coordinar:
• Clases de recuperación
• Material de estudio adicional
• Sesiones de refuerzo

Contacte con nosotros para coordinar el mejor plan.

{academyName}
Equipo Pedagógico`,
    },
  ],
};

// Computed
const getActiveStudents = () => {
  return studentsData.value[activeTab.value] || [];
};

const getStudentsByType = (type: string) => {
  return studentsData.value[type] || [];
};

const getActiveTabLabel = () => {
  const tab = notificationTabs.find((t) => t.id === activeTab.value);
  return tab ? tab.name.toLowerCase() : '';
};

const getTemplatesForActiveTab = () => {
  return messageTemplates[activeTab.value] || [];
};

const getSelectedRecipients = () => {
  return selectedRecipients.value.filter((r) => 
    getActiveStudents().some((s) => s.id === r.studentId),
  );
};

const getPreviewMessage = () => {
  if (!selectedTemplate.value || !customMessage.value) {
    return 'Selecciona una plantilla y/o escribe un mensaje personalizado';
  }

  // Get first selected recipient for preview
  const firstRecipient = getSelectedRecipients()[0];
  if (!firstRecipient) {
    // 🔍 Verificar mensaje sin destinatario
    const validation = WhatsAppMessageValidator.validateMessageContent(customMessage.value);
    if (!validation.isValid) {
      console.warn('⚠️ Mensaje personalizado tiene problemas:', validation.warnings);
    }
    return customMessage.value;
  }

  const processedMessage = replaceVariables(customMessage.value, firstRecipient);
  
  // 🔍 Verificar mensaje procesado
  const validation = WhatsAppMessageValidator.validateMessageContent(processedMessage);
  if (!validation.isValid) {
    console.warn('⚠️ Mensaje procesado tiene problemas:', validation.warnings);
  }
  
  return processedMessage;
};

// 🔍 Función para obtener el estado de validación del mensaje
const getMessageValidationStatus = () => {
  const message = customMessage.value || '';
  
  if (!message) {
    return {
      icon: '❓',
      text: 'Sin mensaje',
      class: 'text-gray-500',
      textClass: 'text-gray-500',
    };
  }
  
  const validation = WhatsAppMessageValidator.validateMessageContent(message);
  
  if (validation.isValid) {
    return {
      icon: '✅',
      text: 'Mensaje válido',
      class: 'text-green-600',
      textClass: 'text-green-600',
    };
  } else {
    return {
      icon: '⚠️',
      text: `Problemas: ${validation.warnings.length}`,
      class: 'text-yellow-600',
      textClass: 'text-yellow-600',
    };
  }
};

// 🔍 Funciones para validación de números de teléfono
const getPhoneValidationIcon = (phone: string) => {
  const validation = WhatsAppMessageValidator.validatePhoneNumber(phone);
  return validation.isValid ? '✅' : '⚠️';
};

const getPhoneValidationClass = (phone: string) => {
  const validation = WhatsAppMessageValidator.validatePhoneNumber(phone);
  return validation.isValid ? 'text-green-600 ml-1' : 'text-yellow-600 ml-1';
};

// 🔍 Funciones para conteo de validación
const getValidPhoneCount = () => {
  return getSelectedRecipients().filter(
    (recipient) => WhatsAppMessageValidator.validatePhoneNumber(recipient.phoneNumber).isValid,
  ).length;
};

const getInvalidPhoneCount = () => {
  return getSelectedRecipients().filter(
    (recipient) => !WhatsAppMessageValidator.validatePhoneNumber(recipient.phoneNumber).isValid,
  ).length;
};

// Methods
const getStatusIcon = (status: string) => {
  const icons = {
    ausentes: '❌',
    tarde: '⏰',
    justificado: '📝',
  };
  return icons[status] || '❓';
};

const getStatusText = (status: string) => {
  const texts = {
    ausentes: 'Ausencia sin justificar',
    tarde: 'Llegada tardía',
    justificado: 'Ausencia justificada',
  };
  return texts[status] || status;
};

const hasValidPhoneNumbers = (student: StudentData) => {
  return student.phoneNumbers && (student.phoneNumbers.madre || student.phoneNumbers.padre);
};

const isRecipientSelected = (studentId: string, recipientType: 'madre' | 'padre') => {
  return selectedRecipients.value.some(
    (r) => r.studentId === studentId && r.recipientType === recipientType,
  );
};

const toggleRecipient = (
  studentId: string,
  recipientType: 'madre' | 'padre',
  phoneNumber: string,
  studentData: StudentData,
) => {
  const existingIndex = selectedRecipients.value.findIndex(
    (r) => r.studentId === studentId && r.recipientType === recipientType,
  );

  if (existingIndex >= 0) {
    // Remove
    selectedRecipients.value.splice(existingIndex, 1);
  } else {
    // Add
    selectedRecipients.value.push({
      studentId,
      recipientType,
      phoneNumber,
      studentData,
    });
  }
};

const selectTemplate = (templateId: string) => {
  selectedTemplate.value = templateId;
  const template = getTemplatesForActiveTab().find((t) => t.id === templateId);
  if (template) {
    customMessage.value = template.content;
  }
};

const replaceVariables = (message: string, recipient: MessageDestination) => {
  const student = recipient.studentData;
  const parentType = recipient.recipientType === 'madre' ? 'Madre' : 'Padre';
  const studentName = `${student.nombre} ${student.apellido}`;
  const date = new Date().toLocaleDateString('es-ES');
  const academyName = 'Music Academy';

  return message
    .replace(/{studentName}/g, studentName)
    .replace(/{parentType}/g, parentType)
    .replace(/{date}/g, date)
    .replace(/{academyName}/g, academyName);
};

const fetchStudentsData = async () => {
  loading.value = true;
  try {
    await studentsStore.fetchStudents();
    
    // Get date range based on selected period
    const today = new Date();
    let startDate = new Date(today);
    
    switch (selectedPeriod.value) {
    case 'today':
      startDate = new Date(today);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(today.getDate() - 30);
      break;
    }

    // Mock data - In real implementation, get from attendance service
    // This should come from your attendance API/service
    const mockStudentsData = {
      ausentes: studentsStore.students.slice(0, 3).map((student) => ({
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        instrumento: student.instrumento || 'Piano',
        phoneNumbers: {
          madre: student.numero_telefono_madre,
          padre: student.numero_telefono_padre,
        },
        status: 'ausente' as const,
        absenceCount: Math.floor(Math.random() * 4) + 1,
        escalationLevel: Math.floor(Math.random() * 4) + 1,
      })),
      tarde: studentsStore.students.slice(3, 5).map((student) => ({
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        instrumento: student.instrumento || 'Guitarra',
        phoneNumbers: {
          madre: student.numero_telefono_madre,
          padre: student.numero_telefono_padre,
        },
        status: 'tarde' as const,
        time: '10:15 AM',
      })),
      justificado: studentsStore.students.slice(5, 7).map((student) => ({
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        instrumento: student.instrumento || 'Violín',
        phoneNumbers: {
          madre: student.numero_telefono_madre,
          padre: student.numero_telefono_padre,
        },
        status: 'justificado' as const,
        reason: 'Cita médica',
      })),
    };

    studentsData.value = mockStudentsData;
  } catch (error) {
    console.error('Error fetching students data:', error);
  } finally {
    loading.value = false;
  }
};

const sendMessages = async () => {
  if (getSelectedRecipients().length === 0) return;

  const recipients = getSelectedRecipients();
  
  // 🔍 VERIFICACIÓN COMPLETA DEL MENSAJE Y DESTINATARIOS
  console.log('🔍 Iniciando verificación de mensajes WhatsApp...');
  
  const verificationReport = WhatsAppMessageValidator.generateVerificationReport(
    recipients,
    customMessage.value || getPreviewMessage(),
    activeTab.value,
  );
  
  // Mostrar reporte completo en consola
  logVerificationReport(verificationReport);
  
  // Verificar si hay problemas críticos
  if (!verificationReport.canProceed) {
    const errorMsg = `❌ No se puede proceder con el envío:\n\n${verificationReport.recommendations.join('\n')}`;
    alert(errorMsg);
    return;
  }
  
  // Mostrar advertencias si las hay
  const allWarnings = [
    ...verificationReport.validations.phones.warnings,
    ...verificationReport.validations.message.warnings,
    ...verificationReport.validations.students.warnings,
  ];
  
  if (allWarnings.length > 0) {
    const warningMsg = `⚠️ Advertencias encontradas:\n\n${allWarnings.join('\n')}\n\n¿Desea continuar de todas formas?`;
    if (!confirm(warningMsg)) return;
  }
  
  // Confirmación final con detalles
  const finalMessage = `
📱 Confirmar envío de mensajes WhatsApp:

📊 Resumen:
• Tipo: ${activeTab.value.toUpperCase()}
• Destinatarios: ${recipients.length}
• Números válidos: ${verificationReport.validations.phones.valid.length}
• Estudiantes verificados: ${verificationReport.validations.students.correct.length}

📝 Vista previa del mensaje:
"${verificationReport.validations.message.processedMessage.substring(0, 200)}${verificationReport.validations.message.processedMessage.length > 200 ? '...' : ''}"

¿Confirma el envío?`;
  
  if (!confirm(finalMessage)) return;

  sending.value = true;
  try {
    // Group recipients by student ID for the notification service
    const studentIds = [...new Set(recipients.map((r) => r.studentId))];
    
    let result;
    
    switch (activeTab.value) {
    case 'ausentes':
      result = await notifyUnexcusedAbsences(studentIds);
      break;
    case 'tarde':
      result = await notifyLateStudents(studentIds);
      break;
    case 'justificado':
      result = await notifyJustifiedAbsences(studentIds);
      break;
    default:
      throw new Error('Tipo de notificación no válido');
    }

    emit('messagesSent', result);
    
    const successMsg = `✅ Mensajes enviados exitosamente!
    
📊 Resultados:
• Exitosos: ${result.success}
• Fallidos: ${result.failed}
• Total procesados: ${result.success + result.failed}

${result.failed > 0 ? '⚠️ Revise los logs para detalles de los envíos fallidos.' : '🎉 Todos los mensajes fueron enviados correctamente.'}`;
    
    alert(successMsg);
    
    if (result.success > 0) {
      close();
    }
  } catch (error) {
    console.error('Error sending messages:', error);
    alert(`❌ Error enviando mensajes: ${error.message || 'Error desconocido'}`);
  } finally {
    sending.value = false;
  }
};

const close = () => {
  emit('close');
  // Reset state
  selectedRecipients.value = [];
  selectedTemplate.value = '';
  customMessage.value = '';
  activeTab.value = 'ausentes';
};

// 📊 Función para cargar datos del reporte diario
const loadReportData = () => {
  if (!props.reportData) return;
  
  console.log('📊 [WhatsApp Modal] Cargando datos del reporte diario:', props.reportData);
  
  // Convertir datos del reporte al formato esperado por el modal
  const convertedData: any = {
    ausentes: [],
    tarde: [],
    justificado: [],
  };
  
  // Convertir ausencias sin justificar
  if (props.reportData.unjustifiedAbsences) {
    convertedData.ausentes = props.reportData.unjustifiedAbsences.map((student: any) => ({
      id: student.studentId || student.id,
      nombre: student.name || student.studentName,
      apellido: '',
      clase: student.className || '',
      instrumento: 'N/A',
      phoneNumbers: {
        madre: 'N/A', // Se obtendrá del store
        padre: 'N/A',  // Se obtendrá del store
      },
      absenceCount: student.absenceCount || 1,
    }));
  }
  
  // Convertir estudiantes tarde
  if (props.reportData.lateStudents) {
    convertedData.tarde = props.reportData.lateStudents.map((student: any) => ({
      id: student.studentId || student.id,
      nombre: student.name || student.studentName,
      apellido: '',
      clase: student.className || '',
      instrumento: 'N/A',
      phoneNumbers: {
        madre: 'N/A',
        padre: 'N/A',
      },
      lateTime: student.time,
    }));
  }
  
  // Convertir ausencias justificadas
  if (props.reportData.justifiedAbsences) {
    convertedData.justificado = props.reportData.justifiedAbsences.map((student: any) => ({
      id: student.studentId || student.id,
      nombre: student.name || student.studentName,
      apellido: '',
      clase: student.className || '',
      instrumento: 'N/A',
      phoneNumbers: {
        madre: 'N/A',
        padre: 'N/A',
      },
      reason: student.reason || '',
    }));
  }
  
  // Actualizar datos del modal
  studentsData.value = convertedData;
  
  // Cambiar a la pestaña inicial especificada
  if (props.initialTab) {
    activeTab.value = props.initialTab;
  }
  
  console.log('✅ [WhatsApp Modal] Datos del reporte cargados:', convertedData);
};

// Lifecycle
onMounted(async () => {
  await fetchStudentsData();
  
  // Si hay datos del reporte, cargarlos
  if (props.reportData) {
    loadReportData();
  }
  
  // Auto-select first template if available
  const templates = getTemplatesForActiveTab();
  if (templates.length > 0) {
    selectTemplate(templates[0].id);
  }
});

// 👀 Watcher para reaccionar cuando se abra el modal con nuevos datos
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue && props.reportData) {
      console.log('📊 [WhatsApp Modal] Modal abierto con datos del reporte');
      loadReportData();
    }
  },
);

// 📊 Watcher para cambios en los datos del reporte
watch(
  () => props.reportData,
  (newData) => {
    if (newData && props.isVisible) {
      console.log('📊 [WhatsApp Modal] Datos del reporte actualizados');
      loadReportData();
    }
  },
  { deep: true },
);
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
