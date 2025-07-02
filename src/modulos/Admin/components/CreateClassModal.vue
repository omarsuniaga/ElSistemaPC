<template>
  <div
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="handleBackdropClick"
  >
    <div
      class="relative top-10 mx-auto p-6 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Crear Nueva Clase</h3>
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
          <!-- Step 1: Basic Information -->
          <div v-if="currentStep === 0" class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Información Básica
            </h4>

            <!-- Class Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Clase *
              </label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Ej: Piano Intermedio A"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Descripción de la clase, objetivos, nivel requerido..."
              />
            </div>

            <!-- Category and Level -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  v-model="formData.category"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="piano">Piano</option>
                  <option value="violin">Violín</option>
                  <option value="guitar">Guitarra</option>
                  <option value="voice">Canto</option>
                  <option value="drums">Batería</option>
                  <option value="theory">Teoría Musical</option>
                  <option value="ensemble">Ensamble</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel *
                </label>
                <select
                  v-model="formData.level"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar nivel</option>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
            </div>

            <!-- Capacity and Duration -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacidad Máxima *
                </label>
                <input
                  v-model.number="formData.maxStudents"
                  type="number"
                  min="1"
                  max="50"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duración (minutos) *
                </label>
                <select
                  v-model.number="formData.duration"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Seleccionar duración</option>
                  <option :value="30">30 minutos</option>
                  <option :value="45">45 minutos</option>
                  <option :value="60">60 minutos</option>
                  <option :value="90">90 minutos</option>
                  <option :value="120">120 minutos</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 2: Schedule Configuration -->
          <div v-if="currentStep === 1" class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Configuración de Horario
            </h4>

            <!-- Class Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Clase *
              </label>
              <div class="grid grid-cols-3 gap-3">
                <div v-for="type in classTypes" :key="type.value" class="relative">
                  <input
                    :id="type.value"
                    v-model="formData.classType"
                    :value="type.value"
                    type="radio"
                    name="classType"
                    class="sr-only"
                    required
                  />
                  <label
                    :for="type.value"
                    class="block p-3 border rounded-lg cursor-pointer transition-colors duration-200"
                    :class="
                      formData.classType === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    "
                  >
                    <div class="text-center">
                      <component :is="type.icon" class="w-6 h-6 mx-auto mb-2" />
                      <div class="text-sm font-medium">{{ type.label }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ type.description }}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Weekly Schedule (if recurring) -->
            <div v-if="formData.classType === 'recurring'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Días de la Semana *
                </label>
                <div class="grid grid-cols-7 gap-2">
                  <div v-for="day in weekDays" :key="day.value" class="text-center">
                    <label class="block">
                      <input
                        v-model="formData.weekDays"
                        :value="day.value"
                        type="checkbox"
                        class="sr-only"
                      />
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 text-xs font-medium"
                        :class="
                          formData.weekDays.includes(day.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        "
                      >
                        {{ day.short }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ day.label }}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Time Selection -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    v-model="formData.startTime"
                    type="time"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    v-model="formData.startDate"
                    type="date"
                    :min="minDate"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- One-time Event (if workshop) -->
            <div v-if="formData.classType === 'workshop'" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha del Taller *
                  </label>
                  <input
                    v-model="formData.workshopDate"
                    type="date"
                    :min="minDate"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    v-model="formData.workshopTime"
                    type="time"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Resources and Requirements -->
          <div v-if="currentStep === 2" class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recursos y Requisitos
            </h4>

            <!-- Room Assignment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aula Asignada
              </label>
              <select
                v-model="formData.roomId"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Asignar más tarde</option>
                <option v-for="room in availableRooms" :key="room.id" :value="room.id">
                  {{ room.name }} - Capacidad: {{ room.capacity }}
                </option>
              </select>
            </div>

            <!-- Required Materials -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Materiales Requeridos
              </label>
              <div class="space-y-2">
                <div
                  v-for="(material, index) in formData.materials"
                  :key="index"
                  class="flex items-center space-x-2"
                >
                  <input
                    v-model="formData.materials[index]"
                    type="text"
                    class="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: Piano acústico, Partituras, Metrónomo"
                  />
                  <button
                    type="button"
                    class="p-2 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    @click="removeMaterial(index)"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  class="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  @click="addMaterial"
                >
                  <PlusIcon class="w-4 h-4" />
                  <span>Agregar Material</span>
                </button>
              </div>
            </div>

            <!-- Prerequisites -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prerrequisitos
              </label>
              <textarea
                v-model="formData.prerequisites"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Conocimientos previos requeridos, nivel de experiencia, etc."
              />
            </div>

            <!-- Cost Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Costo por Clase
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                  </div>
                  <input
                    v-model.number="formData.cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="mt-1 block w-full pl-7 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalidad de Pago
                </label>
                <select
                  v-model="formData.paymentMode"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="per-class">Por Clase</option>
                  <option value="monthly">Mensual</option>
                  <option value="semester">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 4: Review and Confirmation -->
          <div v-if="currentStep === 3" class="space-y-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Revisar y Confirmar
            </h4>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Information -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 dark:text-white mb-3">Información Básica</h5>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Nombre:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">{{ formData.name }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Categoría:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">
                      {{ getCategoryLabel(formData.category) }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Nivel:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">
                      {{ getLevelLabel(formData.level) }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Capacidad:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">
                      {{ formData.maxStudents }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Duración:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">
                      {{ formData.duration }} min
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Schedule Information -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 dark:text-white mb-3">Horario</h5>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-gray-500 dark:text-gray-400">Tipo:</dt>
                    <dd class="text-gray-900 dark:text-white font-medium">
                      {{ getClassTypeLabel(formData.classType) }}
                    </dd>
                  </div>
                  <div v-if="formData.classType === 'recurring'">
                    <div class="flex justify-between">
                      <dt class="text-gray-500 dark:text-gray-400">Días:</dt>
                      <dd class="text-gray-900 dark:text-white font-medium">
                        {{ getWeekDaysLabel(formData.weekDays) }}
                      </dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500 dark:text-gray-400">Hora:</dt>
                      <dd class="text-gray-900 dark:text-white font-medium">
                        {{ formData.startTime }}
                      </dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500 dark:text-gray-400">Inicio:</dt>
                      <dd class="text-gray-900 dark:text-white font-medium">
                        {{ formatDate(formData.startDate) }}
                      </dd>
                    </div>
                  </div>
                  <div v-if="formData.classType === 'workshop'">
                    <div class="flex justify-between">
                      <dt class="text-gray-500 dark:text-gray-400">Fecha:</dt>
                      <dd class="text-gray-900 dark:text-white font-medium">
                        {{ formatDate(formData.workshopDate) }}
                      </dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500 dark:text-gray-400">Hora:</dt>
                      <dd class="text-gray-900 dark:text-white font-medium">
                        {{ formData.workshopTime }}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Additional Information -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 class="font-medium text-gray-900 dark:text-white mb-3">Información Adicional</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div v-if="formData.roomId">
                  <span class="text-gray-500 dark:text-gray-400">Aula:</span>
                  <span class="ml-2 text-gray-900 dark:text-white font-medium">{{
                    getRoomName(formData.roomId)
                  }}</span>
                </div>
                <div v-if="formData.cost">
                  <span class="text-gray-500 dark:text-gray-400">Costo:</span>
                  <span class="ml-2 text-gray-900 dark:text-white font-medium"
                    >${{ formData.cost }}</span
                  >
                </div>
                <div v-if="formData.materials.length > 0">
                  <span class="text-gray-500 dark:text-gray-400">Materiales:</span>
                  <span class="ml-2 text-gray-900 dark:text-white font-medium"
                    >{{ formData.materials.length }} elementos</span
                  >
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
                Creando...
              </span>
              <span v-else class="flex items-center">
                <CheckIcon class="w-4 h-4 mr-2" />
                Crear Clase
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {
  XMarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline"

const emit = defineEmits<{
  close: []
  created: [classData: any]
}>()

// Form state
const currentStep = ref(0)
const isSubmitting = ref(false)

const formData = ref({
  name: "",
  description: "",
  category: "",
  level: "",
  maxStudents: 10,
  duration: 60,
  classType: "recurring",
  weekDays: [] as number[],
  startTime: "",
  startDate: "",
  workshopDate: "",
  workshopTime: "",
  roomId: "",
  materials: [""],
  prerequisites: "",
  cost: 0,
  paymentMode: "per-class",
})

// Static data
const steps = [
  {id: "basic", title: "Básico"},
  {id: "schedule", title: "Horario"},
  {id: "resources", title: "Recursos"},
  {id: "review", title: "Revisar"},
]

const classTypes = [
  {
    value: "recurring",
    label: "Recurrente",
    description: "Clases regulares",
    icon: CalendarIcon,
  },
  {
    value: "workshop",
    label: "Taller",
    description: "Evento único",
    icon: ClockIcon,
  },
  {
    value: "private",
    label: "Privada",
    description: "Clase individual",
    icon: UserGroupIcon,
  },
]

const weekDays = [
  {value: 1, label: "Lunes", short: "L"},
  {value: 2, label: "Martes", short: "M"},
  {value: 3, label: "Miércoles", short: "X"},
  {value: 4, label: "Jueves", short: "J"},
  {value: 5, label: "Viernes", short: "V"},
  {value: 6, label: "Sábado", short: "S"},
  {value: 0, label: "Domingo", short: "D"},
]

// TODO: Obtener datos reales de las aulas/salas de un store o API
const availableRooms = ref([])

// Computed
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split("T")[0]
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return formData.value.name && formData.value.category && formData.value.level
    case 1:
      if (formData.value.classType === "recurring") {
        return (
          formData.value.weekDays.length > 0 && formData.value.startTime && formData.value.startDate
        )
      } else if (formData.value.classType === "workshop") {
        return formData.value.workshopDate && formData.value.workshopTime
      }
      return true
    case 2:
      return true // Optional step
    case 3:
      return true // Review step
    default:
      return false
  }
})

// Methods
const getStepClasses = (index: number) => {
  if (currentStep.value > index) {
    return "bg-green-500 text-white"
  } else if (currentStep.value === index) {
    return "bg-blue-500 text-white"
  } else {
    return "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const addMaterial = () => {
  formData.value.materials.push("")
}

const removeMaterial = (index: number) => {
  if (formData.value.materials.length > 1) {
    formData.value.materials.splice(index, 1)
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    // TODO: Implementar la lógica real para crear la clase (ej. classesStore.createClass(formData.value))
    console.log("Creando clase con datos:", formData.value)

    // Emit the created event with form data
    emit("created", {...formData.value})
  } catch (error) {
    console.error("Error creating class:", error)
  } finally {
    isSubmitting.value = false
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit("close")
  }
}

// Helper methods for labels
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    piano: "Piano",
    violin: "Violín",
    guitar: "Guitarra",
    voice: "Canto",
    drums: "Batería",
    theory: "Teoría Musical",
    ensemble: "Ensamble",
  }
  return labels[category] || category
}

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    professional: "Profesional",
  }
  return labels[level] || level
}

const getClassTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    recurring: "Clase Recurrente",
    workshop: "Taller",
    private: "Clase Privada",
  }
  return labels[type] || type
}

const getWeekDaysLabel = (days: number[]) => {
  return days.map((day) => weekDays.find((d) => d.value === day)?.short).join(", ")
}

const getRoomName = (roomId: string) => {
  return availableRooms.value.find((room) => room.id === roomId)?.name || "N/A"
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Lifecycle
onMounted(() => {
  // Set default start date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  formData.value.startDate = tomorrow.toISOString().split("T")[0]
})
</script>

<style scoped>
/* Custom styling for the modal */
.modal-overlay {
  backdrop-filter: blur(4px);
}

/* Step indicator styling */
.step-indicator {
  transition: all 0.3s ease;
}

/* Form validation feedback */
.form-field.invalid {
  border-color: #ef4444;
}

.form-field.invalid:focus {
  ring-color: #ef4444;
  border-color: #ef4444;
}
</style>
