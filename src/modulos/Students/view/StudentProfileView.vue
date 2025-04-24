<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ref as vueRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingLibraryIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CameraIcon
} from '@heroicons/vue/24/outline'
import { useStudentsStore } from '../store/students'
import { useClassesStore } from '../../Classes/store/classes'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { uploadFile } from "../../../service/storage"
import FileUpload from "../../../components/FileUpload.vue"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()

const studentId = route.params.id as string
const student = computed(() => studentsStore.students.find(s => s.id.toString() === studentId))

// Add the missing classes computed property
const classes = computed(() => {
  // If classesStore has a groups or classes array, use it
  // Otherwise provide a default set of groups
  return classesStore.groups || 
    ['Teoría Musical', 'Ensamble', 'Coro', 'Orquesta', 'Jazz', 'Música Clásica']
})

const attendanceData = computed(() => {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
  const present = [90, 85, 95, 88, 92, 87]
  const absent = [10, 15, 5, 12, 8, 13]

  return {
    labels,
    datasets: [
      {
        label: 'Asistencias',
        data: present,
        borderColor: '#22c55e',
        backgroundColor: '#22c55e',
      },
      {
        label: 'Ausencias',
        data: absent,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    }
  }
}

const isUploading = vueRef(false)

const handleProfilePhotoUpload = async (files: FileList) => {
  if (!student.value || !files.length) return
  
  isUploading.value = true
  try {
    const file = files[0]
    const path = `avatars/${student.value.id}/${file.name}`
    const url = await uploadFile(file, path)
    
    await studentsStore.updateStudent(studentId, {
      ...student.value,
      avatar: url
    })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    // Add error handling/notification here
  } finally {
    isUploading.value = false
  }
}

const handleDocumentUpload = async (files: FileList, documentType: string) => {
  if (!student.value || !files.length) return
  
  isUploading.value = true
  try {
    const file = files[0]
    const path = `documents/${student.value.id}/${documentType}/${file.name}`
    const url = await uploadFile(file, path)
    
    const documentos = {
      ...student.value.documentos,
      [documentType]: {
        url,
        fecha: new Date().toISOString()
      }
    }
    
    await studentsStore.updateStudent(studentId, {
      ...student.value,
      documentos
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    // Add error handling/notification here
  } finally {
    isUploading.value = false
  }
}

const isEditing = ref(false)
const localStudent = ref({})

// Extract unique instruments from all students
const uniqueInstruments = computed(() => {
  // Create a Set to automatically handle uniqueness
  const instrumentSet = new Set()
  
  // Extract instruments from all students
  studentsStore.students.forEach(student => {
    if (student.instrumento && student.instrumento.trim() !== '') {
      instrumentSet.add(student.instrumento)
    }
  })
  
  // Convert Set to Array and sort alphabetically
  return Array.from(instrumentSet).sort()
})

// Extract unique groups from all students
const uniqueGroups = computed(() => {
  // Create a Set to automatically handle uniqueness
  const groupSet = new Set()
  
  // Extract groups from all students
  studentsStore.students.forEach(student => {
    // Check if grupo property exists and is an array
    if (student.grupo && Array.isArray(student.grupo)) {
      // Add each group to the set
      student.grupo.forEach(group => {
        if (group && typeof group === 'string' && group.trim() !== '') {
          groupSet.add(group.trim())
        }
      })
    } 
    // Handle case where grupo might be a string
    else if (student.grupo && typeof student.grupo === 'string' && student.grupo.trim() !== '') {
      groupSet.add(student.grupo.trim())
    }
  })
  
  // Convert Set to Array and sort alphabetically
  return Array.from(groupSet).sort()
})

// Extract unique classes from all students
const uniqueClasses = computed(() => {
  // Create a Set to automatically handle uniqueness
  const classSet = new Set()
  
  // Extract classes from all students
  studentsStore.students.forEach(student => {
    if (student.clase && typeof student.clase === 'string' && student.clase.trim() !== '') {
      classSet.add(student.clase.trim())
    }
  })
  
  // Convert Set to Array and sort alphabetically
  return Array.from(classSet).sort()
})

watch(student, (newStudent) => {
  if (newStudent) {
    localStudent.value = { ...newStudent }
  }
}, { immediate: true })

const handleEdit = () => {
  isEditing.value = true
}

const handleCancel = () => {
  localStudent.value = { ...student.value }
  isEditing.value = false
}

const handleSave = async () => {
  try {
    await studentsStore.updateStudent(studentId, localStudent.value)
    isEditing.value = false
  } catch (error) {
    console.error('Error al guardar cambios:', error)
  }
}

const handleDelete = () => {
  router.push(`/students/${String(studentId)}/delete`)
}
</script>

<template>
  <div v-if="student" class="py-6">
    <!-- Header with Profile Photo -->
    <div class="flex justify-between items-start mb-6">
      <div class="flex items-center gap-4">
        <div class="relative">
          <img
            :src="student.avatar"
            :alt="`${student.nombre} ${student.apellido}`"
            class="w-24 h-24 rounded-full object-cover"
          />
          <div class="absolute -bottom-2 -right-2">
            <FileUpload
              accept="image/*"
              label=""
              @select="handleProfilePhotoUpload"
            >
              <template #default>
                <button
                  type="button"
                  class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  :disabled="isUploading"
                >
                  <CameraIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </template>
            </FileUpload>
          </div>
        </div>
        <div>
          <h1 class="text-2xl font-bold">
            {{ student.nombre }} {{ student.apellido }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ student.instrumento }} - {{ student.clase }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          v-if="!isEditing"
          @click="handleEdit"
          class="btn bg-blue-600 text-white hover:bg-blue-700"
        >
          Editar Perfil
        </button>
        <template v-else>
          <button
            @click="handleSave"
            class="btn bg-green-600 text-white hover:bg-green-700"
          >
            Guardar
          </button>
          <button
            @click="handleCancel"
            class="btn bg-gray-600 text-white hover:bg-gray-700"
          >
            Cancelar
          </button>
        </template>
        <button
          v-if="!isEditing"
          @click="handleDelete"
          class="btn bg-red-600 text-white hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Información Personal -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <UserIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Información Personal
      </h2>
      <div class="space-y-3" v-if="!isEditing">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Edad</p>
          <p class="font-medium">{{ student.edad }} años</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Fecha de Nacimiento</p>
          <p class="font-medium">{{ student.nac }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Sexo</p>
          <p class="font-medium">{{ student.sexo }}</p>
        </div>
        <div class="pt-3 border-t dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-400">Padres</p>
          <p class="font-medium">{{ student.madre }} (Madre)</p>
          <p class="font-medium">{{ student.padre }} (Padre)</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Contacto</p>
          <p class="font-medium flex items-center gap-2">
            <PhoneIcon class="w-4 h-4" />
            {{ student.tlf }}
          </p>
          <p class="font-medium flex items-center gap-2">
            <EnvelopeIcon class="w-4 h-4" />
            {{ student.email !== 'Vacio' ? student.email : 'No disponible' }}
          </p>
        </div>
      </div>
      <div class="space-y-3" v-else>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Nombre</label>
          <input
            v-model="localStudent.nombre"
            class="input w-full"
            required
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Apellido</label>
          <input
            v-model="localStudent.apellido"
            class="input w-full"
            required
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Edad</label>
          <input
            v-model="localStudent.edad"
            class="input w-full"
            type="number"
            required
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Fecha de Nacimiento</label>
          <input
            v-model="localStudent.nac"
            class="input w-full"
            type="date"
            required
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Sexo</label>
          <select v-model="localStudent.sexo" class="input w-full">
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Teléfono</label>
          <input
            v-model="localStudent.tlf"
            class="input w-full"
            type="tel"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Email</label>
          <input
            v-model="localStudent.email"
            class="input w-full"
            type="email"
          />
        </div>
      </div>
    </div>
    <!-- Información Académica -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <AcademicCapIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Información Académica
      </h2>
      <div class="space-y-3" v-if="!isEditing">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Instrumento</p>
          <p class="font-medium">{{ student.instrumento }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Clase</p>
          <p class="font-medium">{{ student.clase }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Grupos</p>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="grupo in student.grupo"
              :key="grupo"
              class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              {{ grupo }}
            </span>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Fecha de Inscripción</p>
          <p class="font-medium">{{ student.fecInscripcion }}</p>
        </div>
      </div>
      <div class="space-y-3" v-else>        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Instrumento</label>
          <select v-model="localStudent.instrumento" class="input w-full">
            <option v-for="instrument in uniqueInstruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Clase</label>
          <select v-model="localStudent.clase" class="input w-full">
            <option v-for="className in uniqueClasses" :key="className" :value="className">
              {{ className }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Grupos</label>
          <select v-model="localStudent.grupo" class="input w-full" multiple>
            <option v-for="group in uniqueGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Fecha de Inscripción</label>
          <input
            v-model="localStudent.fecInscripcion"
            class="input w-full"
            type="date"
          />
        </div>
      </div>
    </div>
    <!-- Horario y Disponibilidad -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <ClockIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Horario y Disponibilidad
      </h2>
      <div class="space-y-3" v-if="!isEditing">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Institución</p>
          <p class="font-medium flex items-center gap-2">
            <BuildingLibraryIcon class="w-4 h-4" />
            {{ student.colegio_trabajo }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Horario</p>
          <p class="font-medium">{{ student.horario_colegio_trabajo }}</p>
        </div>
      </div>
      <div class="space-y-3" v-else>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Institución</label>
          <input
            v-model="localStudent.colegio_trabajo"
            class="input w-full"
            placeholder="Colegio o lugar de trabajo"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Horario</label>
          <input
            v-model="localStudent.horario_colegio_trabajo"
            class="input w-full"
            placeholder="Horario de colegio o trabajo"
          />
        </div>
      </div>
    </div>

    <!-- Gráfico de Asistencia -->
    <div class="card lg:col-span-2">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <ChartBarIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Asistencia
      </h2>
      <div class="h-64">
        <Line
          :data="attendanceData"
          :options="chartOptions"
        />
      </div>
    </div>

    <!-- Documentos -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <DocumentTextIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Documentos
      </h2>
      <div class="space-y-4">
        <!-- Contrato de Instrumento -->
        <div class="p-4 rounded-lg border dark:border-gray-700">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-medium">Contrato de Instrumento</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ student.documentos?.contrato_instrumento
                  ? `Subido el ${new Date(student.documentos.contrato_instrumento.fecha).toLocaleDateString()}`
                  : 'Pendiente de firma'
                }}
              </p>
            </div>
            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png"
              @select="files => handleDocumentUpload(files, 'contrato_instrumento')"
            />
          </div>
          <a
            v-if="student.documentos?.contrato_instrumento"
            :href="student.documentos.contrato_instrumento.url"
            target="_blank"
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver documento
          </a>
        </div>

        <!-- Términos y Condiciones -->
        <div class="p-4 rounded-lg border dark:border-gray-700">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-medium">Términos y Condiciones</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ student.documentos?.terminos_condiciones
                  ? `Subido el ${new Date(student.documentos.terminos_condiciones.fecha).toLocaleDateString()}`
                  : `Firmado el ${student.fecInscripcion}`
                }}
              </p>
            </div>
            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png"
              @select="files => handleDocumentUpload(files, 'terminos_condiciones')"
            />
          </div>
          <a
            v-if="student.documentos?.terminos_condiciones"
            :href="student.documentos.terminos_condiciones.url"
            target="_blank"
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver documento
          </a>
        </div>
      </div>
    </div>
    <div class="card">
      <h2 class="text-lg font-semibold mb-4">Información de Contacto</h2>
      <div class="space-y-3">
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Teléfono</label>
          <input
            v-if="isEditing"
            v-model="localStudent.telefono"
            class="input"
            type="tel"
          />
          <p v-else class="font-medium">{{ localStudent.telefono || 'Sin registrar' }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Email</label>
          <input
            v-if="isEditing"
            v-model="localStudent.email"
            class="input"
            type="email"
          />
          <p v-else class="font-medium">{{ localStudent.email || 'Sin registrar' }}</p>
        </div>
      </div>
    </div>
    <div class="card">
      <h2 class="text-lg font-semibold mb-4">Grupos y Clases</h2>
      <div class="space-y-3">
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Grupos</label>
          <select
            v-if="isEditing"
            v-model="localStudent.grupo"
            class="input"
            multiple
          >
            <option v-for="group in classes" :key="group">{{ group }}</option>
          </select>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="(group, index) in localStudent.grupo"
              :key="index"
              class="badge bg-blue-100 text-blue-800"
            >
              {{ group }}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>