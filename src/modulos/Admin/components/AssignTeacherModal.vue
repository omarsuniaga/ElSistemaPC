<template>
  <div
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="handleBackdropClick"
  >
    <div
      class="relative top-10 mx-auto p-6 border max-w-3xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Asignar Maestro a Clase</h3>
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          @click="$emit('close')"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Form -->
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Step Indicator -->
        <div class="flex items-center justify-center mb-8">
          <div class="flex items-center space-x-4">
            <div v-for="(step, index) in steps" :key="step.id" class="flex items-center">
              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                  :class="getStepClasses(index)"
                >
                  <CheckIcon v-if="currentStep > index" class="w-4 h-4 text-white" />
                  <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
                </div>
                <span
                  class="text-sm font-medium"
                  :class="
                    currentStep >= index
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ step.title }}
                </span>
              </div>
              <div
                v-if="index < steps.length - 1"
                class="w-12 h-0.5 bg-gray-300 dark:bg-gray-600 mx-4"
              />
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="min-h-[400px]">
          <!-- Step 1: Select Class -->
          <div v-if="currentStep === 0" class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Seleccionar Clase
            </h4>

            <!-- Class Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Clase
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  v-model="classSearch"
                  type="text"
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar por nombre de clase..."
                />
              </div>
            </div>

            <!-- Filter Options -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  v-model="filters.category"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todas las categorías</option>
                  <option value="piano">Piano</option>
                  <option value="violin">Violín</option>
                  <option value="guitar">Guitarra</option>
                  <option value="voice">Canto</option>
                  <option value="drums">Batería</option>
                  <option value="theory">Teoría Musical</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel
                </label>
                <select
                  v-model="filters.level"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos los niveles</option>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  v-model="filters.status"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="without-teacher">Sin maestro</option>
                  <option value="with-teacher">Con maestro</option>
                </select>
              </div>
            </div>

            <!-- Classes List -->
            <div class="space-y-3 max-h-64 overflow-y-auto">
              <div
                v-for="classItem in filteredClasses"
                :key="classItem.id"
                class="class-card border rounded-lg p-4 cursor-pointer transition-all duration-200"
                :class="
                  selectedClass?.id === classItem.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                "
                @click="selectClass(classItem)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h5 class="font-medium text-gray-900 dark:text-white">{{ classItem.name }}</h5>
                    <div
                      class="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span>{{ getCategoryLabel(classItem.category) }}</span>
                      <span>•</span>
                      <span>{{ getLevelLabel(classItem.level) }}</span>
                      <span>•</span>
                      <span>{{ classItem.duration }} min</span>
                    </div>
                    <div class="mt-2 flex items-center space-x-2">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="
                          classItem.currentTeacher
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        "
                      >
                        {{ classItem.currentTeacher ? "Con maestro" : "Sin maestro" }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ classItem.enrolledStudents }}/{{ classItem.maxStudents }} estudiantes
                      </span>
                    </div>
                  </div>

                  <!-- Selection Indicator -->
                  <div class="flex-shrink-0 ml-4">
                    <div
                      v-if="selectedClass?.id === classItem.id"
                      class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                    >
                      <CheckIcon class="w-4 h-4 text-white" />
                    </div>
                    <div
                      v-else
                      class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="filteredClasses.length === 0" class="text-center py-8">
                <AcademicCapIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">No se encontraron clases</p>
              </div>
            </div>
          </div>

          <!-- Step 2: Select Teacher -->
          <div v-if="currentStep === 1" class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Seleccionar Maestro
            </h4>

            <!-- Selected Class Info -->
            <div
              v-if="selectedClass"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6"
            >
              <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Clase Seleccionada</h5>
              <div class="text-sm text-blue-800 dark:text-blue-200">
                <div class="font-medium">{{ selectedClass.name }}</div>
                <div class="flex items-center space-x-4 mt-1">
                  <span>{{ getCategoryLabel(selectedClass.category) }}</span>
                  <span>•</span>
                  <span>{{ getLevelLabel(selectedClass.level) }}</span>
                  <span>•</span>
                  <span>{{ selectedClass.duration }} min</span>
                </div>
              </div>
            </div>

            <!-- Teacher Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Maestro
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  v-model="teacherSearch"
                  type="text"
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar por nombre de maestro..."
                />
              </div>
            </div>

            <!-- Teacher Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Especialidad
                </label>
                <select
                  v-model="teacherFilters.specialty"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todas las especialidades</option>
                  <option value="piano">Piano</option>
                  <option value="violin">Violín</option>
                  <option value="guitar">Guitarra</option>
                  <option value="voice">Canto</option>
                  <option value="drums">Batería</option>
                  <option value="theory">Teoría Musical</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Disponibilidad
                </label>
                <select
                  v-model="teacherFilters.availability"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="available">Disponible</option>
                  <option value="partial">Parcialmente disponible</option>
                </select>
              </div>
            </div>

            <!-- Teachers List -->
            <div class="space-y-3 max-h-80 overflow-y-auto">
              <div
                v-for="teacher in filteredTeachers"
                :key="teacher.id"
                class="teacher-card border rounded-lg p-4 cursor-pointer transition-all duration-200"
                :class="
                  selectedTeacher?.id === teacher.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                "
                @click="selectTeacher(teacher)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <!-- Avatar -->
                    <div
                      class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                    >
                      <UserIcon class="w-6 h-6 text-gray-400" />
                    </div>

                    <!-- Teacher Info -->
                    <div class="flex-1">
                      <h5 class="font-medium text-gray-900 dark:text-white">{{ teacher.name }}</h5>
                      <div class="flex items-center space-x-2 mt-1">
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{
                          teacher.email
                        }}</span>
                      </div>
                      <div class="flex items-center space-x-4 mt-2">
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="specialty in teacher.specialties"
                            :key="specialty"
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {{ getCategoryLabel(specialty) }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center space-x-4 mt-2 text-sm">
                        <div class="flex items-center space-x-1">
                          <span class="text-gray-500 dark:text-gray-400">Clases:</span>
                          <span class="font-medium text-gray-900 dark:text-white">{{
                            teacher.currentClasses
                          }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <span class="text-gray-500 dark:text-gray-400">Experiencia:</span>
                          <span class="font-medium text-gray-900 dark:text-white"
                            >{{ teacher.experience }} años</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Selection and Status -->
                  <div class="flex items-center space-x-3">
                    <!-- Availability Status -->
                    <div class="text-right">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getAvailabilityClasses(teacher.availability)"
                      >
                        {{ getAvailabilityLabel(teacher.availability) }}
                      </span>
                      <div v-if="teacher.conflictHours > 0" class="text-xs text-red-500 mt-1">
                        {{ teacher.conflictHours }} horas conflicto
                      </div>
                    </div>

                    <!-- Selection Indicator -->
                    <div class="flex-shrink-0">
                      <div
                        v-if="selectedTeacher?.id === teacher.id"
                        class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <CheckIcon class="w-4 h-4 text-white" />
                      </div>
                      <div
                        v-else
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="filteredTeachers.length === 0" class="text-center py-8">
                <UserIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p class="text-gray-500 dark:text-gray-400">
                  No se encontraron maestros disponibles
                </p>
              </div>
            </div>
          </div>

          <!-- Step 3: Assignment Configuration -->
          <div v-if="currentStep === 2" class="space-y-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Configuración de Asignación
            </h4>

            <!-- Assignment Summary -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h5 class="font-medium text-gray-900 dark:text-white mb-4">Resumen de Asignación</h5>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Class Details -->
                <div>
                  <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clase</h6>
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ selectedClass?.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {{ getCategoryLabel(selectedClass?.category || "") }} •
                      {{ getLevelLabel(selectedClass?.level || "") }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ selectedClass?.enrolledStudents }}/{{ selectedClass?.maxStudents }}
                      estudiantes
                    </div>
                  </div>
                </div>

                <!-- Teacher Details -->
                <div>
                  <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maestro</h6>
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                      >
                        <UserIcon class="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">
                          {{ selectedTeacher?.name }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ selectedTeacher?.experience }} años exp.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assignment Options -->
            <div class="space-y-4">
              <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Opciones de Asignación
              </h6>

              <!-- Start Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  v-model="assignmentData.startDate"
                  type="date"
                  :min="minDate"
                  required
                  class="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <!-- Assignment Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Asignación
                </label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      v-model="assignmentData.type"
                      value="permanent"
                      type="radio"
                      class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      <span class="font-medium">Permanente</span> - El maestro será asignado
                      indefinidamente
                    </span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="assignmentData.type"
                      value="temporary"
                      type="radio"
                      class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      <span class="font-medium">Temporal</span> - Asignación por período específico
                    </span>
                  </label>
                </div>
              </div>

              <!-- End Date (if temporary) -->
              <div v-if="assignmentData.type === 'temporary'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Finalización *
                </label>
                <input
                  v-model="assignmentData.endDate"
                  type="date"
                  :min="assignmentData.startDate"
                  required
                  class="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  v-model="assignmentData.notes"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Instrucciones especiales, objetivos específicos, etc."
                />
              </div>

              <!-- Notifications -->
              <div>
                <div class="flex items-center space-x-2">
                  <input
                    id="notifyTeacher"
                    v-model="assignmentData.notifyTeacher"
                    type="checkbox"
                    class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label for="notifyTeacher" class="text-sm text-gray-700 dark:text-gray-300">
                    Notificar al maestro por email
                  </label>
                </div>
                <div class="flex items-center space-x-2 mt-2">
                  <input
                    id="notifyStudents"
                    v-model="assignmentData.notifyStudents"
                    type="checkbox"
                    class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label for="notifyStudents" class="text-sm text-gray-700 dark:text-gray-300">
                    Notificar a los estudiantes de la clase
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            v-show="currentStep > 0"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            @click="previousStep"
          >
            <ChevronLeftIcon class="w-4 h-4 mr-2" />
            Anterior
          </button>

          <div class="flex space-x-3">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              @click="$emit('close')"
            >
              Cancelar
            </button>

            <button
              v-if="currentStep < steps.length - 1"
              type="button"
              :disabled="!canProceed"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              @click="nextStep"
            >
              Siguiente
              <ChevronRightIcon class="w-4 h-4 ml-2" />
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting || !canProceed"
              class="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span v-if="isSubmitting" class="flex items-center">
                <div
                  class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"
                />
                Asignando...
              </span>
              <span v-else class="flex items-center">
                <CheckIcon class="w-4 h-4 mr-2" />
                Asignar Maestro
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  XMarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';
import { useClassesStore } from '../../../stores/classes';
import { useTeachersStore } from '../../../stores/teachers';

const emit = defineEmits<{
  close: []
  assigned: [assignmentData: any]
}>();

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();

// Form state
const currentStep = ref(0);
const isSubmitting = ref(false);

// Search and filter states
const classSearch = ref('');
const teacherSearch = ref('');
const filters = ref({
  category: '',
  level: '',
  status: '',
});
const teacherFilters = ref({
  specialty: '',
  availability: '',
});

// Selection states
const selectedClass = ref<any>(null);
const selectedTeacher = ref<any>(null);

// Assignment configuration
const assignmentData = ref({
  startDate: '',
  type: 'permanent',
  endDate: '',
  notes: '',
  notifyTeacher: true,
  notifyStudents: true,
});

// Static data
const steps = [
  { id: 'class', title: 'Clase' },
  { id: 'teacher', title: 'Maestro' },
  { id: 'config', title: 'Configuración' },
];

// Real data from stores
const classes = computed(() => classesStore.classes);
const teachers = computed(() => teachersStore.teachers);

// Computed properties
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const filteredClasses = computed(() => {
  let filtered = classes.value;

  if (classSearch.value) {
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(classSearch.value.toLowerCase()),
    );
  }

  if (filters.value.category) {
    filtered = filtered.filter((c) => c.category === filters.value.category);
  }

  if (filters.value.level) {
    filtered = filtered.filter((c) => c.level === filters.value.level);
  }

  if (filters.value.status === 'without-teacher') {
    filtered = filtered.filter((c) => !c.currentTeacher);
  } else if (filters.value.status === 'with-teacher') {
    filtered = filtered.filter((c) => c.currentTeacher);
  }

  return filtered;
});

const filteredTeachers = computed(() => {
  let filtered = teachers.value;

  if (teacherSearch.value) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherSearch.value.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.value.toLowerCase()),
    );
  }

  if (teacherFilters.value.specialty) {
    filtered = filtered.filter((t) => t.specialties.includes(teacherFilters.value.specialty));
  }

  if (teacherFilters.value.availability) {
    filtered = filtered.filter((t) => t.availability === teacherFilters.value.availability);
  }

  return filtered;
});

const canProceed = computed(() => {
  switch (currentStep.value) {
  case 0:
    return selectedClass.value !== null;
  case 1:
    return selectedTeacher.value !== null;
  case 2:
    return (
      assignmentData.value.startDate &&
        (assignmentData.value.type !== 'temporary' || assignmentData.value.endDate)
    );
  default:
    return false;
  }
});

// Methods
const getStepClasses = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-green-500 text-white';
  } else if (currentStep.value === index) {
    return 'bg-blue-500 text-white';
  } else {
    return 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400';
  }
};

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const selectClass = (classItem: any) => {
  selectedClass.value = classItem;
};

const selectTeacher = (teacher: any) => {
  selectedTeacher.value = teacher;
};

const handleSubmit = async () => {
  isSubmitting.value = true;

  try {
    // TODO: Implementar la lógica real de asignación de maestro a clase
    // Esto probablemente implicaría una llamada a un servicio o store de clases
    console.log('Asignando maestro a clase:', {
      class: selectedClass.value,
      teacher: selectedTeacher.value,
      assignment: assignmentData.value,
    });

    // Emit the assignment event
    emit('assigned', {
      class: selectedClass.value,
      teacher: selectedTeacher.value,
      assignment: assignmentData.value,
    });
  } catch (error) {
    console.error('Error assigning teacher:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close');
  }
};

// Helper methods
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    piano: 'Piano',
    violin: 'Violín',
    guitar: 'Guitarra',
    voice: 'Canto',
    drums: 'Batería',
    theory: 'Teoría Musical',
  };
  return labels[category] || category;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    professional: 'Profesional',
  };
  return labels[level] || level;
};

const getAvailabilityClasses = (availability: string) => {
  const classes = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    unavailable: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return classes[availability as keyof typeof classes] || classes.unavailable;
};

const getAvailabilityLabel = (availability: string) => {
  const labels = {
    available: 'Disponible',
    partial: 'Parcial',
    unavailable: 'No disponible',
  };
  return labels[availability as keyof typeof labels] || 'Desconocido';
};

// Lifecycle
onMounted(async () => {
  // Load data from stores
  await Promise.all([classesStore.fetchClasses(), teachersStore.loadTeachers()]);

  // Set default start date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assignmentData.value.startDate = tomorrow.toISOString().split('T')[0];
});
</script>

<style scoped>
/* Custom scrollbar for lists */
.max-h-64::-webkit-scrollbar,
.max-h-80::-webkit-scrollbar {
  width: 4px;
}

.max-h-64::-webkit-scrollbar-track,
.max-h-80::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-64::-webkit-scrollbar-thumb,
.max-h-80::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.dark .max-h-64::-webkit-scrollbar-thumb,
.dark .max-h-80::-webkit-scrollbar-thumb {
  background: #4b5563;
}

/* Card hover effects */
.class-card,
.teacher-card {
  transition: all 0.2s ease;
}

.class-card:hover,
.teacher-card:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}
</style>
