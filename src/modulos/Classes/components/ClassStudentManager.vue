<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {useStudentsStore} from "../../Students/store/students"
import {
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/vue/24/outline"

const props = defineProps({
  classId: {
    type: String,
    required: true,
  },
  studentIds: {
    type: Array,
    default: () => [],
    // Validador para asegurar que sea siempre un array
    validator: (value) => {
      return Array.isArray(value)
    },
  },
})

const emit = defineEmits(["update", "close"])

const studentsStore = useStudentsStore()

// Inicialización segura del estado
const selectedStudentIds = ref(Array.isArray(props.studentIds) ? [...props.studentIds] : [])

const searchQuery = ref("")
const isLoading = ref(false)
const multiSelectMode = ref(false)
const selectedForAddition = ref<string[]>([])
const searchInput = ref<HTMLInputElement | null>(null)

// Computed properties for filtering students
const availableStudents = computed(() => {
  return studentsStore.students.filter((student) => !selectedStudentIds.value.includes(student.id))
})

const filteredAvailableStudents = computed(() => {
  if (!searchQuery.value) return availableStudents.value

  const query = searchQuery.value.toLowerCase()
  return availableStudents.value.filter((student) => {
    const fullName = `${student.nombre || ""} ${student.apellido || ""}`.toLowerCase().trim()
    const email = (student.email || "").toLowerCase()
    const instrument = (student.instrumento || "").toLowerCase()
    return fullName.includes(query) || email.includes(query) || instrument.includes(query)
  })
})

const selectedStudents = computed(() => {
  return studentsStore.students.filter((student) => selectedStudentIds.value.includes(student.id))
})

const filteredSelectedStudents = computed(() => {
  if (!searchQuery.value) return selectedStudents.value

  const query = searchQuery.value.toLowerCase()
  return selectedStudents.value.filter((student) => {
    const fullName = `${student.nombre || ""} ${student.apellido || ""}`.toLowerCase().trim()
    const email = (student.email || "").toLowerCase()
    const instrument = (student.instrumento || "").toLowerCase()
    return fullName.includes(query) || email.includes(query) || instrument.includes(query)
  })
})

// Helper function to format student names
const formatStudentName = (student: any) => {
  const firstName = (student.nombre || "").trim()
  const lastName = (student.apellido || "").trim()

  if (!firstName && !lastName) {
    return "👤 Sin nombre asignado"
  }

  // Si solo tiene un nombre, lo mostramos
  if (!lastName) return firstName
  if (!firstName) return lastName

  return `${firstName} ${lastName}`
}

// Helper function to get student secondary info
const getStudentSecondaryInfo = (student: any) => {
  const info = []

  if (student.instrumento) {
    info.push(`🎵 ${student.instrumento}`)
  }

  if (student.nivel) {
    info.push(`📚 ${student.nivel}`)
  }

  if (student.email) {
    info.push(`📧 ${student.email}`)
  }

  if (student.telefono) {
    info.push(`📱 ${student.telefono}`)
  }

  if (info.length === 0) {
    return "📝 Sin información adicional"
  }

  return info.join(" • ")
}

// Methods
const addStudent = (studentId: string) => {
  if (!selectedStudentIds.value.includes(studentId)) {
    // Verificar que el estudiante exista en el store
    const studentExists = studentsStore.students.some((s) => s.id === studentId)
    if (!studentExists) {
      console.warn(
        `Advertencia: Se intentó agregar un estudiante con ID ${studentId} que no existe en el store`
      )
      return
    }
    // Agregar el estudiante a la lista de seleccionados
    selectedStudentIds.value.push(studentId)
    console.log(`Estudiante agregado a la lista temporal: ${studentId}`)
    // NO limpiar búsqueda para permitir múltiples selecciones con el mismo filtro
    // searchQuery.value = '';
  }
}

const toggleStudentSelection = (studentId: string) => {
  const index = selectedForAddition.value.indexOf(studentId)
  if (index === -1) {
    // Verificar que el estudiante exista antes de seleccionarlo
    const studentExists = studentsStore.students.some((s) => s.id === studentId)
    if (!studentExists) {
      console.warn(
        `Advertencia: Se intentó seleccionar un estudiante con ID ${studentId} que no existe en el store`
      )
      return
    }
    selectedForAddition.value.push(studentId)
  } else {
    selectedForAddition.value.splice(index, 1)
  }
}

const addSelectedStudents = () => {
  // Verificar estudiantes válidos antes de agregarlos
  const validStudentIds = selectedForAddition.value.filter((id) => {
    const studentExists = studentsStore.students.some((s) => s.id === id)
    if (!studentExists) {
      console.warn(`Estudiante con ID ${id} no encontrado, no se agregará`)
    }
    return studentExists
  })

  for (const studentId of validStudentIds) {
    if (!selectedStudentIds.value.includes(studentId)) {
      selectedStudentIds.value.push(studentId)
      console.log(`Estudiante agregado masivamente: ${studentId}`)
    }
  }
  selectedForAddition.value = []
  multiSelectMode.value = false
  // NO limpiar búsqueda para permitir múltiples operaciones con el mismo filtro
  // searchQuery.value = '';
}

const removeStudent = (studentId: string) => {
  selectedStudentIds.value = selectedStudentIds.value.filter((id) => id !== studentId)
}

// Función segura para guardar los cambios de estudiantes
const saveChanges = async () => {
  if (isLoading.value) return // Prevenir múltiples envíos

  isLoading.value = true
  try {
    // Validaciones previas al guardado
    if (!props.classId) {
      throw new Error("No se ha especificado una clase válida")
    }

    if (!Array.isArray(selectedStudentIds.value)) {
      throw new Error("La lista de estudiantes no es válida")
    }

    // Limpiar IDs inválidos antes de guardar
    const prevLength = selectedStudentIds.value.length
    selectedStudentIds.value = selectedStudentIds.value.filter((id) =>
      studentsStore.students.some((student) => student.id === id)
    )
    if (selectedStudentIds.value.length !== prevLength) {
      console.warn("Se eliminaron IDs de estudiantes inválidos antes de guardar.")
    }

    // Verificar que todos los IDs sean válidos y existan en el store
    const validStudents = selectedStudentIds.value.filter((id) => {
      const studentExists = studentsStore.students.some((s) => s.id === id)
      if (!studentExists) {
        console.warn(`Estudiante con ID ${id} no encontrado en el store`)
      }
      return id && typeof id === "string" && studentExists
    })

    if (validStudents.length !== selectedStudentIds.value.length) {
      throw new Error("Algunos estudiantes seleccionados no son válidos o ya no existen")
    }

    // Eliminar duplicados y ordenar
    const validatedStudentIds = [...new Set(validStudents)].sort()

    // Verificar cambios
    const currentIds = new Set(props.studentIds)
    const newIds = new Set(validatedStudentIds)

    const added = validatedStudentIds.filter((id) => !currentIds.has(id))
    const removed = Array.from(currentIds).filter((id) => !newIds.has(id))
    const hasChanges = added.length > 0 || removed.length > 0

    if (!hasChanges) {
      console.log("No hay cambios en la lista de estudiantes")
      emit("close")
      return
    }

    // Crear resumen de cambios para el log
    const changesSummary = {
      classId: props.classId,
      previousCount: props.studentIds.length,
      newCount: validatedStudentIds.length,
      added: added.map((id) => {
        const student = studentsStore.students.find((s) => s.id === id)
        return {
          id,
          name: student ? formatStudentName(student) : "Estudiante desconocido",
        }
      }),
      removed: removed.map((id) => {
        const student = studentsStore.students.find((s) => s.id === id)
        return {
          id,
          name: student ? formatStudentName(student) : "Estudiante desconocido",
        }
      }),
    } // Emitir evento con los IDs validados y esperar respuesta
    try {
      // Mostrar info de debug
      console.log("Guardando estudiantes:", {
        estudiantes: validatedStudentIds,
        totalEstudiantes: validatedStudentIds.length,
        detalles: changesSummary,
      })

      // Verificar duplicados una última vez
      const uniqueIds = [...new Set(validatedStudentIds)]
      if (uniqueIds.length !== validatedStudentIds.length) {
        console.warn("Se detectaron IDs duplicados, se eliminarán antes de guardar")
      }

      // Llamada al evento update con los IDs únicos
      await emit("update", uniqueIds)
      console.log("ClassStudentManager: Estudiantes actualizados correctamente", changesSummary)

      // No cerramos aquí, dejamos que el evento de éxito lo haga
      setTimeout(() => {
        if (isLoading.value) {
          console.log("El modal no se ha cerrado, forzando cierre...")
          emit("close")
        }
      }, 2000) // Si después de 2 segundos el modal sigue abierto, lo cerramos
    } catch (updateError) {
      console.error("Error durante la actualización:", updateError)
      throw new Error("No se pudo completar la actualización de estudiantes")
    }
  } catch (error) {
    console.error("Error al guardar cambios:", error)
    throw error // Re-throw para que el componente padre pueda manejarlo
  } finally {
    isLoading.value = false
  }
}

const toggleMultiSelectMode = () => {
  multiSelectMode.value = !multiSelectMode.value
  if (!multiSelectMode.value) {
    selectedForAddition.value = []
  }
}

onMounted(async () => {
  if (studentsStore.students.length === 0) {
    isLoading.value = true
    try {
      await studentsStore.fetchStudents()
    } catch (error) {
      console.error("Error al cargar estudiantes:", error)
    } finally {
      isLoading.value = false
    }
  }

  // Limpiar IDs inválidos después de cargar estudiantes
  const prevLength = selectedStudentIds.value.length
  selectedStudentIds.value = selectedStudentIds.value.filter((id) =>
    studentsStore.students.some((student) => student.id === id)
  )
  if (selectedStudentIds.value.length !== prevLength) {
    console.warn("Se eliminaron IDs de estudiantes inválidos de la selección inicial.")
  }

  // Enfocar el campo de búsqueda después de montar el componente
  setTimeout(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  }, 100) // Pequeño delay para asegurar que el DOM esté completamente renderizado
})
</script>

<template>
  <div>
    <!-- Search Bar -->
    <div class="mb-6 relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, instrumento o email..."
        class="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
        autofocus
      />
      <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Available Students -->
      <div>
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-medium text-gray-700 dark:text-gray-300">
            Estudiantes Disponibles ({{ filteredAvailableStudents.length }})
          </h3>
          <button
            class="text-sm px-2 py-1 rounded-md"
            :class="
              multiSelectMode
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            "
            @click="toggleMultiSelectMode"
          >
            {{ multiSelectMode ? "Cancelar selección" : "Selección múltiple" }}
          </button>
        </div>

        <div
          class="border border-gray-200 dark:border-gray-700 rounded-md h-64 overflow-y-auto bg-white dark:bg-gray-800"
        >
          <div v-if="isLoading" class="flex flex-col justify-center items-center h-full py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando estudiantes...</p>
          </div>
          <div
            v-else-if="searchQuery && filteredAvailableStudents.length === 0"
            class="p-6 text-center text-gray-500 dark:text-gray-400"
          >
            <MagnifyingGlassIcon class="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p class="text-sm">
              No se encontraron estudiantes con "<strong>{{ searchQuery }}</strong
              >"
            </p>
          </div>
          <div
            v-else-if="filteredAvailableStudents.length === 0"
            class="p-6 text-center text-gray-500 dark:text-gray-400"
          >
            <span class="text-2xl mb-2 block">✅</span>
            <p class="text-sm">Todos los estudiantes ya están asignados a esta clase</p>
          </div>
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="student in filteredAvailableStudents"
              :key="student.id"
              class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="multiSelectMode ? toggleStudentSelection(student.id) : addStudent(student.id)"
            >
              <div class="flex items-center">
                <div v-if="multiSelectMode" class="mr-3">
                  <div
                    class="w-5 h-5 border rounded flex items-center justify-center"
                    :class="
                      selectedForAddition.includes(student.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    "
                  >
                    <CheckIcon
                      v-if="selectedForAddition.includes(student.id)"
                      class="h-4 w-4 text-white"
                    />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ formatStudentName(student) }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {{ getStudentSecondaryInfo(student) }}
                  </div>
                </div>
              </div>
              <button
                v-if="!multiSelectMode"
                class="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex-shrink-0"
                :title="`Agregar ${formatStudentName(student)} a la clase`"
              >
                <UserPlusIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="multiSelectMode && selectedForAddition.length > 0" class="mt-3 flex justify-end">
          <button
            class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
            @click="addSelectedStudents"
          >
            <UserPlusIcon class="h-4 w-4" />
            Agregar {{ selectedForAddition.length }} estudiante{{
              selectedForAddition.length !== 1 ? "s" : ""
            }}
          </button>
        </div>
      </div>

      <!-- Selected Students -->
      <div>
        <h3 class="font-medium mb-3 text-gray-700 dark:text-gray-300">
          Estudiantes Asignados ({{ filteredSelectedStudents.length }})
        </h3>

        <div
          class="border border-gray-200 dark:border-gray-700 rounded-md h-64 overflow-y-auto bg-white dark:bg-gray-800"
        >
          <div v-if="isLoading" class="flex flex-col justify-center items-center h-full py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando estudiantes...</p>
          </div>
          <div
            v-else-if="searchQuery && filteredSelectedStudents.length === 0"
            class="p-6 text-center text-gray-500 dark:text-gray-400"
          >
            <MagnifyingGlassIcon class="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p class="text-sm">
              No se encontraron estudiantes asignados con "<strong>{{ searchQuery }}</strong
              >"
            </p>
          </div>
          <div
            v-else-if="filteredSelectedStudents.length === 0"
            class="p-6 text-center text-gray-500 dark:text-gray-400"
          >
            <span class="text-2xl mb-2 block">👥</span>
            <p class="text-sm">No hay estudiantes asignados a esta clase</p>
            <p class="text-xs mt-1">Agrega estudiantes desde la columna de la izquierda</p>
          </div>
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="student in filteredSelectedStudents"
              :key="student.id"
              class="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div class="flex-1 min-w-0 mr-3">
                <div class="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ formatStudentName(student) }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ getStudentSecondaryInfo(student) }}
                </div>
              </div>
              <button
                class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                :title="`Quitar ${formatStudentName(student)} de la clase`"
                @click="removeStudent(student.id)"
              >
                <UserMinusIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-3 pt-6">
      <button
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        @click="emit('close')"
      >
        Cancelar
      </button>
      <button
        :disabled="isLoading"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        @click="saveChanges"
      >
        {{ isLoading ? "Guardando..." : "Guardar Cambios" }}
      </button>
    </div>
  </div>
</template>
