<script setup lang="ts">
import {ref, computed, onMounted, reactive} from "vue"
import {useInstrumentoStore} from "../store/instrumento"
import {useStudentsStore} from "../../Students/store/students"
import InstrumentForm from "../components/InstrumentForm.vue"
import InstrumentDetails from "../components/InstrumentDetails.vue"
import type {Instrument} from "../types/instrumentsTypes"
import {
  PlusIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/vue/24/outline"

// Stores
const instrumentStore = useInstrumentoStore()
const studentsStore = useStudentsStore()

// Estado local
const instruments = ref<Instrument[]>([])
const selectedInstrument = ref<Instrument | null>(null)
const isLoading = ref(false)
const isEditing = ref(false)
const isCreating = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref("")
const filterFamily = ref("")
const availableFamilies = ref<string[]>([])

// Paginación
const pagination = reactive({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
})

// Ordenamiento
const sorting = reactive({
  field: "nombre",
  direction: "asc" as "asc" | "desc",
})

// Notificación
const notification = reactive({
  show: false,
  message: "",
  type: "success" as "success" | "error" | "info",
})

// Cargar datos iniciales
onMounted(async () => {
  await loadData()
})

// Cargar instrumentos y estudiantes
const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([instrumentStore.fetchInstruments(), studentsStore.fetchStudents()])

    instruments.value = instrumentStore.instruments
    availableFamilies.value = [
      ...new Set(instruments.value.map((i) => i.familia).filter(Boolean) as string[]),
    ]
    pagination.totalItems = instruments.value.length
  } catch (err: any) {
    console.error("Error cargando datos:", err)
    error.value = `Error cargando datos: ${err.message}`
    showNotification("Error al cargar datos", "error")
  } finally {
    isLoading.value = false
  }
}

// Filtrar instrumentos según búsqueda y familia
const filteredInstruments = computed(() => {
  let result = instruments.value

  // Filtrar por familia
  if (filterFamily.value) {
    result = result.filter((i) => i.familia === filterFamily.value)
  }

  // Filtrar por término de búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (i) =>
        i.nombre?.toLowerCase().includes(query) ||
        i.marca?.toLowerCase().includes(query) ||
        i.serial?.toLowerCase().includes(query)
    )
  }

  // Aplicar ordenamiento
  result = [...result].sort((a, b) => {
    const fieldA = a[sorting.field as keyof Instrument] || ""
    const fieldB = b[sorting.field as keyof Instrument] || ""

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sorting.direction === "asc"
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA)
    }

    return 0
  })

  // Actualizar total para paginación
  pagination.totalItems = result.length

  return result
})

// Instrumentos paginados
const paginatedInstruments = computed(() => {
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
  const endIndex = startIndex + pagination.itemsPerPage
  return filteredInstruments.value.slice(startIndex, endIndex)
})

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(pagination.totalItems / pagination.itemsPerPage)
})

// Cambiar página
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    pagination.currentPage = page
  }
}

// Cambiar ordenamiento
const changeSort = (field: string) => {
  if (sorting.field === field) {
    sorting.direction = sorting.direction === "asc" ? "desc" : "asc"
  } else {
    sorting.field = field
    sorting.direction = "asc"
  }
}

// Mostrar notificación
const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
  notification.message = message
  notification.type = type
  notification.show = true

  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    notification.show = false
  }, 3000)
}

// Mostrar detalles de un instrumento
const viewInstrument = async (instrument: Instrument) => {
  selectedInstrument.value = instrument
  isEditing.value = false
  isCreating.value = false
}

// Iniciar edición de un instrumento
const editInstrument = () => {
  if (!selectedInstrument.value) return
  isEditing.value = true
  isCreating.value = false
}

// Iniciar creación de un nuevo instrumento
const createNewInstrument = () => {
  selectedInstrument.value = null
  isEditing.value = false
  isCreating.value = true
}

// Guardar instrumento (crear o actualizar)
const saveInstrument = async (instrumentData: Partial<Instrument>) => {
  isLoading.value = true
  error.value = null

  try {
    // Verificar que al menos el nombre esté presente
    if (!instrumentData.nombre) {
      throw new Error("El nombre del instrumento es obligatorio")
    }

    if (isCreating.value) {
      // Crear nuevo instrumento
      const newInstrument = await instrumentStore.addInstrument(
        instrumentData as Omit<Instrument, "id">
      )
      selectedInstrument.value = newInstrument
      instruments.value.push(newInstrument)
      showNotification("Instrumento creado con éxito", "success")
    } else if (isEditing.value && selectedInstrument.value) {
      // Actualizar instrumento existente
      await instrumentStore.updateInstrument(selectedInstrument.value.id, instrumentData)

      // Actualizar la vista
      const index = instruments.value.findIndex((i) => i.id === selectedInstrument.value?.id)
      if (index !== -1) {
        instruments.value[index] = {...instruments.value[index], ...instrumentData}
        selectedInstrument.value = instruments.value[index]
      }
      showNotification("Instrumento actualizado con éxito", "success")
    }

    isEditing.value = false
    isCreating.value = false
  } catch (err: any) {
    console.error("Error guardando instrumento:", err)
    error.value = `Error: ${err.message}`
    showNotification(`Error al guardar: ${err.message}`, "error")
  } finally {
    isLoading.value = false
  }
}

// Cancelar edición o creación
const cancelEdit = () => {
  isEditing.value = false
  isCreating.value = false
}

// Eliminar instrumento
const deleteInstrument = async () => {
  if (!selectedInstrument.value) return

  // Mejorado: usando una variable reactiva
  const confirmDelete = confirm(
    `¿Está seguro que desea eliminar el instrumento "${selectedInstrument.value.nombre}"?`
  )
  if (!confirmDelete) return

  isLoading.value = true

  try {
    await instrumentStore.deleteInstrument(selectedInstrument.value.id)
    instruments.value = instruments.value.filter((i) => i.id !== selectedInstrument.value?.id)
    selectedInstrument.value = null
    showNotification("Instrumento eliminado con éxito", "success")
  } catch (err: any) {
    console.error("Error eliminando instrumento:", err)
    error.value = `Error: ${err.message}`
    showNotification(`Error al eliminar: ${err.message}`, "error")
  } finally {
    isLoading.value = false
  }
}

// Exportar datos a CSV
const exportToCSV = () => {
  // Crear cabeceras
  const headers = ["Nombre", "Marca", "Serial", "Familia", "Estado"]

  // Mapear datos
  const data = filteredInstruments.value.map((instrument) => [
    instrument.nombre || "",
    instrument.marca || "",
    instrument.serial || "",
    instrument.familia || "",
    instrument.estado || "",
  ])

  // Crear contenido
  const csvContent = [headers.join(","), ...data.map((row) => row.join(","))].join("\n")

  // Crear blob y descargar
  const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"})
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `instrumentos_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showNotification("Datos exportados a CSV", "success")
}

// Mapeo de estados a clases de color
const getStatusClass = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    excelente: "bg-green-100 text-green-800",
    bueno: "bg-blue-100 text-blue-800",
    regular: "bg-yellow-100 text-yellow-800",
    funcional: "bg-orange-100 text-orange-800",
    necesitaReparacion: "bg-red-100 text-red-800",
    malo: "bg-red-100 text-red-800",
  }

  return statusMap[status || ""] || "bg-gray-100 text-gray-800"
}
</script>

<template>
  <div class="instrument-management p-2 sm:p-4 max-w-7xl mx-auto">
    <div
      class="mb-4 sm:mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-2 sm:gap-4"
    >
      <h1 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
        Gestión de Instrumentos
      </h1>
      <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
        <button
          class="w-full sm:w-auto px-2 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
          @click="createNewInstrument"
        >
          <PlusIcon class="w-5 h-5" />
          <span class="hidden sm:inline ml-1">Nuevo Instrumento</span>
        </button>
        <button
          class="w-full sm:w-auto px-2 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
          @click="exportToCSV"
        >
          <ArrowDownTrayIcon class="w-5 h-5" />
          <span class="hidden sm:inline ml-1">Exportar CSV</span>
        </button>
        <button
          class="w-full sm:w-auto px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          @click="$router.push({name: 'InstrumentAssign'})"
        >
          <ClipboardDocumentCheckIcon class="w-5 h-5" />
          <span class="hidden sm:inline ml-1">Asignar Instrumento</span>
        </button>
      </div>
    </div>

    <!-- Notificación -->
    <div
      v-if="notification.show"
      :class="{
        'fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-md transition-opacity duration-300': true,
        'bg-green-100 text-green-800 border border-green-200': notification.type === 'success',
        'bg-red-100 text-red-800 border border-red-200': notification.type === 'error',
        'bg-blue-100 text-blue-800 border border-blue-200': notification.type === 'info',
      }"
    >
      <div class="flex items-center">
        <span class="material-icons mr-2">
          {{
            notification.type === "success"
              ? "check_circle"
              : notification.type === "error"
                ? "error"
                : "info"
          }}
        </span>
        <span>{{ notification.message }}</span>
        <button class="ml-4 text-gray-500 hover:text-gray-700" @click="notification.show = false">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando...</span>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        class="mt-2 px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
        @click="loadData"
      >
        Reintentar
      </button>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-4">
      <!-- Panel izquierdo: Filtros y lista -->
      <div class="flex flex-col lg:w-2/3">
        <!-- Filtros -->
        <div
          class="bg-white p-2 sm:p-4 rounded-md shadow-sm mb-2 sm:mb-4 flex flex-col md:flex-row gap-2 sm:gap-4"
        >
          <div class="flex-1">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-icons text-gray-400 text-xs sm:text-sm">search</span>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Nombre, marca o serial..."
                class="block w-full pl-9 pr-2 py-1.5 sm:pl-10 sm:pr-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
              />
            </div>
          </div>
          <div class="flex-1">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Familia</label>
            <select
              v-model="filterFamily"
              class="block w-full py-1.5 sm:py-2 px-2 sm:px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value="">Todas las familias</option>
              <option v-for="family in availableFamilies" :key="family" :value="family">
                {{ family }}
              </option>
            </select>
          </div>
        </div>

        <!-- Lista de instrumentos -->
        <div class="bg-white rounded-md shadow-sm overflow-x-auto">
          <h2 class="text-base sm:text-lg font-semibold p-2 sm:p-4 border-b">
            Inventario de Instrumentos
          </h2>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    @click="changeSort('nombre')"
                  >
                    <div class="flex items-center">
                      Nombre
                      <span v-if="sorting.field === 'nombre'" class="material-icons ml-1 text-xs">
                        {{ sorting.direction === "asc" ? "arrow_upward" : "arrow_downward" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    @click="changeSort('marca')"
                  >
                    <div class="flex items-center">
                      Marca
                      <span v-if="sorting.field === 'marca'" class="material-icons ml-1 text-xs">
                        {{ sorting.direction === "asc" ? "arrow_upward" : "arrow_downward" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    @click="changeSort('serial')"
                  >
                    <div class="flex items-center">
                      Serial
                      <span v-if="sorting.field === 'serial'" class="material-icons ml-1 text-xs">
                        {{ sorting.direction === "asc" ? "arrow_upward" : "arrow_downward" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    @click="changeSort('familia')"
                  >
                    <div class="flex items-center">
                      Familia
                      <span v-if="sorting.field === 'familia'" class="material-icons ml-1 text-xs">
                        {{ sorting.direction === "asc" ? "arrow_upward" : "arrow_downward" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    @click="changeSort('estado')"
                  >
                    <div class="flex items-center">
                      Estado
                      <span v-if="sorting.field === 'estado'" class="material-icons ml-1 text-xs">
                        {{ sorting.direction === "asc" ? "arrow_upward" : "arrow_downward" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    ¿Asignado?
                  </th>
                  <th
                    class="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="instrument in paginatedInstruments"
                  :key="instrument.id"
                  class="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap">{{ instrument.nombre }}</td>
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap">{{ instrument.marca }}</td>
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap">{{ instrument.serial }}</td>
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap">{{ instrument.familia }}</td>
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap">
                    <span
                      :class="[getStatusClass(instrument.estado), 'px-2 py-1 text-xs rounded-full']"
                    >
                      {{ instrument.estado }}
                    </span>
                  </td>
                  <td class="px-2 sm:px-4 py-2 whitespace-nowrap text-center">
                    <span
                      :class="[
                        instrument.isAssign
                          ? 'bg-green-100 text-green-800'
                          : 'bg-pink-100 text-pink-800',
                        'px-2 py-1 text-xs rounded-full font-semibold',
                      ]"
                    >
                      {{ instrument.isAssign ? "Sí" : "No" }}
                    </span>
                  </td>
                  <td
                    class="px-2 sm:px-4 py-2 whitespace-nowrap text-center flex flex-col sm:flex-row gap-1 justify-center items-center"
                  >
                    <button
                      class="p-1 sm:px-2 sm:py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center gap-1"
                      @click.stop="viewInstrument(instrument)"
                    >
                      <EyeIcon class="w-4 h-4" />
                      <span class="hidden sm:inline">Ver</span>
                    </button>
                    <button
                      class="p-1 sm:px-2 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1"
                      @click.stop="
                        () => {
                          selectedInstrument = instrument
                          editInstrument()
                        }
                      "
                    >
                      <PencilIcon class="w-4 h-4" />
                      <span class="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      class="p-1 sm:px-2 sm:py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center gap-1"
                      @click.stop="
                        $router.push({name: 'InstrumentAssign', params: {id: instrument.id}})
                      "
                    >
                      <ClipboardDocumentCheckIcon class="w-4 h-4" />
                      <span class="hidden sm:inline">Asignar</span>
                    </button>
                    <button
                      class="p-1 sm:px-2 sm:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1"
                      @click.stop="
                        $router.push({name: 'InstrumentDetail', params: {id: instrument.id}})
                      "
                    >
                      <DocumentTextIcon class="w-4 h-4" />
                      <span class="hidden sm:inline">Historial</span>
                    </button>
                    <button
                      class="p-1 sm:px-2 sm:py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1"
                      @click.stop="
                        $router.push({name: 'InstrumentGallery', params: {id: instrument.id}})
                      "
                    >
                      <PhotoIcon class="w-4 h-4" />
                      <span class="hidden sm:inline">Galería</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="paginatedInstruments.length === 0">
                  <td colspan="7" class="px-2 sm:px-4 py-8 text-center text-gray-500">
                    No se encontraron instrumentos con los filtros actuales
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{
                (pagination.currentPage - 1) * pagination.itemsPerPage + 1
              }}</span>
              a
              <span class="font-medium">{{
                Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)
              }}</span>
              de <span class="font-medium">{{ pagination.totalItems }}</span> resultados
            </div>
            <div class="flex items-center space-x-2">
              <button
                :disabled="pagination.currentPage === 1"
                :class="[
                  'px-3 py-1 rounded-md',
                  pagination.currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
                ]"
                @click="changePage(pagination.currentPage - 1)"
              >
                Anterior
              </button>
              <div class="text-sm text-gray-700">
                Página {{ pagination.currentPage }} de {{ totalPages }}
              </div>
              <button
                :disabled="pagination.currentPage === totalPages"
                :class="[
                  'px-3 py-1 rounded-md',
                  pagination.currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
                ]"
                @click="changePage(pagination.currentPage + 1)"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: Detalle o formulario -->
      <div class="lg:w-1/3">
        <!-- Formulario de creación/edición -->
        <div v-if="isEditing || isCreating" class="bg-white p-4 rounded-md shadow-sm">
          <h2 class="text-lg font-semibold mb-4">
            {{ isCreating ? "Crear Instrumento" : "Editar Instrumento" }}
          </h2>
          <InstrumentForm
            :instrument="selectedInstrument || undefined"
            @save="saveInstrument"
            @cancel="cancelEdit"
          />
        </div>

        <!-- Detalles del instrumento seleccionado -->
        <div v-else-if="selectedInstrument" class="bg-white p-4 rounded-md shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Detalles del Instrumento</h2>
          <InstrumentDetails :instrument="selectedInstrument" />

          <div class="flex justify-between mt-6">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              @click="editInstrument"
            >
              <PencilIcon class="w-5 h-5 mr-1" /> Editar
            </button>
            <button
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              @click="deleteInstrument"
            >
              <TrashIcon class="w-5 h-5 mr-1" /> Eliminar
            </button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div
          v-else
          class="bg-white p-6 rounded-md shadow-sm flex flex-col items-center justify-center text-center h-64"
        >
          <div class="text-gray-400 mb-4">
            <span class="material-icons text-5xl">inventory</span>
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">Seleccione un instrumento</h3>
          <p class="text-gray-500 mb-4">
            Haga clic en un instrumento de la lista para ver sus detalles
          </p>
          <button
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            @click="createNewInstrument"
          >
            <PlusIcon class="w-5 h-5 mr-1" /> Nuevo Instrumento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instrument-management {
  min-height: 70vh;
}

/* Animaciones de transición */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Personalizar scrollbar para tablas */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Ajustes de tabla y botones para responsividad */
@media (max-width: 640px) {
  th,
  td {
    font-size: 10px !important;
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    line-height: 1.1 !important;
  }
  .instrument-management h1 {
    font-size: 1.1rem !important;
  }
}
</style>
