<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { uploadFile } from '../../services/storage'
import FileUpload from '../../components/FileUpload.vue'
import { 
  UserIcon, 
  AcademicCapIcon, 
  BriefcaseIcon, 
  MapPinIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const auth = getAuth()
const db = getFirestore()

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref('')
const successMessage = ref('')
const isUploading = ref(false)
const uploadProgress = ref(0)

// Datos del formulario
const formData = reactive({
  bio: '',
  experience: '',
  address: '',
  specialties: [] as string,
  education: [] as { institution: string; degree: string; year: string }[],
  photoURL: '',
  availability: {
    type: 'complete', // 'complete' = tiempo completo, 'partial' = tiempo parcial
    schedule: [
      { day: 'Lunes', enabled: false, startTime: '08:00', endTime: '18:00' },
      { day: 'Martes', enabled: false, startTime: '08:00', endTime: '18:00' },
      { day: 'Miércoles', enabled: false, startTime: '08:00', endTime: '18:00' },
      { day: 'Jueves', enabled: false, startTime: '08:00', endTime: '18:00' },
      { day: 'Viernes', enabled: false, startTime: '08:00', endTime: '18:00' },
      { day: 'Sábado', enabled: false, startTime: '08:00', endTime: '14:00' }
    ]
  },
  profileCompleted: false
})

// Nueva especialidad o educación
const newSpecialty = ref('')
const newEducation = reactive({
  institution: '',
  degree: '',
  year: ''
})

// Cargar datos del usuario
const loadUserProfile = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    const userDocRef = doc(db, 'USERS', currentUser.uid)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      
      // Si el perfil ya está completo, redirigir
      if (userData.profileCompleted) {
        router.push('/pending-approval')
        return
      }
      
      // Si el usuario está aprobado, redirigir al dashboard
      if (userData.status === 'aprobado') {
        router.push('/')
        return
      }
      
      // Llenar el formulario con datos existentes
      formData.bio = userData.bio || ''
      formData.experience = userData.experience || ''
      formData.address = userData.address || ''
      formData.specialties = userData.specialties || []
      formData.education = userData.education || []
      formData.photoURL = userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`
    } else {
      error.value = 'No se pudo encontrar la información de usuario'
    }
  } catch (err) {
    console.error('Error al cargar perfil:', err)
    error.value = 'Error al cargar el perfil'
  } finally {
    isLoading.value = false
  }
}

// Añadir una especialidad
const addSpecialty = () => {
  if (newSpecialty.value.trim() && !formData.specialties.includes(newSpecialty.value)) {
    formData.specialties.push(newSpecialty.value)
    newSpecialty.value = ''
  }
}

// Remover una especialidad
const removeSpecialty = (index: number) => {
  formData.specialties.splice(index, 1)
}

// Añadir educación
const addEducation = () => {
  if (newEducation.institution.trim() && newEducation.degree.trim()) {
    formData.education.push({
      institution: newEducation.institution,
      degree: newEducation.degree,
      year: newEducation.year
    })
    
    // Limpiar el formulario
    newEducation.institution = ''
    newEducation.degree = ''
    newEducation.year = ''
  }
}

// Remover educación
const removeEducation = (index: number) => {
  formData.education.splice(index, 1)
}

// Manejar la subida de foto de perfil
const handlePhotoUpload = async (files: FileList) => {
  if (!files.length) return
  
  const currentUser = auth.currentUser
  if (!currentUser) return
  
  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    const file = files[0]
    const path = `avatars/${currentUser.uid}/${file.name}`
    
    const onProgress = (progress: number) => {
      uploadProgress.value = Math.round(progress * 100)
    }
    
    const url = await uploadFile(file, path, onProgress)
    formData.photoURL = url
  } catch (err) {
    console.error('Error al subir foto:', err)
    error.value = 'Error al subir la foto de perfil'
  } finally {
    isUploading.value = false
  }
}

// Guardar el perfil
const saveProfile = async () => {
  isSaving.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    const userDocRef = doc(db, 'USERS', currentUser.uid)
    
    // Actualizar datos del perfil
    await updateDoc(userDocRef, {
      bio: formData.bio,
      experience: formData.experience,
      address: formData.address,
      specialties: formData.specialties,
      education: formData.education,
      photoURL: formData.photoURL,
      availability: formData.availability, // Guardar la información de disponibilidad
      profileCompleted: true,
      updatedAt: new Date().toISOString()
    })
    
    successMessage.value = 'Perfil completado con éxito'
    
    // Redirigir después de 2 segundos
    setTimeout(() => {
      router.push('/pending-approval')
    }, 2000)
  } catch (err) {
    console.error('Error al guardar perfil:', err)
    error.value = 'Error al actualizar el perfil'
  } finally {
    isSaving.value = false
  }
}

// Validar y enviar el formulario
const handleSubmit = () => {
  // Validación básica
  if (formData.bio.trim().length < 10) {
    error.value = 'Por favor, introduce una biografía más detallada'
    return
  }
  
  if (formData.specialties.length === 0) {
    error.value = 'Por favor, añade al menos una especialidad'
    return
  }
  
  saveProfile()
}

// Cargar datos al montar el componente
onMounted(() => {
  loadUserProfile()
})
</script>

<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
          Completa tu Perfil
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Esta información será revisada por los administradores para aprobar tu cuenta
        </p>
      </div>
      
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando información...</p>
      </div>
      
      <!-- Mensaje de éxito -->
      <div v-else-if="successMessage" class="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg text-center">
        <CheckCircleIcon class="h-16 w-16 mx-auto text-green-500 dark:text-green-400 mb-4" />
        <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
          {{ successMessage }}
        </h3>
        <p class="text-green-700 dark:text-green-200">
          Redirigiendo a la página de espera de aprobación...
        </p>
      </div>
      
      <!-- Formulario de perfil -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <!-- Foto de perfil -->
        <div class="flex flex-col sm:flex-row gap-6 items-center">
          <div class="relative">
            <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
              <img 
                :src="formData.photoURL" 
                :alt="auth.currentUser?.displayName || 'Usuario'" 
                class="w-full h-full object-cover"
                :class="{'opacity-50': isUploading}"
              />
              <div 
                v-if="isUploading" 
                class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
              >
                <div class="text-white text-center">
                  <svg class="w-8 h-8 mx-auto" viewBox="0 0 36 36">
                    <circle 
                      cx="18" cy="18" r="16" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-dasharray="100" 
                      stroke-dashoffset="0" 
                      class="stroke-gray-200 dark:stroke-gray-600"
                    />
                    <circle 
                      cx="18" cy="18" r="16" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-dasharray="100" 
                      stroke-dashoffset="0"
                      :style="{
                        strokeDashoffset: 100 - uploadProgress,
                        stroke: 'rgb(79, 70, 229)'
                      }"
                      transform="rotate(-90, 18, 18)"
                    />
                  </svg>
                  <span class="text-xs font-medium mt-1 block">{{ uploadProgress }}%</span>
                </div>
              </div>
            </div>
            <div class="absolute bottom-0 right-0">
              <FileUpload 
                label=""
                accept="image/*"
                @select="handlePhotoUpload"
              >
                <template #default>
                  <button
                    type="button"
                    class="bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    :disabled="isUploading"
                  >
                    <UserIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </template>
              </FileUpload>
            </div>
          </div>
          
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Foto de perfil
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Añade una foto profesional para que los administradores puedan identificarte.
            </p>
          </div>
        </div>
        
        <!-- Biografía -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <UserIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Biografía
            </label>
          </div>
          <textarea
            id="bio"
            v-model="formData.bio"
            rows="4"
            class="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Cuéntanos sobre ti, tu formación, intereses y objetivos profesionales..."
            required
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Mínimo 10 caracteres. Sé conciso pero informativo.
          </p>
        </div>
        
        <!-- Experiencia -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <BriefcaseIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <label for="experience" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Experiencia profesional
            </label>
          </div>
          <textarea
            id="experience"
            v-model="formData.experience"
            rows="3"
            class="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Describe tu experiencia docente y musical. Incluye años de experiencia, instituciones, logros..."
          ></textarea>
        </div>
        
        <!-- Dirección -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <MapPinIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección
            </label>
          </div>
          <input
            id="address"
            v-model="formData.address"
            type="text"
            class="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Tu dirección completa"
          />
        </div>
        
        <!-- Especialidades -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <AcademicCapIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Especialidades
            </label>
          </div>
          
          <div class="mb-2 flex flex-wrap gap-2">
            <span 
              v-for="(specialty, index) in formData.specialties" 
              :key="index"
              class="inline-flex items-center rounded-full py-1 px-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
            >
              {{ specialty }}
              <button 
                type="button"
                @click="removeSpecialty(index)"
                class="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800"
              >
                <span class="sr-only">Eliminar</span>
                &times;
              </button>
            </span>
          </div>
          
          <div class="flex gap-2">
            <input
              v-model="newSpecialty"
              type="text"
              class="shadow-sm flex-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Piano, Teoría Musical, Composición..."
              @keydown.enter.prevent="addSpecialty"
            />
            <button
              type="button"
              @click="addSpecialty"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Añadir
            </button>
          </div>
          
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Añade las áreas en las que te especializas o sobre las que puedes enseñar.
          </p>
        </div>
        
        <!-- Educación -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <AcademicCapIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Educación y formación
            </h3>
          </div>
          
          <div class="space-y-4 mb-4">
            <div 
              v-for="(edu, index) in formData.education" 
              :key="index"
              class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ edu.degree }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ edu.institution }}</p>
                  <p v-if="edu.year" class="text-xs text-gray-500 dark:text-gray-500">{{ edu.year }}</p>
                </div>
                <button 
                  type="button"
                  @click="removeEducation(index)"
                  class="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <span class="sr-only">Eliminar</span>
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-2">
            <div>
              <label for="institution" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Institución
              </label>
              <input
                id="institution"
                v-model="newEducation.institution"
                type="text"
                class="mt-1 shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Conservatorio Nacional de Música"
              />
            </div>
            <div>
              <label for="degree" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Título/Grado
              </label>
              <input
                id="degree"
                v-model="newEducation.degree"
                type="text"
                class="mt-1 shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Licenciatura en Música"
              />
            </div>
          </div>
          
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label for="year" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Año (opcional)
              </label>
              <input
                id="year"
                v-model="newEducation.year"
                type="text"
                class="mt-1 shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Ej: 2018"
              />
            </div>
            <button
              type="button"
              @click="addEducation"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Añadir
            </button>
          </div>
        </div>
        
        <!-- Disponibilidad Horaria -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disponibilidad Horaria
            </h3>
          </div>
          
          <div class="mb-4">
            <div class="flex items-center gap-4 mb-4">
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="formData.availability.type" 
                  value="complete"
                  class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Tiempo Completo</span>
              </label>
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="formData.availability.type" 
                  value="partial"
                  class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Tiempo Parcial</span>
              </label>
            </div>
            
            <div v-if="formData.availability.type === 'partial'" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Selecciona los días y horarios en los que estás disponible para dar clases:
              </p>
              
              <div class="space-y-3">
                <div 
                  v-for="(day, index) in formData.availability.schedule" 
                  :key="day.day"
                  class="flex flex-wrap gap-3 items-center pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <label class="inline-flex items-center min-w-32">
                    <input 
                      type="checkbox" 
                      v-model="day.enabled"
                      class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{{ day.day }}</span>
                  </label>
                  
                  <div v-if="day.enabled" class="flex items-center gap-2">
                    <div class="flex-1">
                      <label :for="`startTime-${index}`" class="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Desde
                      </label>
                      <input
                        :id="`startTime-${index}`"
                        v-model="day.startTime"
                        type="time"
                        class="mt-1 shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div class="flex-1">
                      <label :for="`endTime-${index}`" class="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Hasta
                      </label>
                      <input
                        :id="`endTime-${index}`"
                        v-model="day.endTime"
                        type="time"
                        class="mt-1 shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tu disponibilidad ayudará a los administradores a organizar mejor los horarios de clases.
            </p>
          </div>
        </div>
        
        <!-- Mensaje de error -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationCircleIcon class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800 dark:text-red-200">
                {{ error }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="flex justify-end gap-3">
          <button
            type="submit"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
            <span v-else>Completar perfil</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>