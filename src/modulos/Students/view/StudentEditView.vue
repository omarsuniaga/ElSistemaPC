<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentsStore } from "../store/students"
import { useClassesStore } from '../../Classes/store/classes'
import { useInstrumentoStore } from '../../Instruments/store/instrumento' // nuevo import

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()

const studentId = String(route.params.id)
const originalStudent = computed(() => studentsStore.students.find(s => s.id.toString() === studentId))

const classesStore = useClassesStore()

const instrumentoStore = useInstrumentoStore()
// Opcional: cargar instrumentos si aún no se han cargado
if (!instrumentoStore.instruments.length) {
  instrumentoStore.fetchInstrumentos()
}

const instruments = computed(() => instrumentoStore.instruments)

const formData = ref(originalStudent.value ? {
  ...originalStudent.value,
  grupo: originalStudent.value.grupo || []
} : null)

const handleSubmit = () => {
  if (formData.value) {
    studentsStore.updateStudent(String(studentId), formData.value)
    router.push(`/students/${studentId}`)
  }
}

const handleCancel = () => {
  router.push(`/students/${studentId}`)
}
</script>

<template>
  <div v-if="formData" class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Editar Alumno</h1>
      <button
        @click="handleCancel"
        class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        Cancelar
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Información Personal -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Personal</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input
              v-model="formData.nombre"
              type="text"
              class="input"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Apellido</label>
            <input
              v-model="formData.apellido"
              type="text"
              class="input"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Edad</label>
            <input
              v-model="formData.edad"
              type="text"
              class="input"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Fecha de Nacimiento</label>
            <input
              v-model="formData.nac"
              type="text"
              class="input"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sexo</label>
            <select v-model="formData.sexo" class="input" required>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Instrumento</label>
            <select v-model="formData.instrumento" class="input" required>
              <option v-for="instrument in instruments" :key="instrument" :value="instrument">
                {{ instrument }}
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
            <input
              v-model="formData.tlf"
              type="text"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input
              v-model="formData.email"
              type="email"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre de la Madre</label>
            <input
              v-model="formData.madre"
              type="text"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nombre del Padre</label>
            <input
              v-model="formData.padre"
              type="text"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono de la Madre</label>
            <input
              v-model="formData.tlf_madre"
              type="text"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono del Padre</label>
            <input
              v-model="formData.tlf_padre"
              type="text"
              class="input"
            />
          </div>
        </div>
      </div>

      <!-- Información Académica -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Académica</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Institución</label>
            <input
              v-model="formData.colegio_trabajo"
              type="text"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Horario</label>
            <input
              v-model="formData.horario_colegio_trabajo"
              type="text"
              class="input"
            />
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
              type="checkbox"
              :id="group.id"
              :value="group.name"
              v-model="formData.grupo"
              class="rounded text-blue-600 focus:ring-blue-500"
            >
            <label :for="group.id" class="text-sm">{{ group.name }}</label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="handleCancel"
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  </div>
  <div v-else class="py-6">
    <p>Estudiante no encontrado</p>
  </div>
</template>