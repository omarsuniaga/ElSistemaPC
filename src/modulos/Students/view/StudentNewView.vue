<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from "../store/students"
import { PlusCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const studentsStore = useStudentsStore()

const newStudent = ref({
  nombre: '',
  apellido: '',
  instrumento: '',
  edad: '',
  tlf: '',
  email: '',
  direccion: '',
  observaciones: '',
  nac: '',
  sexo: 'Masculino',
  madre: '',
  padre: '',
  tlf_madre: '',
  tlf_padre: '',
  colegio_trabajo: '',
  horario_colegio_trabajo: '',
  grupo: ['Teoría Musical'] as string[],
  clase: '',
  fecInscripcion: new Date().toISOString().split('T')[0]
})

const isLoading = ref(false)
const error = ref('')

const instruments = [
  'Piano',
  'Violín',
  'Guitarra'
]

const classes = [
  'Piano - Nivel 1',
  'Piano - Nivel 2',
  'Violín - Nivel 1',
  'Violín - Nivel 2',
  'Guitarra - Nivel 1',
  'Guitarra - Nivel 2'
]

const handleSubmit = async () => {
  isLoading.value = true
  error.value = ''

  try {
    await studentsStore.addStudent({
      ...formData.value,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.value.nombre}`,
      documentos: {}
    })
    router.push('/students')
  } catch (e) {
    error.value = 'Error al crear el alumno'
    console.error('Error creating student:', e)
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push('/students')
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Nuevo Alumno</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Información Personal -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Información Personal</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input 
            v-model="newStudent.nombre" 
            type="text" 
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
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
              type="date"
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
              <option value="">Seleccionar instrumento</option>
              <option
                v-for="instrument in instruments"
                :key="instrument"
                :value="instrument"
              >
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
              type="tel"
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
              type="tel"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono del Padre</label>
            <input
              v-model="formData.tlf_padre"
              type="tel"
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
              placeholder="Ej: Lunes a Viernes 8:00-14:00"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Clase</label>
            <select v-model="formData.clase" class="input" required>
              <option value="">Seleccionar clase</option>
              <option
                v-for="class_ in classes"
                :key="class_"
                :value="class_"
              >
                {{ class_ }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
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
          :disabled="isLoading"
        >
          {{ isLoading ? 'Creando...' : 'Crear Alumno' }}
        </button>
      </div>
    </form>
  </div>
</template>