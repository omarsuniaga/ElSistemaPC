<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useStudentsStore} from "../store/students"
import {useClassesStore} from "../../Classes/store/classes"
import {useInstrumentoStore} from "../../Instruments/store/instrumento"

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const instrumentoStore = useInstrumentoStore()

const studentId = String(route.params.id)
const isLoading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Cargar datos necesarios al montar el componente
onMounted(async () => {
  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      instrumentoStore.fetchInstruments(),
    ])
  } catch (err: any) {
    error.value = err.message || "Error al cargar los datos"
  }
})

const originalStudent = computed(() =>
  studentsStore.students.find((s) => s.id.toString() === studentId)
)

const instruments = computed(() => instrumentoStore.instruments)

// Asegurar que el campo grupo siempre sea un array al cargar el estudiante
const normalizeGrupo = (grupo: any): string[] => {
  if (Array.isArray(grupo)) {
    return grupo
  } else if (grupo) {
    if (typeof grupo === "string") {
      if (grupo.startsWith("[") && grupo.endsWith("]")) {
        try {
          const parsed = JSON.parse(grupo)
          return Array.isArray(parsed) ? parsed : [grupo]
        } catch (e) {
          console.warn("Error parsing grupo value:", e)
          return [grupo]
        }
      }
      return [grupo]
    }
    return [String(grupo)]
  }
  return []
}

const formData = ref<any>(null)

// Watch para actualizar formData cuando se carga el estudiante
watch(
  originalStudent,
  (newStudent) => {
    if (newStudent) {
      formData.value = {
        ...newStudent,
        grupo: normalizeGrupo(newStudent.grupo),
      }
    }
  },
  {immediate: true}
)

const handleSubmit = async () => {
  if (!formData.value) {
    console.error("No hay datos del formulario para guardar")
    return
  }

  console.log("🔄 Iniciando actualización del estudiante:", studentId)
  console.log("📝 Datos a guardar:", JSON.stringify(formData.value, null, 2))

  isLoading.value = true
  error.value = null
  successMessage.value = null

  try {
    // Asegurarnos que grupo sea un array antes de guardar
    if (!Array.isArray(formData.value.grupo)) {
      formData.value.grupo = normalizeGrupo(formData.value.grupo)
    }

    console.log("📤 Enviando datos al store...")
    await studentsStore.updateStudent(String(studentId), formData.value)

    console.log("✅ Estudiante actualizado exitosamente en Firestore")
    successMessage.value = "Estudiante actualizado exitosamente"

    console.log("🔄 Refrescando lista de estudiantes...")

    // Refrescar la lista de estudiantes para asegurar que los cambios se reflejen
    await studentsStore.fetchStudents()

    // Esperar un poco para mostrar el mensaje de éxito antes de redirigir
    setTimeout(() => {
      console.log("🏠 Redirigiendo a la lista de estudiantes...")
      router.push("/students/")
    }, 1500)
  } catch (err: any) {
    console.error("❌ Error al actualizar estudiante:", err)
    error.value = err.message || "Error al actualizar el estudiante"
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push(`/students/${studentId}`)
}
</script>

<template>
  <div v-if="formData" class="py-6">
    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6"
    >
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Editar Alumno</h1>
      <button
        class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        :disabled="isLoading"
        @click="handleCancel"
      >
        Cancelar
      </button>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        <span v-if="isLoading" class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
          Guardando...
        </span>
        <span v-else>Guardar</span>
      </button>
      <!-- Información Personal -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Personal</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input v-model="formData.nombre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Apellido</label>
            <input v-model="formData.apellido" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Edad</label>
            <input v-model="formData.edad" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Fecha de Nacimiento</label>
            <input v-model="formData.nac" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sexo</label>
            <select v-model="formData.sexo" class="input">
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Instrumento</label>
            <select v-model="formData.instrumento" class="input">
              <option
                v-for="instrument in instruments"
                :key="instrument.id"
                :value="instrument.nombre"
              >
                {{ instrument.nombre }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Información de Contacto -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información de Contacto</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono</label>
            <input v-model="formData.tlf" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input v-model="formData.email" type="email" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre de la Madre</label>
            <input v-model="formData.madre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre del Padre</label>
            <input v-model="formData.padre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono de la Madre</label>
            <input v-model="formData.tlf_madre" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono del Padre</label>
            <input v-model="formData.tlf_padre" type="text" class="input" />
          </div>
        </div>
      </div>

      <!-- Información Académica -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Académica</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Institución</label>
            <input v-model="formData.colegio_trabajo" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Horario</label>
            <input v-model="formData.horario_colegio_trabajo" type="text" class="input" />
          </div>
        </div>
      </div>

      <!-- Group Selection -->
      <div class="card mt-6">
        <h2 class="text-lg font-semibold mb-4">Grupos</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="group in classesStore.classes"
            :key="group.id"
            class="flex items-center space-x-2"
          >
            <input
              :id="group.id"
              v-model="formData.grupo"
              type="checkbox"
              :value="group.name"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <label :for="group.id" class="text-sm">{{ group.name }}</label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 mb-24">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="flex items-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
            Guardando...
          </span>
          <span v-else>Guardar Cambios</span>
        </button>
        <button
          type="button"
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          :disabled="isLoading"
          @click="handleCancel"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
  <div v-else class="py-6">
    <p>Estudiante no encontrado</p>
  </div>
</template>
