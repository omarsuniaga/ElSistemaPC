<script setup lang="ts">
import {ref, onMounted, watch, computed} from "vue"
import {useRouter} from "vue-router"
import {useStudentsStore} from "../store/students"
import type {Student} from "../types/student"

const router = useRouter()
const studentsStore = useStudentsStore()

// Create toast notification system
const notification = ref({
  show: false,
  message: "",
  type: "success", // 'success' or 'error'
})

const showNotification = (message: string, type = "success") => {
  notification.value = {show: true, message, type}

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.value.show = false
  }, 7000)
}

const newStudent = ref<Omit<Student, 'id'> & {id?: string}>({
  nombre: "",
  apellido: "",
  instrumento: "",
  edad: "",
  tlf: "",
  email: "",
  direccion: "",
  observaciones: "",
  grupo: [], // Especificar el tipo
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Reference to track if we're editing an existing student
const isEditingExistingStudent = ref(false)
const matchedStudent = ref<Student | null>(null)

// Helper function to normalize text for accent-insensitive comparison
const normalizeText = (text: string = "") => {
  if (!text) return ""
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Función para limpiar y normalizar valores de grupo
const cleanGroupValue = (group: string): string => {
  if (!group || typeof group !== "string") return ""

  // Limpiar el valor: eliminar caracteres especiales y capitalizar primera letra
  let cleanValue = group
    .trim()
    .replace(/[[\]"',]+/g, "") // Eliminar [], comillas y comas
    .trim()

  // Capitalizar primera letra de cada palabra
  cleanValue = cleanValue
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

  return cleanValue
}

// Computed property para obtener todos los valores de grupo disponibles en los estudiantes
const availableGrupo = computed(() => {
  // Crear un Set para manejar valores únicos
  const grupoSet = new Set<string>()

  // Recorrer todos los estudiantes
  studentsStore.students.forEach((student) => {
    // Si el estudiante tiene grupos asignados
    if (student.grupo) {
      try {
        // Si grupo es un array, agregar cada elemento
        if (Array.isArray(student.grupo)) {
          student.grupo.forEach((group) => {
            const cleanValue = cleanGroupValue(group)
            if (cleanValue) {
              grupoSet.add(cleanValue)
            }
          })
        }
        // Si grupo es un string pero parece ser un array serializado
        else if (typeof student.grupo === "string") {
          const grupoStr = student.grupo as string
          if (grupoStr.startsWith("[") && grupoStr.endsWith("]")) {
            try {
              const parsedGroup = JSON.parse(grupoStr)
              if (Array.isArray(parsedGroup)) {
                parsedGroup.forEach((group) => {
                  const cleanValue = cleanGroupValue(group)
                  if (cleanValue) {
                    grupoSet.add(cleanValue)
                  }
                })
              } else {
                // Si el parsing no resulta en un array, tratar como string
                const cleanValue = cleanGroupValue(grupoStr)
                if (cleanValue) {
                  grupoSet.add(cleanValue)
                }
              }
            } catch (e) {
              // Si hay error al parsear, tratar como string
              const cleanValue = cleanGroupValue(grupoStr)
              if (cleanValue) {
                grupoSet.add(cleanValue)
              }
            }
          } else {
            // Si grupo es un string simple, tratarlo como un solo valor
            const cleanValue = cleanGroupValue(grupoStr)
            if (cleanValue) {
              grupoSet.add(cleanValue)
            }
          }
        }
      } catch (error) {
        console.error("Error procesando grupo:", error, student.grupo)
      }
    }
  })

  // Agregar algunos valores predeterminados si no hay suficientes opciones
  const defaultGroups = ["Coro", "Orquesta", "Solfeo", "Teoría", "Ensamble"]
  if (grupoSet.size < 3) {
    defaultGroups.forEach((group) => grupoSet.add(group))
  }

  // Convertir el Set a un Array y ordenarlo alfabéticamente
  return Array.from(grupoSet).sort()
})

// Keep original computed properties but add verification after setting
const capitalizedNombre = computed({
  get: () => newStudent.value.nombre,
  set: (val: string) => {
    newStudent.value.nombre = val.charAt(0).toUpperCase() + val.slice(1)
    // Trigger verification on every change if both fields are filled
    if (newStudent.value.nombre && newStudent.value.apellido) {
      verifyStudentExists()
    }
  },
})

const capitalizedApellido = computed({
  get: () => newStudent.value.apellido,
  set: (val: string) => {
    newStudent.value.apellido = val.charAt(0).toUpperCase() + val.slice(1)
    // Trigger verification on every change if both fields are filled
    if (newStudent.value.nombre && newStudent.value.apellido) {
      verifyStudentExists()
    }
  },
})

const capitalizedInstrumento = computed({
  get: () => newStudent.value.instrumento,
  set: (val: string) => {
    newStudent.value.instrumento = val.charAt(0).toUpperCase() + val.slice(1)
  },
})

const capitalizedDireccion = computed({
  get: () => newStudent.value.direccion,
  set: (val: string) => {
    newStudent.value.direccion = val.charAt(0).toUpperCase() + val.slice(1)
  },
})

const capitalizedObservaciones = computed({
  get: () => newStudent.value.observaciones,
  set: (val: string) => {
    newStudent.value.observaciones = val.charAt(0).toUpperCase() + val.slice(1)
  },
})

const localStorageKey = "newStudentData"

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
  {deep: true}
)

const isLoading = ref(false)
const error = ref<string | null>(null)

const clearForm = () => {
  newStudent.value = {
    nombre: "",
    apellido: "",
    instrumento: "",
    edad: "",
    tlf: "",
    email: "",
    direccion: "",
    observaciones: "",
    grupo: [], // Asegurar que grupo sea un array vacío al limpiar el formulario
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Clear localStorage as well to prevent auto-filling cleared form
  localStorage.removeItem(localStorageKey)
}

const handleSubmit = async () => {
  try {
    console.log("[NewStudentView] handleSubmit: Starting form submission")
    console.log(
      "[NewStudentView] handleSubmit: Form data:",
      JSON.stringify(newStudent.value, null, 2)
    )

    // Check if fields are correctly filled
    if (!newStudent.value.nombre || !newStudent.value.apellido) {
      error.value = "Nombre y apellido son obligatorios"
      showNotification(error.value || "Error desconocido", "error")
      console.log("[NewStudentView] handleSubmit: Validation failed - missing name or surname")
      return
    }

    isLoading.value = true
    error.value = null

    console.log("[NewStudentView] handleSubmit: Validation passed, proceeding...")

    // Check if we're updating an existing student
    if (isEditingExistingStudent.value && matchedStudent.value) {
      console.log("[NewStudentView] handleSubmit: Updating existing student")
      // Preserve the ID for updating
      newStudent.value.id = matchedStudent.value.id

      // Ensure grupo is always an array before updating
      if (!Array.isArray(newStudent.value.grupo)) {
        newStudent.value.grupo = newStudent.value.grupo ? [newStudent.value.grupo] : []
      }
      // Update the student with proper ID handling
      // Primero extraemos el ID y luego actualizamos el resto de campos
      const {id: _id, ...studentData} = newStudent.value
      await studentsStore.updateStudent(matchedStudent.value.id, studentData)
      showNotification(
        `Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} actualizado con éxito`
      )
      clearForm()
      isEditingExistingStudent.value = false
      matchedStudent.value = null
      console.log("[NewStudentView] handleSubmit: Student updated successfully")
      return
    }
    // Otherwise proceed with duplicate check as before
    // Use the students array directly from the store state
    let students: Student[] = []
    try {
      // Make sure students are loaded in the store before checking
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents()
      }

      // Use the students array from the store state
      students = studentsStore.students

      // Make sure students is an array
      if (!Array.isArray(students)) {
        console.error("Students data is not an array:", students)
        students = []
      }
    } catch (err) {
      console.error("Error getting students:", err)
      students = []
    }

    // Normalize values for comparison
    const normalizedNombre = newStudent.value.nombre.toLowerCase().trim()
    const normalizedApellido = newStudent.value.apellido.toLowerCase().trim()
    const normalizedEdad = newStudent.value.edad.toString().trim()
    const normalizedInstrumento = newStudent.value.instrumento.toLowerCase().trim()

    // Improved duplicate check with better handling of edge cases
    const existingStudent = students.find((student) => {
      const studentNombre = (student.nombre || "").toLowerCase().trim()
      const studentApellido = (student.apellido || "").toLowerCase().trim()
      const studentEdad = (student.edad || "").toString().trim()
      const studentInstrumento = (student.instrumento || "").toLowerCase().trim()

      const nameMatches =
        studentNombre === normalizedNombre && studentApellido === normalizedApellido

      const edadMatches = !normalizedEdad || !studentEdad || normalizedEdad === studentEdad

      const instrumentoMatches =
        !normalizedInstrumento ||
        !studentInstrumento ||
        normalizedInstrumento === studentInstrumento

      return nameMatches && edadMatches && instrumentoMatches
    })
    if (existingStudent) {
      error.value = `Ya existe un alumno con el nombre ${existingStudent.nombre} ${existingStudent.apellido}`
      showNotification(error.value || "Error desconocido", "error")
      isLoading.value = false
      console.log("[NewStudentView] handleSubmit: Duplicate student found, aborting")
      return
    }

    console.log("[NewStudentView] handleSubmit: No duplicates found, proceeding with creation")

    // If no duplicates found, proceed with adding student
    // Ensure grupo is always stored as an array
    if (!Array.isArray(newStudent.value.grupo)) {
      newStudent.value.grupo = newStudent.value.grupo ? [newStudent.value.grupo] : []
    }

    console.log(
      "[NewStudentView] handleSubmit: Final data before store call:",
      JSON.stringify(newStudent.value, null, 2)
    )

    await studentsStore.addStudent(newStudent.value)

    console.log("[NewStudentView] handleSubmit: Student added successfully to store")

    showNotification(
      `Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} guardado con éxito`
    )
    clearForm()
    isEditingExistingStudent.value = false
    matchedStudent.value = null
  } catch (err: any) {
    console.error("[NewStudentView] handleSubmit: Error occurred:", err)
    console.error("[NewStudentView] handleSubmit: Error details:", err.message, err.code, err.stack)
    error.value = err.message || "Error al crear el alumno"
    showNotification(error.value || "Error desconocido", "error")
  } finally {
    isLoading.value = false
    console.log("[NewStudentView] handleSubmit: Process completed, loading set to false")
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
    // Use the students array directly from the store state
    let students: Student[] = []

    // Make sure students are loaded in the store before checking
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }

    // Use the students array from the store state
    students = studentsStore.students

    if (!Array.isArray(students)) {
      console.error("Students is not an array:", students)
      students = []
    }

    const normalizedNombre = normalizeText(newStudent.value.nombre)
    const normalizedApellido = normalizeText(newStudent.value.apellido)

    const matchingStudents = students.filter((student) => {
      if (!student.nombre || !student.apellido) return false
      const studentNombreNorm = normalizeText(student.nombre)
      const studentApellidoNorm = normalizeText(student.apellido)
      return studentNombreNorm === normalizedNombre && studentApellidoNorm === normalizedApellido
    })

    if (matchingStudents.length > 0) {
      matchedStudent.value = matchingStudents[0]
      showNotification(
        `¡ATENCIÓN! Alumno ya registrado: ${matchedStudent.value!.nombre} ${matchedStudent.value!.apellido}`,
        "warning"
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
    console.error("Error verifying student:", err)
  }
}

// Function to populate form with existing student data
const populateFormWithStudentData = (student: Student) => {
  // Keep the current name and surname but populate other fields
  const currentNombre = newStudent.value.nombre
  const currentApellido = newStudent.value.apellido

  // Normalize the grupo data before populating
  let normalizedGrupo = []

  // Handle different formats of grupo data
  if (student.grupo) {
    if (Array.isArray(student.grupo)) {
      normalizedGrupo = [...student.grupo]
    } else if (typeof student.grupo === "string") {
      // Parse string format if it looks like an array "[item1,item2]"
      if (student.grupo.startsWith("[") && student.grupo.endsWith("]")) {
        try {
          const parsed = JSON.parse(student.grupo)
          normalizedGrupo = Array.isArray(parsed) ? parsed : [student.grupo]
        } catch (e) {
          normalizedGrupo = [student.grupo] // If parsing fails, treat as single item
        }
      } else {
        normalizedGrupo = [student.grupo] // Single string item
      }
    }
  }

  // Populate with student data
  newStudent.value = {
    ...student,
    // Update dates to be Date objects
    createdAt: new Date(student.createdAt),
    updatedAt: new Date(),
    // Ensure grupo is always an array
    grupo: normalizedGrupo,
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
    instrumento: "",
    edad: "",
    tlf: "",
    email: "",
    direccion: "",
    observaciones: "",
    grupo: [], // Aseguramos que grupo sea un array vacío
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
          : 'bg-red-100 text-red-800 border-l-4 border-red-500',
      ]"
    >
      {{ notification.message }}
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit" @keydown.enter.prevent="handleSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Nombre -->
        <div class="sm:col-span-1">
          <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Nombre</label
          >
          <input
            id="nombre"
            v-model="capitalizedNombre"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Apellido -->
        <div class="sm:col-span-1">
          <label for="apellido" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Apellido</label
          >
          <input
            id="apellido"
            v-model="capitalizedApellido"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Edad -->
        <div>
          <label for="edad" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Edad</label
          >
          <input
            id="edad"
            v-model="newStudent.edad"
            type="number"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <!-- Instrumento -->
        <div>
          <label
            for="instrumento"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Instrumento</label
          >
          <input
            id="instrumento"
            v-model="capitalizedInstrumento"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Clase/Grupo -->
        <div>
          <label for="grupo" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Clase</label
          >
          <select
            id="grupo"
            v-model="newStudent.grupo"
            multiple
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option v-for="grupoName in availableGrupo" :key="grupoName" :value="grupoName">
              {{ grupoName }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Puedes seleccionar múltiples clases (Ctrl+click)
          </p>
        </div>

        <!-- Teléfono -->
        <div>
          <label for="tlf" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Teléfono</label
          >
          <input
            id="tlf"
            v-model="newStudent.tlf"
            type="tel"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Email</label
          >
          <input
            id="email"
            v-model="newStudent.email"
            type="email"
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <!-- Dirección -->
      <div>
        <label for="direccion" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Dirección</label
        >
        <textarea
          id="direccion"
          v-model="capitalizedDireccion"
          rows="3"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <!-- Observaciones -->
      <div>
        <label
          for="observaciones"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Observaciones</label
        >
        <textarea
          id="observaciones"
          v-model="capitalizedObservaciones"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div
        v-if="error"
        class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg"
      >
        {{ error }}
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button type="button" class="btn btn-outline" @click="router.push({name: 'Students'})">
          Cancelar
        </button>

        <button
          type="submit"
          :disabled="isLoading"
          class="fixed right-6 top-1/2 transform -translate-y-1/2 btn btn-primary rounded-full h-12 w-12 flex items-center justify-center z-10 shadow-lg"
        >
          <span v-if="isLoading" class="animate-spin">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.419 15m0 0H15"
              />
            </svg>
          </span>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        </button>
      </div>
    </form>

    <!-- Add status indicator for matched student -->
    <div
      v-if="isEditingExistingStudent && matchedStudent"
      class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-4 rounded-lg mb-4"
    >
      Editando alumno existente: {{ matchedStudent!.nombre }} {{ matchedStudent!.apellido }}
    </div>
  </div>
</template>
