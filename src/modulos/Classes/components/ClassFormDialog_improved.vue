<template>
  <TransitionRoot :show="open" as="template">
    <Dialog :open="open" as="div" class="relative z-50" @close="handleClose">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <!-- Modal Container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
              <!-- Header -->
              <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div class="flex items-center justify-between">
                  <DialogTitle as="h3" class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ isEditing ? "Editar Clase" : "Crear Nueva Clase" }}
                  </DialogTitle>
                  <button
                    type="button"
                    class="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    @click="handleClose"
                  >
                    <span class="sr-only">Cerrar</span>
                    <XMarkIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="max-h-[calc(100vh-8rem)] overflow-y-auto">
                <form @submit.prevent="handleSubmit" class="px-6 py-4">
                  <!-- Basic Information Section -->
                  <div class="mb-8">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Información Básica
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Class Name -->
                      <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre de la clase <span class="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          v-model="classForm.name"
                          type="text"
                          required
                          class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                          placeholder="Ej: Piano Intermedio A"
                        />
                      </div>

                      <!-- Instrument -->
                      <div>
                        <label for="instrument" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Instrumento <span class="text-red-500">*</span>
                        </label>
                        <select
                          id="instrument"
                          v-model="classForm.instrument"
                          required
                          class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                        >
                          <option value="">Seleccionar instrumento</option>
                          <option value="piano">Piano</option>
                          <option value="guitarra">Guitarra</option>
                          <option value="violin">Violín</option>
                          <option value="flauta">Flauta</option>
                          <option value="canto">Canto</option>
                          <option value="bateria">Batería</option>
                          <option value="bajo">Bajo</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>

                      <!-- Level -->
                      <div>
                        <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nivel <span class="text-red-500">*</span>
                        </label>
                        <select
                          id="level"
                          v-model="classForm.level"
                          required
                          class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                        >
                          <option value="">Seleccionar nivel</option>
                          <option value="principiante">Principiante</option>
                          <option value="intermedio">Intermedio</option>
                          <option value="avanzado">Avanzado</option>
                          <option value="profesional">Profesional</option>
                        </select>
                      </div>

                      <!-- Capacity -->
                      <div>
                        <label for="capacity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Capacidad máxima
                        </label>
                        <input
                          id="capacity"
                          v-model.number="classForm.capacity"
                          type="number"
                          min="1"
                          max="50"
                          class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                          placeholder="8"
                        />
                      </div>
                    </div>

                    <!-- Description -->
                    <div class="mt-4">
                      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        v-model="classForm.description"
                        rows="3"
                        class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                        placeholder="Descripción de la clase, objetivos, contenido..."
                      />
                    </div>
                  </div>

                  <!-- Teachers Section -->
                  <div class="mb-8">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Profesores
                    </h4>
                    
                    <!-- Main Teacher -->
                    <div class="mb-4">
                      <label for="teacherId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profesor Principal <span class="text-red-500">*</span>
                      </label>
                      <select
                        id="teacherId"
                        v-model="classForm.teacherId"
                        required
                        class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                      >
                        <option value="">Seleccionar profesor principal</option>
                        <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                          {{ teacher.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Shared Teachers -->
                    <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profesores Colaboradores
                      </label>
                      <div class="space-y-2">
                        <div
                          v-for="teacher in availableSharedTeachers"
                          :key="teacher.id"
                          class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div class="flex items-center">
                            <input
                              :id="`shared-teacher-${teacher.id}`"
                              v-model="classForm.sharedWith"
                              type="checkbox"
                              :value="teacher.id"
                              class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                            />
                            <label :for="`shared-teacher-${teacher.id}`" class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ teacher.name }}
                            </label>
                          </div>
                          
                          <!-- Permission Level -->
                          <div v-if="classForm.sharedWith.includes(teacher.id)" class="ml-4">
                            <select
                              v-model="classForm.permissions[teacher.id]"
                              class="text-xs rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                              @change="updateTeacherPermission(teacher.id, $event.target.value)"
                            >
                              <option value="read">Lectura</option>
                              <option value="write">Escritura</option>
                              <option value="manage">Administración</option>
                            </select>
                          </div>
                        </div>
                        
                        <div v-if="availableSharedTeachers.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                          No hay otros profesores disponibles para colaborar
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Schedule Section -->
                  <div class="mb-8">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Horarios
                    </h4>
                    
                    <div class="space-y-4">
                      <div
                        v-for="(schedule, index) in classForm.schedules"
                        :key="index"
                        class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <!-- Day -->
                          <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Día de la semana
                            </label>
                            <select
                              v-model="schedule.day"
                              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                            >
                              <option value="">Seleccionar día</option>
                              <option value="lunes">Lunes</option>
                              <option value="martes">Martes</option>
                              <option value="miercoles">Miércoles</option>
                              <option value="jueves">Jueves</option>
                              <option value="viernes">Viernes</option>
                              <option value="sabado">Sábado</option>
                              <option value="domingo">Domingo</option>
                            </select>
                          </div>

                          <!-- Start Time -->
                          <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Hora de inicio
                            </label>
                            <input
                              v-model="schedule.startTime"
                              type="time"
                              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                            />
                          </div>

                          <!-- End Time -->
                          <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Hora de fin
                            </label>
                            <input
                              v-model="schedule.endTime"
                              type="time"
                              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                            />
                          </div>

                          <!-- Remove Button -->
                          <div>
                            <button
                              v-if="classForm.schedules.length > 1"
                              type="button"
                              class="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-600 dark:text-red-400 dark:bg-gray-700 dark:hover:bg-red-900/20 transition-colors"
                              @click="removeScheduleSlot(index)"
                            >
                              <XMarkIcon class="h-4 w-4 mr-1" />
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <!-- Schedule Validation Message -->
                        <div v-if="!isValidSchedule(schedule)" class="mt-2 text-sm text-red-600 dark:text-red-400">
                          <div class="flex items-center">
                            <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            {{ getScheduleErrorMessage(schedule) }}
                          </div>
                        </div>
                      </div>

                      <!-- Add Schedule Button -->
                      <button
                        type="button"
                        class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        @click="addScheduleSlot"
                      >
                        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar otro horario
                      </button>
                    </div>
                  </div>

                  <!-- Students Section -->
                  <div class="mb-8">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Estudiantes
                    </h4>
                    
                    <!-- Search Input -->
                    <div class="relative mb-4">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        v-model="studentSearchTerm"
                        type="text"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                        placeholder="Buscar estudiantes por nombre, apellido o instrumento..."
                      />
                    </div>

                    <!-- Students List -->
                    <div class="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-64 overflow-y-auto">
                      <!-- Loading State -->
                      <div v-if="loading.students" class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando estudiantes...</span>
                      </div>

                      <!-- Empty State -->
                      <div v-else-if="filteredStudents.length === 0" class="text-center py-8">
                        <div class="text-gray-500 dark:text-gray-400">
                          <svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M34 34l-1.5-1.5m0 0A12 12 0 1014 14a12 12 0 0018.5 18.5z" />
                          </svg>
                          <p class="text-sm">
                            {{ students.length === 0 ? 'No hay estudiantes disponibles' : 'No se encontraron estudiantes' }}
                          </p>
                        </div>
                      </div>

                      <!-- Students List -->
                      <div v-else class="divide-y divide-gray-200 dark:divide-gray-600">
                        <div
                          v-for="student in filteredStudents"
                          :key="student.id"
                          class="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <input
                            :id="`student-${student.id}`"
                            v-model="classForm.studentIds"
                            type="checkbox"
                            :value="student.id"
                            class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                          />
                          <label
                            :for="`student-${student.id}`"
                            class="ml-3 flex-1 cursor-pointer"
                          >
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ student.nombre }} {{ student.apellido }}
                            </div>
                            <div v-if="student.instrumento" class="text-xs text-gray-500 dark:text-gray-400">
                              {{ student.instrumento }}
                            </div>
                          </label>
                        </div>
                      </div>

                      <!-- Selected Count -->
                      <div v-if="classForm.studentIds.length > 0" class="border-t border-gray-200 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-600">
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                          {{ classForm.studentIds.length }} estudiante{{ classForm.studentIds.length !== 1 ? 's' : '' }} seleccionado{{ classForm.studentIds.length !== 1 ? 's' : '' }}
                          <span v-if="classForm.capacity && classForm.studentIds.length > classForm.capacity" class="text-red-500">
                            (Excede la capacidad máxima de {{ classForm.capacity }})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Form Validation Messages -->
                  <div v-if="validationErrors.length > 0" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div class="flex">
                      <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                      <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                          Por favor, corrige los siguientes errores:
                        </h3>
                        <ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                          <li v-for="error in validationErrors" :key="error">
                            {{ error }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Footer -->
              <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    <span class="text-red-500">*</span> Campos obligatorios
                  </div>
                  <div class="flex items-center space-x-3">
                    <button
                      type="button"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      @click="handleClose"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      :disabled="!isFormValid || saving"
                      class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      @click="handleSubmit"
                    >
                      <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Clase') }}
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { debounce } from "lodash-es"
import { Dialog, DialogPanel, TransitionRoot, TransitionChild, DialogTitle } from "@headlessui/vue"
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useTeachersStore } from "../../Teachers/store/teachers"
import { useStudentsStore } from "../../Students/store/students"
import { useNotification } from "@/composables/useNotification"
import type { ClassData } from "../types/class"

// Props
interface Props {
  open: boolean
  classData?: ClassData | null
}

const props = withDefaults(defineProps<Props>(), {
  classData: null
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Partial<ClassData>): void
}>()

// Stores and Composables
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const { showNotification } = useNotification()

// State
const saving = ref(false)
const studentSearchTerm = ref("")

// Data Loading State
const teachers = ref<any[]>([])
const students = ref<any[]>([])
const loading = ref({
  teachers: false,
  students: false,
})

// Schedule Interface
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

// Form Data Interface
interface ClassFormData {
  name: string
  instrument: string
  level: string
  status: "active" | "inactive" | "suspended"
  description: string
  capacity: number
  teacherId: string
  studentIds: string[]
  sharedWith: string[]
  permissions: Record<string, string[]>
  schedules: ScheduleSlot[]
}

// Form State
const classForm = ref<ClassFormData>({
  name: "",
  instrument: "",
  level: "",
  status: "active",
  description: "",
  capacity: 8,
  teacherId: "",
  studentIds: [],
  sharedWith: [],
  permissions: {},
  schedules: [{ day: "", startTime: "", endTime: "" }],
})

// Computed Properties
const isEditing = computed(() => !!props.classData?.id)

const availableSharedTeachers = computed(() =>
  teachers.value.filter((teacher) => teacher.id !== classForm.value.teacherId)
)

// Enhanced validation with detailed error messages
const validationErrors = computed(() => {
  const errors: string[] = []
  
  if (!classForm.value.name.trim()) {
    errors.push("El nombre de la clase es obligatorio")
  }
  
  if (!classForm.value.instrument) {
    errors.push("Debe seleccionar un instrumento")
  }
  
  if (!classForm.value.level) {
    errors.push("Debe seleccionar un nivel")
  }
  
  if (!classForm.value.teacherId) {
    errors.push("Debe seleccionar un profesor principal")
  }
  
  // Validate schedules
  const hasValidSchedule = classForm.value.schedules.some(schedule => 
    schedule.day && schedule.startTime && schedule.endTime && 
    schedule.startTime < schedule.endTime
  )
  
  if (!hasValidSchedule) {
    errors.push("Debe agregar al menos un horario válido")
  }
  
  // Check for invalid schedules
  const invalidSchedules = classForm.value.schedules.filter(schedule => 
    schedule.day && schedule.startTime && schedule.endTime && 
    schedule.startTime >= schedule.endTime
  )
  
  if (invalidSchedules.length > 0) {
    errors.push("Algunos horarios tienen hora de inicio posterior a la de fin")
  }
  
  // Check capacity
  if (classForm.value.capacity && classForm.value.studentIds.length > classForm.value.capacity) {
    errors.push(`Se han seleccionado más estudiantes (${classForm.value.studentIds.length}) que la capacidad máxima (${classForm.value.capacity})`)
  }
  
  return errors
})

const isFormValid = computed(() => validationErrors.value.length === 0)

// Student filtering with improved search
const filteredStudents = computed(() => {
  if (!studentSearchTerm.value.trim()) {
    return students.value
  }
  
  const searchTerms = studentSearchTerm.value.toLowerCase().split(' ').filter(term => term.length > 0)
  
  return students.value.filter(student => {
    const searchText = `${student.nombre || ''} ${student.apellido || ''} ${student.instrumento || ''}`.toLowerCase()
    return searchTerms.every(term => searchText.includes(term))
  })
})

// Schedule validation helpers
const isValidSchedule = (schedule: ScheduleSlot): boolean => {
  if (!schedule.day || !schedule.startTime || !schedule.endTime) {
    return false
  }
  return schedule.startTime < schedule.endTime
}

const getScheduleErrorMessage = (schedule: ScheduleSlot): string => {
  if (!schedule.day) return "Seleccione un día"
  if (!schedule.startTime) return "Ingrese la hora de inicio"
  if (!schedule.endTime) return "Ingrese la hora de fin"
  if (schedule.startTime >= schedule.endTime) return "La hora de inicio debe ser anterior a la hora de fin"
  return ""
}

// Schedule management
const addScheduleSlot = () => {
  classForm.value.schedules.push({
    day: "",
    startTime: "",
    endTime: "",
  })
}

const removeScheduleSlot = (index: number) => {
  if (classForm.value.schedules.length > 1) {
    classForm.value.schedules.splice(index, 1)
  }
}

// Permission management
const updateTeacherPermission = (teacherId: string, permissionLevel: string) => {
  switch (permissionLevel) {
    case "read":
      classForm.value.permissions[teacherId] = ["read"]
      break
    case "write":
      classForm.value.permissions[teacherId] = ["read", "write"]
      break
    case "manage":
      classForm.value.permissions[teacherId] = ["read", "write", "manage"]
      break
    default:
      classForm.value.permissions[teacherId] = ["read"]
  }
}

// Form submission
const handleSubmit = async () => {
  if (!isFormValid.value || saving.value) {
    showNotification("Por favor corrige los errores en el formulario", "warning")
    return
  }

  saving.value = true
  await nextTick()

  try {
    const now = new Date()
    
    // Prepare class data
    const classData: Partial<ClassData> = {
      name: classForm.value.name.trim(),
      description: classForm.value.description.trim(),
      teacherId: classForm.value.teacherId,
      studentIds: classForm.value.studentIds,
      sharedWith: classForm.value.sharedWith,
      status: classForm.value.status,
      // Convert schedules to the format expected by the parent component
      schedule: classForm.value.schedules.find(s => s.day && s.startTime && s.endTime) ? {
        day: classForm.value.schedules[0].day,
        startTime: classForm.value.schedules[0].startTime,
        endTime: classForm.value.schedules[0].endTime,
      } : undefined,
      updatedAt: now,
    }

    // Add metadata based on form fields
    if (classForm.value.instrument) {
      classData.description = `${classData.description}\nInstrumento: ${classForm.value.instrument}\nNivel: ${classForm.value.level}`.trim()
    }

    // If editing, preserve ID and creation date
    if (isEditing.value && props.classData?.id) {
      classData.id = props.classData.id
      classData.createdAt = props.classData.createdAt
    } else {
      classData.createdAt = now
    }

    // Emit save event
    emit("save", classData)

    showNotification(
      isEditing.value ? "Clase actualizada correctamente" : "Clase creada correctamente",
      "success"
    )

    emit("close")
  } catch (error) {
    console.error("Error al guardar la clase:", error)
    showNotification(
      "Error al guardar la clase. Por favor, inténtalo de nuevo.",
      "error"
    )
  } finally {
    saving.value = false
  }
}

// Form reset
const resetForm = () => {
  classForm.value = {
    name: "",
    instrument: "",
    level: "",
    status: "active",
    description: "",
    capacity: 8,
    teacherId: "",
    studentIds: [],
    sharedWith: [],
    permissions: {},
    schedules: [{ day: "", startTime: "", endTime: "" }],
  }
  studentSearchTerm.value = ""
}

// Event handlers
const handleClose = () => {
  if (!saving.value) {
    emit('close')
  }
}

// Data loading
onMounted(async () => {
  try {
    loading.value.teachers = true
    loading.value.students = true

    await Promise.all([
      teachersStore.fetchTeachers().then(data => {
        teachers.value = data || teachersStore.teachers
      }),
      studentsStore.fetchStudents().then(data => {
        students.value = data || studentsStore.students
      }),
    ])

    // Load class data if editing
    if (props.classData) {
      populateFormWithClassData(props.classData)
    }
  } catch (error) {
    console.error("Error loading data:", error)
    showNotification("Error al cargar los datos. Por favor, intenta nuevamente.", "error")
  } finally {
    loading.value.teachers = false
    loading.value.students = false
  }
})

// Helper function to populate form with class data
const populateFormWithClassData = (classData: ClassData) => {
  classForm.value = {
    name: classData.name || "",
    instrument: extractInstrumentFromDescription(classData.description || ""),
    level: extractLevelFromDescription(classData.description || ""),
    status: classData.status || "active",
    description: cleanDescription(classData.description || ""),
    capacity: 8, // Default capacity
    teacherId: classData.teacherId || "",
    studentIds: classData.studentIds || [],
    sharedWith: classData.sharedWith || [],
    permissions: {},
    schedules: classData.schedule ? [{
      day: classData.schedule.day,
      startTime: classData.schedule.startTime,
      endTime: classData.schedule.endTime,
    }] : [{ day: "", startTime: "", endTime: "" }],
  }
  
  // Set default permissions for shared teachers
  classData.sharedWith?.forEach(teacherId => {
    classForm.value.permissions[teacherId] = ["read"]
  })
}

// Helper functions for extracting data from description
const extractInstrumentFromDescription = (description: string): string => {
  const match = description.match(/Instrumento:\s*([^\n]+)/i)
  return match ? match[1].trim() : ""
}

const extractLevelFromDescription = (description: string): string => {
  const match = description.match(/Nivel:\s*([^\n]+)/i)
  return match ? match[1].trim() : ""
}

const cleanDescription = (description: string): string => {
  return description
    .replace(/Instrumento:\s*[^\n]+\n?/gi, "")
    .replace(/Nivel:\s*[^\n]+\n?/gi, "")
    .trim()
}

// Watch for changes in shared teachers to manage permissions
watch(
  () => classForm.value.sharedWith,
  (newSharedWith, oldSharedWith) => {
    // Remove permissions for teachers no longer shared
    if (oldSharedWith) {
      oldSharedWith.forEach(teacherId => {
        if (!newSharedWith.includes(teacherId)) {
          delete classForm.value.permissions[teacherId]
        }
      })
    }

    // Add default permissions for new shared teachers
    newSharedWith.forEach(teacherId => {
      if (!classForm.value.permissions[teacherId]) {
        classForm.value.permissions[teacherId] = ["read"]
      }
    })
  },
  { deep: true }
)

// Watch for classData changes
watch(
  () => props.classData,
  (classData) => {
    if (classData) {
      populateFormWithClassData(classData)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* Custom scrollbar for the modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(156 163 175);
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99);
}

/* Focus ring improvements */
.focus\:ring-indigo-500:focus {
  --tw-ring-color: rgb(99 102 241);
}

.dark .focus\:ring-indigo-400:focus {
  --tw-ring-color: rgb(129 140 248);
}
</style>
