<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../store/students'

const router = useRouter()
const studentsStore = useStudentsStore()

// Create toast notification system
const notification = ref({
  show: false,
  message: '',
  type: 'success' // 'success' or 'error'
})

const showNotification = (message: string, type = 'success') => {
  notification.value = { show: true, message, type }
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.value.show = false
  }, 7000)
}

const newStudent = ref({
  nombre: '',
  apellido: '',
  instrumento: '',
  edad: '',
  tlf: '',
  email: '',
  direccion: '',
  observaciones: '',
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Reference to track if we're editing an existing student
const isEditingExistingStudent = ref(false)
const matchedStudent = ref(null)

// Helper function to normalize text for accent-insensitive comparison
const normalizeText = (text: string = '') => {
  if (!text) return '';
  return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Keep original computed properties but add verification after setting
const capitalizedNombre = computed({
  get: () => newStudent.value.nombre,
  set: (val: string) => {
    const previousValue = newStudent.value.nombre
    newStudent.value.nombre = val.charAt(0).toUpperCase() + val.slice(1)
    // Trigger verification on every change if both fields are filled
    if (newStudent.value.nombre && newStudent.value.apellido) {
      verifyStudentExists()
    }
  }
})

const capitalizedApellido = computed({
  get: () => newStudent.value.apellido,
  set: (val: string) => {
    const previousValue = newStudent.value.apellido
    newStudent.value.apellido = val.charAt(0).toUpperCase() + val.slice(1)
    // Trigger verification on every change if both fields are filled
    if (newStudent.value.nombre && newStudent.value.apellido) {
      verifyStudentExists()
    }
  }
})

const capitalizedInstrumento = computed({
  get: () => newStudent.value.instrumento,
  set: (val: string) => {
    newStudent.value.instrumento = val.charAt(0).toUpperCase() + val.slice(1)
  }
})

const capitalizedDireccion = computed({
  get: () => newStudent.value.direccion,
  set: (val: string) => {
    newStudent.value.direccion = val.charAt(0).toUpperCase() + val.slice(1)
  }
})

const capitalizedObservaciones = computed({
  get: () => newStudent.value.observaciones,
  set: (val: string) => {
    newStudent.value.observaciones = val.charAt(0).toUpperCase() + val.slice(1)
  }
})

const localStorageKey = 'newStudentData'

onMounted(() => {
  const storedData = localStorage.getItem(localStorageKey)
  if (storedData) {
    newStudent.value = JSON.parse(storedData)
  }
})

watch(
  newStudent,
  (newValue) => {
    localStorage.setItem(localStorageKey, JSON.stringify(newValue))
  },
  { deep: true }
)

const isLoading = ref(false)
const error = ref<string | null>(null)

const clearForm = () => {
  newStudent.value = {
    nombre: '',
    apellido: '',
    instrumento: '',
    edad: '',
    tlf: '',
    email: '',
    direccion: '',
    observaciones: '',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  // Clear localStorage as well to prevent auto-filling cleared form
  localStorage.removeItem(localStorageKey)
}

const handleSubmit = async () => {
  try {
    // Check if fields are correctly filled
    if (!newStudent.value.nombre || !newStudent.value.apellido) {
      error.value = 'Nombre y apellido son obligatorios'
      showNotification(error.value, 'error')
      return
    }
    
    isLoading.value = true
    error.value = null
    
    // Check if we're updating an existing student
    if (isEditingExistingStudent.value && matchedStudent.value) {
      // Preserve the ID for updating
      newStudent.value.id = matchedStudent.value.id
      
      // Update the student
      await studentsStore.updateStudent(newStudent.value)
      showNotification(`Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} actualizado con éxito`)
      clearForm()
      isEditingExistingStudent.value = false
      matchedStudent.value = null
      return
    }
    
    // Otherwise proceed with duplicate check as before
    // Fix: properly call getStudents method
    let students = [];
    try {
      // Check if getStudents is a function or a getter property
      if (typeof studentsStore.getStudents === 'function') {
        students = await studentsStore.getStudents();
      } else {
        students = studentsStore.getStudents;
      }
      
      // Make sure students is an array
      if (!Array.isArray(students)) {
        console.error('getStudents did not return an array:', students);
        students = [];
      }
    } catch (err) {
      console.error('Error getting students:', err);
      students = [];
    }
    
    // Normalize values for comparison
    const normalizedNombre = newStudent.value.nombre.toLowerCase().trim();
    const normalizedApellido = newStudent.value.apellido.toLowerCase().trim();
    const normalizedEdad = newStudent.value.edad.toString().trim();
    const normalizedInstrumento = newStudent.value.instrumento.toLowerCase().trim();
    
    // Improved duplicate check with better handling of edge cases
    const existingStudent = students.find(student => {
      const studentNombre = (student.nombre || '').toLowerCase().trim();
      const studentApellido = (student.apellido || '').toLowerCase().trim();
      const studentEdad = (student.edad || '').toString().trim();
      const studentInstrumento = (student.instrumento || '').toLowerCase().trim();
      
      const nameMatches = studentNombre === normalizedNombre && 
                          studentApellido === normalizedApellido;
                          

      const edadMatches = !normalizedEdad || !studentEdad || 
                          normalizedEdad === studentEdad;
                          

      const instrumentoMatches = !normalizedInstrumento || !studentInstrumento || 
                                 normalizedInstrumento === studentInstrumento;
      
      return nameMatches && edadMatches && instrumentoMatches;
    });

    if (existingStudent) {
      error.value = `Ya existe un alumno con el nombre ${existingStudent.nombre} ${existingStudent.apellido}`;
      showNotification(error.value, 'error');
      isLoading.value = false;
      return;
    }

    // If no duplicates found, proceed with adding student
    await studentsStore.addStudent(newStudent.value);
    showNotification(`Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} guardado con éxito`);
    clearForm();
    isEditingExistingStudent.value = false
    matchedStudent.value = null
  } catch (err: any) {
    error.value = err.message || 'Error al crear el alumno'
    showNotification(error.value, 'error')
  } finally {
    isLoading.value = false
  }
}

// Add watchers to trigger verification when both fields are filled
watch(
  [() => newStudent.value.nombre, () => newStudent.value.apellido],
  async ([newNombre, newApellido], [oldNombre, oldApellido]) => {
    // Only run verification if both fields are populated and one of them changed
    if (newNombre && newApellido && (newNombre !== oldNombre || newApellido !== oldApellido)) {
      await verifyStudentExists()
    }
    
    // If name or surname was cleared, reset editing state
    if ((!newNombre || !newApellido) && isEditingExistingStudent.value) {
      isEditingExistingStudent.value = false
      matchedStudent.value = null
    }
  }
)

// Function to verify if student exists
const verifyStudentExists = async () => {
  if (!newStudent.value.nombre || !newStudent.value.apellido) return

  try {
    let students = []
    try {
      if (typeof studentsStore.getStudents === 'function') {
        students = await studentsStore.getStudents()
      } else {
        students = studentsStore.getStudents
      }
      if (!Array.isArray(students)) {
        students = []
      }
    } catch (err) {
      students = []
    }

    const normalizedNombre = normalizeText(newStudent.value.nombre)
    const normalizedApellido = normalizeText(newStudent.value.apellido)

    const matchingStudents = students.filter(student => {
      if (!student.nombre || !student.apellido) return false
      const studentNombreNorm = normalizeText(student.nombre)
      const studentApellidoNorm = normalizeText(student.apellido)
      return studentNombreNorm === normalizedNombre && studentApellidoNorm === normalizedApellido
    })

    if (matchingStudents.length > 0) {
      matchedStudent.value = matchingStudents[0]
      showNotification(
        `¡ATENCIÓN! Alumno ya registrado: ${matchedStudent.value.nombre} ${matchedStudent.value.apellido}`,
        'warning'
      )
      populateFormWithStudentData(matchedStudent.value)
      isEditingExistingStudent.value = true
    } else {
      if (isEditingExistingStudent.value) {
        clearFormExceptNameAndSurname()
        isEditingExistingStudent.value = false
        matchedStudent.value = null
      }
    }
  } catch (err) {
    console.error('Error verifying student:', err)
  }
}

// Function to populate form with existing student data
const populateFormWithStudentData = (student) => {
  // Keep the current name and surname but populate other fields
  const currentNombre = newStudent.value.nombre
  const currentApellido = newStudent.value.apellido
  
  // Populate with student data
  newStudent.value = { 
    ...student,
    // Update dates to be Date objects
    createdAt: new Date(student.createdAt),
    updatedAt: new Date()
  }
  
  // Restore current name and surname if they differ
  // This allows for small corrections while still identifying the student
  if (student.nombre !== currentNombre) {
    newStudent.value.nombre = currentNombre
  }
  
  if (student.apellido !== currentApellido) {
    newStudent.value.apellido = currentApellido
  }
}

// Function to clear form except name and surname
const clearFormExceptNameAndSurname = () => {
  const nombre = newStudent.value.nombre
  const apellido = newStudent.value.apellido
  
  // Clear form
  newStudent.value = {
    nombre,
    apellido,
    instrumento: '',
    edad: '',
    tlf: '',
    email: '',
    direccion: '',
    observaciones: '',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">Nuevo Alumno</h1>

    <!-- Notification toast -->
    <div 
      v-if="notification.show" 
      :class="[

        'fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform',
        notification.type === 'success' 
          ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
          : 'bg-red-100 text-red-800 border-l-4 border-red-500'
      ]"
    >
      {{ notification.message }}
    </div>

    <form @submit.prevent="handleSubmit" @keydown.enter.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Nombre -->
        <div class="sm:col-span-1">
          <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input
            v-model="capitalizedNombre"
            type="text"
            id="nombre"
            required
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Apellido -->
        <div class="sm:col-span-1">
          <label for="apellido" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
          <input
            v-model="capitalizedApellido"
            type="text"
            id="apellido"
            required
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Edad -->
        <div>
          <label for="edad" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Edad</label>
          <input
            v-model="newStudent.edad"
            type="number"
            id="edad"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <!-- Instrumento -->
        <div>
          <label for="instrumento" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento</label>
          <input
            v-model="capitalizedInstrumento"
            type="text"
            id="instrumento"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <!-- Teléfono -->
        <div>
          <label for="tlf" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <input
            v-model="newStudent.tlf"
            type="tel"
            id="tlf"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            v-model="newStudent.email"
            type="email"
            id="email"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <!-- Dirección -->
      <div>
        <label for="direccion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
        <textarea
          v-model="capitalizedDireccion"
          rows="3"
          id="direccion"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
        ></textarea>
      </div>

      <!-- Observaciones -->
      <div>
        <label for="observaciones" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
        <textarea
          v-model="capitalizedObservaciones"
          rows="4"
          id="observaciones"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
        ></textarea>
      </div>

      <div v-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {{ error }}
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button type="button" @click="router.push({ name: 'Students' })" class="btn btn-outline">
          Cancelar
        </button>

        <button
          type="submit"
          :disabled="isLoading"
          class="fixed right-6 top-1/2 transform -translate-y-1/2 btn btn-primary rounded-full h-12 w-12 flex items-center justify-center z-10 shadow-lg"
        >
          <span v-if="isLoading" class="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.419 15m0 0H15m-11-1va3 3 0 116 0v3a3 3 0 10-6 0v-3z" />
            </svg>
          </span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
      </div>
    </form>

    <!-- Add status indicator for matched student -->
    <div v-if="isEditingExistingStudent && matchedStudent" 
         class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-4 rounded-lg mb-4">
      Editando alumno existente: {{ matchedStudent.nombre }} {{ matchedStudent.apellido }}
    </div>
  </div>
</template>