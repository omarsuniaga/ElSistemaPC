<!-- src/modulos/Admin/components/modals/BulkWhatsAppModal.vue -->
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="closeModal">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4"
              >
                💬 Envío Masivo WhatsApp
              </DialogTitle>

              <div class="modal-content">
                <!-- Recipients Section -->
                <div class="recipients-section mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Destinatarios Seleccionados ({{ selectedStudents.length }})
                    </h4>
                    <div class="flex items-center space-x-2">
                      <span
                        class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                      >
                        {{ validPhoneNumbers }} números válidos
                      </span>
                      <button
                        class="text-blue-600 hover:text-blue-700 text-sm"
                        @click="showRecipientsList = !showRecipientsList"
                      >
                        {{ showRecipientsList ? "Ocultar" : "Ver Lista" }}
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="showRecipientsList"
                    class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto"
                  >
                    <div class="space-y-2">
                      <div
                        v-for="student in selectedStudents"
                        :key="student.id"
                        class="flex items-center justify-between text-xs"
                      >
                        <span class="text-gray-900 dark:text-gray-100">
                          {{ student.firstName }} {{ student.lastName }}
                        </span>
                        <div class="flex items-center space-x-2">
                          <span
                            :class="[
                              'px-2 py-1 rounded text-xs',
                              student.phone
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
                            ]"
                          >
                            {{ student.phone || "Sin teléfono" }}
                          </span>
                          <button
                            class="text-red-600 hover:text-red-800"
                            @click="removeRecipient(student.id)"
                          >
                            <XMarkIcon class="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Template Selection -->
                <div class="template-section mb-6">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plantilla de Mensaje
                  </label>
                  <select
                    v-model="selectedTemplate"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    @change="loadTemplate"
                  >
                    <option value="">Seleccionar plantilla...</option>
                    <option value="reminder">Recordatorio de Clase</option>
                    <option value="payment">Recordatorio de Pago</option>
                    <option value="celebration">Felicitación</option>
                    <option value="announcement">Anuncio</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <!-- WhatsApp Composer -->
                <div class="composer-section mb-6">
                  <div class="space-y-4">
                    <!-- Message -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Mensaje WhatsApp *
                        <span class="text-xs text-gray-500 ml-2">
                          ({{ messageLength }}/{{ maxLength }} caracteres)
                        </span>
                      </label>
                      <textarea
                        v-model="whatsappData.message"
                        :maxlength="maxLength"
                        rows="6"
                        placeholder="Escribe tu mensaje aquí...

Variables disponibles:
- {firstName}: Nombre del estudiante
- {lastName}: Apellido del estudiante
- {academyName}: Nombre de la academia
- {date}: Fecha actual
- {time}: Hora actual

📝 Tip: Los mensajes cortos y directos funcionan mejor en WhatsApp"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                        required
                      />
                      <div class="flex justify-between mt-1">
                        <div class="text-xs text-gray-500">
                          Variables: {firstName}, {lastName}, {academyName}, {date}, {time}
                        </div>
                        <div
                          :class="[
                            'text-xs',
                            messageLength > maxLength * 0.9 ? 'text-red-600' : 'text-gray-500',
                          ]"
                        >
                          {{ messageLength }}/{{ maxLength }}
                        </div>
                      </div>
                    </div>

                    <!-- Options -->
                    <div class="flex items-center space-x-4">
                      <label class="flex items-center">
                        <input
                          v-model="whatsappData.includeLink"
                          type="checkbox"
                          class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Incluir enlace a la academia
                        </span>
                      </label>

                      <label class="flex items-center">
                        <input
                          v-model="whatsappData.scheduleSend"
                          type="checkbox"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Programar envío
                        </span>
                      </label>
                    </div>

                    <!-- Scheduled Send -->
                    <div
                      v-if="whatsappData.scheduleSend"
                      class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                    >
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Fecha
                          </label>
                          <input
                            v-model="whatsappData.scheduleDate"
                            type="date"
                            :min="today"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Hora
                          </label>
                          <input
                            v-model="whatsappData.scheduleTime"
                            type="time"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Preview -->
                <div v-if="whatsappData.message" class="preview-section mb-6">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vista Previa WhatsApp
                  </h4>
                  <div
                    class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border-l-4 border-green-500"
                  >
                    <div class="whatsapp-preview">
                      <div class="flex items-center space-x-2 mb-2">
                        <div
                          class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <span class="text-white text-xs font-bold">A</span>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Academia Musical
                          </div>
                          <div class="text-xs text-gray-500">
                            {{
                              whatsappData.scheduleSend
                                ? `Programado: ${whatsappData.scheduleDate} ${whatsappData.scheduleTime}`
                                : "Ahora"
                            }}
                          </div>
                        </div>
                      </div>
                      <div class="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                        <div class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {{ previewMessage }}
                        </div>
                        <div class="text-xs text-gray-500 mt-2 text-right">
                          {{
                            new Date().toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          }}
                          ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Send Progress -->
                <div v-if="isSending" class="progress-section mb-6">
                  <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                      <div>
                        <div class="text-sm font-medium text-green-900 dark:text-green-100">
                          Enviando mensajes WhatsApp...
                        </div>
                        <div class="text-sm text-green-700 dark:text-green-300">
                          {{ sendProgress.sent }} de {{ sendProgress.total }} enviados
                        </div>
                      </div>
                    </div>
                    <div class="mt-2 bg-green-200 dark:bg-green-700 rounded-full h-2">
                      <div
                        class="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                        :style="{width: `${(sendProgress.sent / sendProgress.total) * 100}%`}"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600"
              >
                <button
                  :disabled="isSending"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="closeModal"
                >
                  Cancelar
                </button>
                <button
                  :disabled="!canSend || isSending"
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  @click="sendMessages"
                >
                  <ChatBubbleLeftRightIcon class="w-4 h-4" />
                  <span>
                    {{
                      isSending
                        ? "Enviando..."
                        : whatsappData.scheduleSend
                          ? "Programar Mensajes"
                          : `Enviar a ${validPhoneNumbers} números`
                    }}
                  </span>
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';

interface Student {
  id: string
  firstName: string
  lastName: string
  phone?: string
}

interface Props {
  isOpen: boolean
  selectedStudents: Student[]
}

interface WhatsAppData {
  message: string
  includeLink: boolean
  scheduleSend: boolean
  scheduleDate: string
  scheduleTime: string
}

interface SendProgress {
  sent: number
  total: number
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: []
  sent: [count: number]
}>();

// Constantes
const maxLength = 4096; // Límite de caracteres de WhatsApp
const today = new Date().toISOString().split('T')[0];

// Estado local
const showRecipientsList = ref(false);
const selectedTemplate = ref('');
const isSending = ref(false);
const sendProgress = ref<SendProgress>({ sent: 0, total: 0 });

const whatsappData = ref<WhatsAppData>({
  message: '',
  includeLink: false,
  scheduleSend: false,
  scheduleDate: today,
  scheduleTime: '09:00',
});

// Templates predefinidas
const templates = {
  reminder: {
    message: `Hola {firstName}! 👋

Te recordamos que tienes clase de música hoy.

📅 Fecha: {date}
🕐 Hora: {time}

¡No olvides traer tu instrumento! 🎵

{academyName}`,
  },
  payment: {
    message: `Hola {firstName}! 👋

Te recordamos que tienes un pago pendiente por tus clases de música.

💳 Por favor, regulariza tu situación lo antes posible.

Para cualquier consulta, contáctanos.

{academyName}`,
  },
  celebration: {
    message: `¡Felicitaciones {firstName}! 🎉🎵

Queremos felicitarte por tu excelente progreso en las clases de música.

¡Sigue así! Tu dedicación es inspiradora.

{academyName}`,
  },
  announcement: {
    message: `Hola {firstName}! 👋

Tenemos una novedad importante que queremos compartir contigo:

[Escribe aquí tu anuncio]

¡Gracias por ser parte de nuestra comunidad musical! 🎵

{academyName}`,
  },
};

// Computed
const validPhoneNumbers = computed(() => {
  return props.selectedStudents.filter((student) => student.phone).length;
});

const messageLength = computed(() => {
  return whatsappData.value.message.length;
});

const canSend = computed(() => {
  return (
    whatsappData.value.message.trim() &&
    validPhoneNumbers.value > 0 &&
    !isSending.value &&
    (!whatsappData.value.scheduleSend ||
      (whatsappData.value.scheduleDate && whatsappData.value.scheduleTime))
  );
});

const previewMessage = computed(() => {
  if (!whatsappData.value.message) return '';

  // Simular reemplazo de variables con el primer estudiante
  let preview = whatsappData.value.message;
  if (props.selectedStudents.length > 0) {
    const firstStudent = props.selectedStudents[0];
    preview = preview
      .replace(/{firstName}/g, firstStudent.firstName)
      .replace(/{lastName}/g, firstStudent.lastName)
      .replace(/{academyName}/g, 'Academia Musical')
      .replace(/{date}/g, new Date().toLocaleDateString())
      .replace(
        /{time}/g,
        new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      );
  }

  if (whatsappData.value.includeLink) {
    preview += '\n\n🌐 www.academia-musical.com';
  }

  return preview;
});

// Methods
const closeModal = () => {
  if (!isSending.value) {
    emit('close');
  }
};

const removeRecipient = (studentId: string) => {
  const updatedStudents = props.selectedStudents.filter((s) => s.id !== studentId);
  emit('close'); // Temporal - idealmente se actualizaría la lista sin cerrar
};

const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value as keyof typeof templates]) {
    const template = templates[selectedTemplate.value as keyof typeof templates];
    whatsappData.value.message = template.message;
  }
};

const sendMessages = async () => {
  if (!canSend.value) return;

  try {
    isSending.value = true;
    const studentsWithPhone = props.selectedStudents.filter((student) => student.phone);
    sendProgress.value = { sent: 0, total: studentsWithPhone.length };

    // Simular envío progresivo
    for (let i = 0; i < studentsWithPhone.length; i++) {
      const student = studentsWithPhone[i];

      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 800));

      // TODO: Implementar envío real de WhatsApp
      await sendWhatsAppToStudent(student);

      sendProgress.value.sent++;
    }

    // Éxito
    emit('sent', studentsWithPhone.length);

    // Limpiar formulario
    whatsappData.value = {
      message: '',
      includeLink: false,
      scheduleSend: false,
      scheduleDate: today,
      scheduleTime: '09:00',
    };
    selectedTemplate.value = '';

    closeModal();
  } catch (error) {
    console.error('Error enviando mensajes WhatsApp:', error);
    // TODO: Mostrar error al usuario
  } finally {
    isSending.value = false;
    sendProgress.value = { sent: 0, total: 0 };
  }
};

const sendWhatsAppToStudent = async (student: Student) => {
  // TODO: Implementar envío real usando WhatsApp Business API
  console.log(`Enviando WhatsApp a ${student.phone}:`, {
    message: whatsappData.value.message
      .replace(/{firstName}/g, student.firstName)
      .replace(/{lastName}/g, student.lastName)
      .replace(/{academyName}/g, 'Academia Musical')
      .replace(/{date}/g, new Date().toLocaleDateString())
      .replace(
        /{time}/g,
        new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      ),
    scheduleSend: whatsappData.value.scheduleSend,
    scheduleDateTime: whatsappData.value.scheduleSend
      ? `${whatsappData.value.scheduleDate} ${whatsappData.value.scheduleTime}`
      : null,
  });
};

// Watchers
watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) {
      // Reset al cerrar
      showRecipientsList.value = false;
      selectedTemplate.value = '';
      if (!isSending.value) {
        whatsappData.value = {
          message: '',
          includeLink: false,
          scheduleSend: false,
          scheduleDate: today,
          scheduleTime: '09:00',
        };
      }
    }
  },
);
</script>

<style scoped>
.whatsapp-preview {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
</style>
