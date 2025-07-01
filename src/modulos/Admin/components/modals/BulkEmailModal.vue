<!-- src/modulos/Admin/components/modals/BulkEmailModal.vue -->
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
                📧 Envío Masivo de Emails
              </DialogTitle>

              <div class="modal-content">
                <!-- Recipients Section -->
                <div class="recipients-section mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Destinatarios Seleccionados ({{ selectedStudents.length }})
                    </h4>
                    <button
                      class="text-blue-600 hover:text-blue-700 text-sm"
                      @click="showRecipientsList = !showRecipientsList"
                    >
                      {{ showRecipientsList ? "Ocultar" : "Ver Lista" }}
                    </button>
                  </div>

                  <div
                    v-if="showRecipientsList"
                    class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto"
                  >
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="student in selectedStudents"
                        :key="student.id"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        {{ student.firstName }} {{ student.lastName }}
                        <button
                          class="ml-1 text-blue-600 hover:text-blue-800"
                          @click="removeRecipient(student.id)"
                        >
                          <XMarkIcon class="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Template Selection -->
                <div class="template-section mb-6">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plantilla de Email
                  </label>
                  <select
                    v-model="selectedTemplate"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    @change="loadTemplate"
                  >
                    <option value="">Seleccionar plantilla...</option>
                    <option value="welcome">Bienvenida</option>
                    <option value="reminder">Recordatorio de Clase</option>
                    <option value="payment">Recordatorio de Pago</option>
                    <option value="announcement">Anuncio General</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <!-- Email Composer -->
                <div class="composer-section mb-6">
                  <div class="grid grid-cols-1 gap-4">
                    <!-- Subject -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Asunto *
                      </label>
                      <input
                        v-model="emailData.subject"
                        type="text"
                        placeholder="Ingrese el asunto del email..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <!-- Message -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Mensaje *
                      </label>
                      <textarea
                        v-model="emailData.message"
                        rows="8"
                        placeholder="Escriba su mensaje aquí... 

Puede usar las siguientes variables:
- {firstName}: Nombre del estudiante
- {lastName}: Apellido del estudiante
- {academyName}: Nombre de la academia
- {date}: Fecha actual"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                        required
                      />
                    </div>

                    <!-- Options -->
                    <div class="flex items-center space-x-4">
                      <label class="flex items-center">
                        <input
                          v-model="emailData.sendCopy"
                          type="checkbox"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Enviarme una copia
                        </span>
                      </label>

                      <label class="flex items-center">
                        <input
                          v-model="emailData.highPriority"
                          type="checkbox"
                          class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Alta prioridad
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Preview -->
                <div v-if="emailData.subject && emailData.message" class="preview-section mb-6">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vista Previa
                  </h4>
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                    <div class="email-preview">
                      <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Para:</strong> {{ selectedStudents.length }} destinatarios
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Asunto:</strong> {{ emailData.subject }}
                      </div>
                      <div class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {{ previewMessage }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Send Progress -->
                <div v-if="isSending" class="progress-section mb-6">
                  <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      <div>
                        <div class="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Enviando emails...
                        </div>
                        <div class="text-sm text-blue-700 dark:text-blue-300">
                          {{ sendProgress.sent }} de {{ sendProgress.total }} enviados
                        </div>
                      </div>
                    </div>
                    <div class="mt-2 bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                      <div
                        class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
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
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  @click="sendEmails"
                >
                  <PaperAirplaneIcon class="w-4 h-4" />
                  <span>{{
                    isSending ? "Enviando..." : `Enviar a ${selectedStudents.length} estudiantes`
                  }}</span>
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
import {ref, computed, watch} from "vue"
import {Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot} from "@headlessui/vue"
import {XMarkIcon, PaperAirplaneIcon} from "@heroicons/vue/24/outline"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Props {
  isOpen: boolean
  selectedStudents: Student[]
}

interface EmailData {
  subject: string
  message: string
  sendCopy: boolean
  highPriority: boolean
}

interface SendProgress {
  sent: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  sent: [count: number]
}>()

// Estado local
const showRecipientsList = ref(false)
const selectedTemplate = ref("")
const isSending = ref(false)
const sendProgress = ref<SendProgress>({sent: 0, total: 0})

const emailData = ref<EmailData>({
  subject: "",
  message: "",
  sendCopy: false,
  highPriority: false,
})

// Templates predefinidas
const templates = {
  welcome: {
    subject: "Bienvenido/a a la Academia Musical",
    message: `Estimado/a {firstName},

¡Bienvenido/a a nuestra Academia Musical! Estamos emocionados de tenerte como parte de nuestra comunidad musical.

En los próximos días recibirás más información sobre tus clases y horarios.

¡Que disfrutes tu viaje musical!

Saludos cordiales,
{academyName}`,
  },
  reminder: {
    subject: "Recordatorio: Tu clase de música",
    message: `Hola {firstName},

Este es un recordatorio amigable sobre tu próxima clase de música.

No olvides traer tu instrumento y materiales de estudio.

¡Te esperamos!

{academyName}`,
  },
  payment: {
    subject: "Recordatorio de Pago - Academia Musical",
    message: `Estimado/a {firstName},

Te recordamos que tienes un pago pendiente por tus clases de música.

Por favor, ponte en contacto con nosotros para regularizar tu situación.

Gracias por tu comprensión.

{academyName}`,
  },
  announcement: {
    subject: "Anuncio Important - Academia Musical",
    message: `Estimado/a {firstName},

Queremos informarte sobre una novedad importante en nuestra academia.

[Escribe aquí tu anuncio]

¡Gracias por ser parte de nuestra comunidad!

{academyName}`,
  },
}

// Computed
const canSend = computed(() => {
  return (
    emailData.value.subject.trim() &&
    emailData.value.message.trim() &&
    props.selectedStudents.length > 0 &&
    !isSending.value
  )
})

const previewMessage = computed(() => {
  if (!emailData.value.message) return ""

  // Simular reemplazo de variables con el primer estudiante
  let preview = emailData.value.message
  if (props.selectedStudents.length > 0) {
    const firstStudent = props.selectedStudents[0]
    preview = preview
      .replace(/{firstName}/g, firstStudent.firstName)
      .replace(/{lastName}/g, firstStudent.lastName)
      .replace(/{academyName}/g, "Academia Musical")
      .replace(/{date}/g, new Date().toLocaleDateString())
  }

  return preview
})

// Methods
const closeModal = () => {
  if (!isSending.value) {
    emit("close")
  }
}

const removeRecipient = (studentId: string) => {
  const updatedStudents = props.selectedStudents.filter((s) => s.id !== studentId)
  emit("close") // Temporal - idealmente se actualizaría la lista sin cerrar
}

const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value as keyof typeof templates]) {
    const template = templates[selectedTemplate.value as keyof typeof templates]
    emailData.value.subject = template.subject
    emailData.value.message = template.message
  }
}

const sendEmails = async () => {
  if (!canSend.value) return

  try {
    isSending.value = true
    sendProgress.value = {sent: 0, total: props.selectedStudents.length}

    // Simular envío progresivo
    for (let i = 0; i < props.selectedStudents.length; i++) {
      const student = props.selectedStudents[i]

      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 500))

      // TODO: Implementar envío real del email
      await sendEmailToStudent(student)

      sendProgress.value.sent++
    }

    // Éxito
    emit("sent", props.selectedStudents.length)

    // Limpiar formulario
    emailData.value = {
      subject: "",
      message: "",
      sendCopy: false,
      highPriority: false,
    }
    selectedTemplate.value = ""

    closeModal()
  } catch (error) {
    console.error("Error enviando emails:", error)
    // TODO: Mostrar error al usuario
  } finally {
    isSending.value = false
    sendProgress.value = {sent: 0, total: 0}
  }
}

const sendEmailToStudent = async (student: Student) => {
  // TODO: Implementar envío real usando un servicio de email
  console.log(`Enviando email a ${student.email}:`, {
    subject: emailData.value.subject,
    message: emailData.value.message
      .replace(/{firstName}/g, student.firstName)
      .replace(/{lastName}/g, student.lastName)
      .replace(/{academyName}/g, "Academia Musical")
      .replace(/{date}/g, new Date().toLocaleDateString()),
  })
}

// Watchers
watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) {
      // Reset al cerrar
      showRecipientsList.value = false
      selectedTemplate.value = ""
      if (!isSending.value) {
        emailData.value = {
          subject: "",
          message: "",
          sendCopy: false,
          highPriority: false,
        }
      }
    }
  }
)
</script>

<style scoped>
.email-preview {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
</style>
