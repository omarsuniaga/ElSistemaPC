<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
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
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900 dark:text-white"
              >
                Compartir Clase: {{ classData.name }}
              </DialogTitle>

              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un maestro para invitar a gestionar esta clase. El maestro invitado
                  podrá tomar asistencia y añadir observaciones según los permisos que asignes.
                </p>
              </div>

              <!-- Selector de maestro -->
              <div class="mt-4">
                <label
                  for="teacher-select"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Seleccionar Maestro
                </label>
                <select
                  id="teacher-select"
                  v-model="selectedTeacherId"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  :disabled="isLoading"
                >
                  <option value="">Selecciona un maestro...</option>
                  <option
                    v-for="teacher in availableTeachers"
                    :key="teacher.id"
                    :value="teacher.id"
                  >
                    {{ teacher.name }} ({{ teacher.email }})
                  </option>
                </select>
              </div>

              <!-- Permisos -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permisos del Maestro Asistente
                </label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      v-model="permissions.canTakeAttendance"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Puede tomar asistencia
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="permissions.canAddObservations"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Puede añadir observaciones
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="permissions.canViewAttendanceHistory"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Puede ver historial de asistencia
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="permissions.canViewObservations"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Puede ver observaciones
                    </span>
                  </label>
                </div>
              </div>

              <!-- Error message -->
              <div
                v-if="error"
                class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md"
              >
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
              </div>

              <!-- Botones -->
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  :disabled="isLoading"
                  @click="$emit('close')"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:bg-gray-400"
                  :disabled="!selectedTeacherId || isLoading"
                  @click="handleInvite"
                >
                  <span v-if="isLoading" class="inline-flex items-center">
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Enviando...
                  </span>
                  <span v-else>Enviar Invitación</span>
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
import {ref, computed, onMounted} from "vue"
import {Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot} from "@headlessui/vue"
import {useTeachersStore} from "../store/teachers"
import {useTeacherCollaboration} from "../../Classes/composables/useTeacherCollaboration"
import {useAuthStore} from "../../../stores/auth"

interface Props {
  show: boolean
  classData: {
    id: string
    name: string
    teacherId: string
  }
}

interface Emits {
  (e: "close"): void
  (e: "invitation-sent"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Stores y composables
const teachersStore = useTeachersStore()
const authStore = useAuthStore()
const {inviteAssistant} = useTeacherCollaboration()

// Estado
const selectedTeacherId = ref("")
const isLoading = ref(false)
const error = ref("")

// Permisos por defecto
const permissions = ref({
  canTakeAttendance: true,
  canAddObservations: true,
  canViewAttendanceHistory: false,
  canViewObservations: true,
})

// Computed
const availableTeachers = computed(() => {
  return teachersStore.teachers.filter(
    (teacher) =>
      teacher.id !== props.classData.teacherId && // No incluir al maestro actual
      teacher.id !== authStore.user?.uid // No incluirse a sí mismo
  )
})

// Métodos
const handleInvite = async () => {
  if (!selectedTeacherId.value) {
    error.value = "Por favor selecciona un maestro"
    return
  }

  isLoading.value = true
  error.value = ""

  try {
    await inviteAssistant({
      classId: props.classData.id,
      teacherId: selectedTeacherId.value,
      permissions: permissions.value,
    })

    console.log("Invitación enviada correctamente")

    emit("invitation-sent")
    emit("close")

    // Limpiar formulario
    selectedTeacherId.value = ""
    permissions.value = {
      canTakeAttendance: true,
      canAddObservations: true,
      canViewAttendanceHistory: false,
      canViewObservations: true,
    }
  } catch (err: any) {
    error.value = err.message || "Error al enviar la invitación"
    console.error("Error al enviar invitación:", err)
  } finally {
    isLoading.value = false
  }
}

// Cargar maestros al montar el componente
onMounted(async () => {
  if (teachersStore.teachers.length === 0) {
    await teachersStore.fetchTeachers()
  }
})
</script>
