<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded shadow">
    <h1 class="text-xl font-bold mb-4">Asignar Instrumento a Alumno</h1>
    <form @submit.prevent="onSubmit">
      <div class="mb-4">
        <label class="block mb-1">Instrumento</label>
        <div
          class="w-full border rounded px-2 py-1 bg-gray-100 text-gray-700 flex items-center justify-between"
        >
          <span>
            {{
              selectedInstrument
                ? selectedInstrument.nombre + " (" + (selectedInstrument.serial || "") + ")"
                : "Instrumento no encontrado"
            }}
          </span>
          <button
            v-if="selectedInstrument"
            class="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1"
            type="button"
            @click="goToInstrumentHistory"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              />
            </svg>
            <span class="hidden sm:inline">Historial</span>
          </button>
        </div>
      </div>
      <div class="mb-4">
        <label class="block mb-1">Buscar Alumno</label>
        <input
          v-model="searchStudent"
          type="text"
          class="w-full border rounded px-2 py-1"
          placeholder="Escriba al menos 3 letras del nombre del alumno"
        />
        <ul
          v-if="studentResults.length"
          class="border rounded bg-white mt-1 max-h-40 overflow-y-auto"
        >
          <li
            v-for="alumno in studentResults"
            :key="alumno.id"
            class="px-2 py-1 hover:bg-blue-100 cursor-pointer"
            @click="
              () => {
                selectedStudentId = alumno.id
                searchStudent = alumno.nombre + ' ' + alumno.apellido
                studentResults = []
              }
            "
          >
            {{ alumno.nombre }} {{ alumno.apellido }}
          </li>
        </ul>
      </div>
      <div v-if="selectedStudentId && selectedStudent" class="mb-4 border rounded p-3 bg-gray-50">
        <h3 class="font-semibold mb-2">Ficha del Alumno</h3>
        <div><b>Nombre:</b> {{ selectedStudent.nombre }} {{ selectedStudent.apellido }}</div>
        <div><b>Instrumento actual:</b> {{ selectedStudent.instrumento || "Ninguno" }}</div>
        <div><b>Email:</b> {{ selectedStudent.email }}</div>
        <div><b>Teléfono:</b> {{ selectedStudent.phone }}</div>
        <!-- Agrega más campos si es necesario -->
      </div>
      <div class="mb-4">
        <label class="block mb-1">Contrato firmado (PDF)</label>
        <input type="file" accept="application/pdf" @change="onFileChange($event)" />
      </div>
      <div class="flex flex-col sm:flex-row justify-end gap-2 mt-6">
        <button
          type="button"
          class="px-3 py-1 bg-gray-300 rounded flex items-center justify-center"
          @click="onCancel"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span class="hidden sm:inline">Cancelar</span>
        </button>
        <button
          type="submit"
          class="px-3 py-1 bg-blue-600 text-white rounded flex items-center justify-center"
          :disabled="!selectedStudentId"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="hidden sm:inline">Asignar</span>
        </button>
      </div>
    </form>
    <div v-if="error" class="text-red-500 mt-2">{{ error }}</div>
    <div v-if="success" class="text-green-600 mt-2">Asignación realizada correctamente.</div>
  </div>
</template>

<script lang="ts" setup>
import {ref, computed, onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useInstrumentoStore} from "../store/instrumento"
import {useStudentsStore} from "../../Students/store/students"

const route = useRoute()
const router = useRouter()
const instrumentStore = useInstrumentoStore()
const studentsStore = useStudentsStore()

const instrumentos = computed(() => instrumentStore.instruments)
const alumnos = computed(() => studentsStore.students)

// Obtener el instrumento a asignar desde la ruta o el store
const selectedInstrumentId = ref("")
const selectedInstrument = ref<any>(null)

const selectedStudentId = ref("")
const contratoFile = ref<File | null>(null)
const error = ref<string | null>(null)
const success = ref(false)
const searchStudent = ref("")
const studentResults = ref<any[]>([])
const selectedStudent = computed(() => alumnos.value.find((a) => a.id === selectedStudentId.value))

onMounted(async () => {
  if (!instrumentStore.instruments.length) await instrumentStore.fetchInstruments()
  if (!studentsStore.students.length) await studentsStore.fetchStudents()
  // Extraer el id del instrumento desde la ruta (params)
  const idParam = route.params.id as string
  if (idParam) {
    selectedInstrumentId.value = idParam
    selectedInstrument.value = instrumentStore.instruments.find((i) => i.id === idParam) || null
    // Si el instrumento ya está asignado, redirigir al perfil del alumno asignado
    if (
      selectedInstrument.value &&
      selectedInstrument.value.isAssign &&
      selectedInstrument.value.asignacion?.studentId
    ) {
      router.replace({
        name: "StudentInstrumentProfile",
        params: {
          studentId: selectedInstrument.value.asignacion.studentId,
          instrumentId: selectedInstrument.value.id,
        },
      })
    }
  }
})

watch(searchStudent, (val) => {
  if (val.length >= 3) {
    const query = val.toLowerCase()
    studentResults.value = alumnos.value.filter(
      (a) => a.nombre.toLowerCase().includes(query) || a.apellido.toLowerCase().includes(query)
    )
  } else {
    studentResults.value = []
  }
})

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return
  contratoFile.value = files[0]
}

async function onSubmit() {
  error.value = null
  success.value = false
  if (!selectedInstrument.value || !selectedStudentId.value) {
    error.value = "Debe seleccionar alumno."
    return
  }
  // Simulación de subida de contrato (opcional)
  let contratoUrl = ""
  if (contratoFile.value) {
    // Aquí iría la lógica real de subida y obtención de URL
    contratoUrl = "url-fake-contrato.pdf"
  }
  // Actualizar instrumento en el store (cambiar isAssign a true y guardar asignación)
  await instrumentStore.updateInstrument(selectedInstrument.value.id, {
    isAssign: true,
    asignacion: {
      studentId: selectedStudentId.value,
      nombreAlumno: selectedStudent.value?.nombre + " " + selectedStudent.value?.apellido,
      fechaAsignacion: new Date().toISOString().slice(0, 10),
      ...(contratoUrl ? {contrato: contratoUrl} : {}),
    },
  })
  success.value = true
  // Notificación y redirección
  alert("Instrumento asignado correctamente")
  setTimeout(() => {
    router.push({name: "InstrumentList"})
  }, 1000)
}

function onCancel() {
  router.push({name: "InstrumentList"})
}

function goToInstrumentHistory() {
  if (selectedInstrument.value && selectedInstrument.value.id) {
    router.push({name: "InstrumentDetail", params: {id: selectedInstrument.value.id}})
  }
}
</script>
