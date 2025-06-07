<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" v-if="isVisible">
    <!-- Overlay semi-transparente -->
    <div class="absolute inset-0 bg-black bg-opacity-50" @click="close"></div>
    
    <!-- Modal para seleccionar estudiantes -->
    <div v-if="showTagModal && showTagModal" 
         class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                bg-white dark:bg-gray-800 rounded-lg shadow-xl z-60 
                p-4 max-w-md w-full max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Seleccionar estudiante</h3>
        <button @click="closeTagModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
          <span class="text-xl">&times;</span>
        </button>
      </div>
      
      <!-- Buscador -->
      <div class="mb-4">
        <input type="text" v-model="studentSearchQuery" 
               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
               placeholder="Buscar estudiante..." 
               @input="filterStudents">
      </div>
      
      <!-- Lista de estudiantes -->
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="student in filteredStudents" :key="student.id"
            @click="selectStudentForTag(student)"
            class="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md">
          <div class="flex items-center">
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ student.nombre }} {{ student.apellido }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">ID: {{ student.id }}</p>
            </div>
          </div>
        </li>
        <li v-if="filteredStudents.length === 0" class="py-4 text-center text-gray-500 dark:text-gray-400">
          No se encontraron estudiantes
        </li>
      </ul>
    </div>
    
    <!-- Contenido del modal -->
    <div class="relative bg-white dark:bg-gray-800 reounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <!-- Header con título y botón de cierre -->
      <div class="flex justify-between items-center border-b dark:border-gray-700 p-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="mb-4">
        <!-- Estado de carga -->
        <div v-if="isLoading" class="flex justify-center items-center py-4">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 dark:border-blue-500"></div>
        </div>
        
        <!-- Notificaciones -->
        <div v-if="notification.show" 
             :class="{
               'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg transition transform duration-500 ease-in-out translate-x-0': true,
               'bg-green-500 text-white': notification.type === 'success',
               'bg-red-500 text-white': notification.type === 'error',
               'bg-yellow-500 text-white': notification.type === 'warning',
               'bg-blue-500 text-white': notification.type === 'info'
             }">
          <div class="flex items-center">
            <svg v-if="notification.type === 'success'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-if="notification.type === 'error'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{{ notification.message }}</span>
          </div>
        </div>
        
        <!-- Estado de error -->
        <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{{ error }}</p>
        </div>
        
        <!-- Sin observaciones -->
        <div v-else-if="classObservations.length === 0 && justifications.length === 0 && !legacyObservations" class="py-4">
          <p class="text-gray-500 dark:text-gray-400 text-center">No hay observaciones para esta clase</p>
          <div class="flex justify-center mt-4">
            <button @click="showAddObservationForm" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center">
              <span class="mr-1">+</span> Agregar observación
            </button>
          </div>
        </div>
        
        <!-- Formulario para crear/editar observación -->
        <div v-if="isFormVisible" class="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mb-6 dark:bg-gray-750">
          <h4 class="font-medium mb-3 text-gray-800 dark:text-gray-200">{{ isEditMode ? 'Editar observación' : 'Nueva observación' }}</h4>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span class="inline-block mr-2">Usar <kbd class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">#</kbd> para etiquetar estudiantes</span>
            <span class="inline-block">Presiona <kbd class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">Tab</kbd> para aceptar sugerencias de texto</span>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de observación</label>
            <select v-model="formData.type" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded p-2 text-gray-800 dark:text-gray-200">
              <option :value="ObservationType.GENERAL">General</option>
              <option :value="ObservationType.CONTENT">Académica</option>
              <option :value="ObservationType.BEHAVIOR">Conductual</option>
              <option :value="ObservationType.OTHER">Administrativa</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observación</label>
            <div class="relative">
              <textarea 
                v-model="formData.text" 
                ref="observationTextarea"
                rows="4" 
                class="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" 
                placeholder="Escriba su observación aquí (use # para etiquetar estudiantes)"
                @keydown="handleEditorKeydown"
              ></textarea>
              
              <!-- Sugerencia de texto -->
              <div v-if="smartDictionary.suggestionActive.value" class="absolute right-2 top-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 text-xs rounded">
                <span class="opacity-70">Tab para completar:</span> {{ smartDictionary.currentSuggestion.value }}
              </div>
              
              <!-- Estudiantes etiquetados -->
              <div v-if="taggedStudents && taggedStudents.length > 0" class="mt-2 flex flex-wrap gap-2">
                <div v-for="(student, index) in taggedStudents" :key="index" class="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full">
                  @{{ student }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
            <div class="flex space-x-4">
              <label class="inline-flex items-center">
                <input type="radio" v-model="formData.priority" value="baja" class="mr-1 accent-green-600" />
                <span class="text-green-600 dark:text-green-500">Baja</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="formData.priority" value="media" class="mr-1 accent-yellow-600" />
                <span class="text-yellow-600 dark:text-yellow-400">Media</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="formData.priority" value="alta" class="mr-1 accent-red-600" />
                <span class="text-red-600 dark:text-red-500">Alta</span>
              </label>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="inline-flex items-center">
              <input type="checkbox" v-model="formData.requiresFollowUp" class="mr-1 accent-blue-600" />
              <span class="text-gray-800 dark:text-gray-300">Requiere seguimiento</span>
            </label>
          </div>
          
          <div class="flex justify-end space-x-2">
            <button @click="cancelForm" class="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              Cancelar
            </button>
            <button @click="saveObservation" class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700">
              {{ isEditMode ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </div>
        
        <!-- Contenido de observaciones -->
        <div v-else>
          <!-- Observaciones unificadas -->
          <div v-if="classObservations.length > 0" class="space-y-4 mb-4">
            <div class="flex justify-between items-center">
              <div class="font-medium text-gray-800 dark:text-gray-200">Observaciones ({{ classObservations.length }})</div>
              <button @click="showAddObservationForm" class="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white py-1 px-3 rounded text-sm flex items-center">
                <span class="mr-1">+</span> Agregar
              </button>
            </div>
            
            <div v-for="observation in classObservations" :key="observation.id" 
                class="border border-gray-200 dark:border-gray-700 p-3 rounded-md relative bg-white dark:bg-gray-800"
                :class="{
                  'border-yellow-400 dark:border-yellow-500': observation.priority === 'media',
                  'border-red-400 dark:border-red-500': observation.priority === 'alta',
                  'border-green-400 dark:border-green-500': observation.priority === 'baja'
                }">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="font-medium text-gray-800 dark:text-gray-200">{{ getObservationTypeLabel(observation.type) }}</span>
                  <span v-if="observation.requiresFollowUp" class="ml-2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-xs px-2 py-0.5 rounded">
                    Seguimiento
                  </span>
                </div>
                <div class="flex items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400 mr-2">{{ formatDate(observation.createdAt) }}</span>

                </div>
              </div>
              <div class="flex justify-end mt-2">
                <a
                  v-if="observation.id"
                  href="#"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
                  @click.prevent="editObservation(observation)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </a>
                <a
                  v-if="observation.id"
                  href="#"
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-3 inline-flex items-center"
                  @click.prevent="confirmDeleteObservation(observation)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </a>
              </div>
              <p class="text-lg font-medium mb-1 text-gray-800 dark:text-gray-200">{{ typeof observation.content === 'object' ? observation.content.text : observation.content }}</p>
              
              <!-- Si hay bullet points estructurados, mostrarlos como lista -->
              <ul v-if="typeof observation.content === 'object' && observation.content.bulletPoints && observation.content.bulletPoints.length > 0" class="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-300">
                <li v-for="(bullet, idx) in observation.content.bulletPoints" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
              <!-- Registro del Historial -->
              <div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Historial:</h4>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Creado: {{ formatDate(observation.createdAt) }}</span>
                  </div>
                  <div class="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Autor: {{ getAuthorName(observation.author) }}</span>
                  </div>
                  <div v-if="observation.lastModified" class="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Modificado: {{ formatDate(observation.lastModified) }} por {{ observation.modifiedByName || getAuthorName(observation.modifiedBy) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer con botones de acción -->
      <div class="border-t dark:border-gray-700 p-4 flex justify-end">
        <button @click="close" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

// Tipos de observaciones importados más abajo

// Interfaces locales específicas para este componente
interface ClassObservationData extends Omit<Observation, 'content'> {
  content: string | { 
    text: string; 
    bulletPoints?: string[];
    taggedStudents?: string[];
    [key: string]: any;
  };
  // Alias para compatibilidad
  text: string;
  bulletPoints?: string[];
  studentId?: string;
  studentName?: string;
  tags?: string[];
  
  // Campos específicos para historial de modificaciones
  authorId?: string;
  authorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastModified?: Date;
  modifiedBy?: string;
  modifiedByName?: string;
  
  // Campos para compatibilidad con componente de UI 
  category?: string;
  categoryId?: string;
  priority?: string;
  requiresFollowUp?: boolean;
}

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  phone?: string
  clase?: string
  classId?: string
  grupo?: string[]
  createdAt: Date
  updatedAt: Date
  photoURL?: string
  [key: string]: any
}

import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useAuthStore } from '../stores/auth'
import { useSmartDictionary } from '../composables/useSmartDictionary'
import { useStudentTags } from '../composables/useStudentTags' // Assuming correct path to composable
import {
  ObservationType,
  ObservationCategory,
  ObservationStatus,
  Observation,
  ObservationPriority,
} from '../types/observations'

// Importar store para obtener datos de profesores
import { useTeachersStore } from '../modulos/Teachers/store/teachers'

// Funciones auxiliares
const getObservationTypeLabel = (type: ObservationType) => {
  switch (type) {
    case ObservationType.GENERAL:
      return 'General'
    case ObservationType.CONTENT:
      return 'Académica'
    case ObservationType.BEHAVIOR:
      return 'Conductual'
    default:
      return 'Desconocido'
  }
}

// Formatear fecha para mostrar
const formatDate = (isoDate?: string | number | Date): string => {
  if (!isoDate) return 'Fecha desconocida';
  
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (err) {
    console.error('Error al formatear fecha:', err);
    return String(isoDate);
  }
};

// Obtener nombre del autor por ID
const getAuthorName = (authorId?: string): string => {
  if (!authorId) return 'Usuario no identificado';
  
  // Si es 'Sistema', retornar tal cual
  if (authorId === 'Sistema') return 'Sistema';
  
  // Buscar profesor por ID
  const teacher = teachersStore.getTeacherById(authorId);
  if (teacher) {
    return teacher.name;
  }
  
  // Buscar por uid como fallback
  const teacherByUid = teachersStore.teachers.find(t => t.uid === authorId);
  if (teacherByUid) {
    return teacherByUid.name;
  }
  
  // Retornar el ID original si no se encuentra
  return authorId;
};

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true
  },
  classId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Observaciones de clase'
  }
})

const emit = defineEmits(['close', 'observation-added', 'observation-updated', 'observation-deleted'])

const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const authStore = useAuthStore()
const teachersStore = useTeachersStore()

// Composables para editor enriquecido
const smartDictionary = useSmartDictionary()
const { 
  showTagModal, 
  cursorPosition, 
  taggedStudents, 
  editingTagName, 
  findTaggedStudents, 
  handleTagTrigger,
  editStudentTag,
  insertStudentTag,
  closeTagModal
} = useStudentTags()

// Estado
const isLoading = ref(false)
const error = ref<string | null>(null)
const classObservations = ref<ClassObservationData[]>([])
const legacyObservations = ref<string>('')

// Estado// Variables reactivas para gestionar estudiantes
const studentSearchQuery = ref('')
const filteredStudents = ref<any[]>([])
const selectedStudent = ref<{id?: string, name?: string} | null>(null)



// Función para filtrar estudiantes basado en la búsqueda
const filterStudents = () => {
  if (!studentSearchQuery.value) {
    filteredStudents.value = studentsStore.students || [];
    return;
  }
  
  const query = studentSearchQuery.value.toLowerCase();
  filteredStudents.value = studentsStore.students.filter(student => {
    const fullName = `${student.nombre} ${student.apellido}`.toLowerCase();
    return fullName.includes(query) || student.id.toLowerCase().includes(query);
  });
};

// Seleccionar estudiante para etiqueta
const selectStudentForTag = (student: any) => {
  // Guardar el estudiante seleccionado
  selectedStudent.value = {
    id: student.id,
    name: `${student.nombre} ${student.apellido}`
  };
  
  // Insertar etiqueta en el texto
  if (typeof insertStudentTag === 'function') {
    insertStudentTag(student);
  }
  
  // Cerrar el modal de selección
  closeTagModal();
};

// Referencia al textarea de observaciones
const observationTextarea = ref<HTMLTextAreaElement | null>(null);

// Estado para el formulario
const isFormVisible = ref(false)
const isEditMode = ref(false)
const currentObservationId = ref<string | null>(null)

// Estado para notificaciones
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'warning' | 'info'
})

// Estado para confirmación
interface ConfirmationDialogState {
  show: boolean
  isVisible: boolean
  title: string
  message: string
  action: string
  data: any
  observationId: string
  observationText: string
}

const confirmationDialog = ref<ConfirmationDialogState>({
  show: false,
  isVisible: false,
  title: '',
  message: '',
  action: '',
  data: null,
  observationId: '',
  observationText: ''
})


// Datos del formulario
const formData = ref<Partial<Observation> & {
  content: {
    text: string;
    bulletPoints: string[];
  };
  taggedStudentIds: string[];
}>({
  id: '',
  text: '',
  bulletPoints: [],
  type: ObservationType.GENERAL,
  priority: 'media',
  requiresFollowUp: false,
  taggedStudentIds: [],
  content: {
    text: '',
    bulletPoints: []
  },
  author: authStore.user?.uid || '',
  authorName: authStore.user?.email || 'Usuario',
  createdAt: new Date(),
  updatedAt: new Date(),
  classId: props.classId,
  date: props.date
})

// Métodos
const close = () => {
  emit('close')
}

const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find(s => s.id === studentId)
  return student ? `${student.nombre} ${student.apellido || ''}`.trim() : 'Estudiante'
}

// Extraer estudiantes etiquetados de un contenido de observación
const getTaggedStudentsInContent = (content: string | { text: string; bulletPoints?: string[] } | null): string[] => {
  if (!content) return [];
  
  let textToSearch = '';
  if (typeof content === 'string') {
    textToSearch = content;
  } else if (content && typeof content === 'object' && 'text' in content) {
    textToSearch = content.text || '';
  }
  
  // Usar la misma regex que en useStudentTags para buscar etiquetas
  const regex = /@([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)/g;
  const matches: string[] = [];
  
  try {
    if (textToSearch.matchAll) {
      const allMatches = [...textToSearch.matchAll(regex)];
      return allMatches.map(match => match[1]);
    } else {
      // Alternativa para navegadores que no soportan matchAll
      let match;
      while ((match = regex.exec(textToSearch)) !== null) {
        matches.push(match[1]);
      }
    }
  } catch (error) {
    console.error('Error al buscar etiquetas:', error);
  }
  
  return matches;
}

// Cargar observaciones usando el nuevo modelo unificado
const loadObservations = async () => {
  if (!props.classId || !props.date) {
    console.warn('[ObservationsModal] Faltan classId o date para cargar observaciones');
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    console.log('[ObservationsModal] Cargando observaciones para fecha:', props.date, 'clase:', props.classId);
    
    // Cargar estudiantes si no están en el store
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }
    
    // 1. Cargar observaciones modernas
    try {
      // Usar fetchClassObservations en lugar de getObservations
      const observations = await attendanceStore.fetchClassObservations(
        props.classId,
        props.date
      );
      
      // Mapear las observaciones al tipo esperado compatible con ClassObservationData local
      classObservations.value = observations.map(obs => {
        // Texto principal de la observación
        const texto = obs.text || (typeof obs.content === 'string' ? obs.content : 
                     (obs.content?.text || ''));
        
        // Crear un objeto que cumpla con la interfaz local ClassObservationData
        const mappedObs: ClassObservationData = {
          id: obs.id || '',
          // Campos obligatorios para Observation (interfaz padre)
          authorId: obs.authorId || authStore.user?.uid || '',
          createdAt: obs.createdAt || new Date(),
          updatedAt: obs.updatedAt || new Date(),
          category: 'class',
          categoryId: props.classId,
          
          // Mapeo específico para ClassObservationData
          text: texto, // Alias obligatorio según la interfaz
          content: {
            text: texto,
            bulletPoints: Array.isArray(obs.bulletPoints) ? obs.bulletPoints : [],
            taggedStudents: Array.isArray(obs.taggedStudentIds) ? obs.taggedStudentIds : []
          },
          
          // Campos de historial de modificaciones
          lastModified: obs.lastModified || obs.updatedAt || new Date(),
          modifiedBy: obs.modifiedBy || obs.authorId || '',
          modifiedByName: obs.modifiedByName || obs.authorName || 'Usuario',
          
          // Propiedades adicionales útiles
          authorName: obs.authorName || 'Usuario',
          priority: obs.priority || 'media',
          requiresFollowUp: !!obs.requiresFollowUp,
          studentId: obs.studentId,
          studentName: obs.studentName,
          tags: obs.tags || [],
          bulletPoints: obs.bulletPoints || []
        };
        
        return mappedObs;
      });
    } catch (modernErr) {
      console.warn('[ObservationsModal] Error al cargar observaciones modernas:', modernErr);
      // Si falla, continuamos con el enfoque heredado
    }
    
    // 2. Cargar datos heredados como respaldo
    const attendanceDoc = await attendanceStore.fetchAttendanceDocument(props.date, props.classId);
    
    if (!attendanceDoc) {
      if (classObservations.value.length === 0) {
        legacyObservations.value = null;
        justifications.value = [];
      }
    } else {
      // Almacenar datos heredados - asegurarnos que sea string
      // Asegurar que las observaciones heredadas siempre sean un string
      if (attendanceDoc.data?.observations) {
        if (typeof attendanceDoc.data.observations === 'string') {
          legacyObservations.value = attendanceDoc.data.observations;
        } else if (Array.isArray(attendanceDoc.data.observations)) {
          // Si es un array, extraer el texto de cada observación y unirlo
          try {
            const textos = attendanceDoc.data.observations.map(obs => {
              if (typeof obs === 'string') return obs;
              if (obs && typeof obs === 'object' && 'content' in obs) {
                if (typeof obs.content === 'string') return obs.content;
                if (obs.content && typeof obs.content === 'object' && 'text' in obs.content) {
                  return obs.content.text || '';
                }
              }
              return '';
            }).filter(t => t.length > 0);
            legacyObservations.value = textos.join('\n\n');
          } catch (err) {
            console.error('Error procesando observaciones:', err);
            legacyObservations.value = '';
          }
        } else {
          // Si no es string ni array, intentar usar JSON.stringify
          try {
            legacyObservations.value = JSON.stringify(attendanceDoc.data.observations);
          } catch (err) {
            console.error('Error al convertir observaciones a string:', err);
            legacyObservations.value = '';
          }
        }
      } else {
        legacyObservations.value = '';
      }
      // Eliminado código de justificaciones
      
      // Si hay observaciones en el formato nuevo (observations array)
      if (attendanceDoc.data?.observations && Array.isArray(attendanceDoc.data.observations) && attendanceDoc.data.observations.length > 0) {
        try {
          // Convertimos ClassObservationData[] a Observation[] con manejo seguro de tipos
          const processedObservations: Observation[] = [];
          
          for (const obs of attendanceDoc.data.observations) {
            // Manejar el contenido que puede ser string u objeto
            let processedContent: { text: string; bulletPoints: string[] };
            
            // Asegurar que el contenido siempre tenga el formato correcto
            if (typeof obs.content === 'string') {
              processedContent = {
                text: obs.content,
                bulletPoints: []
              };
            } else if (obs.content && typeof obs.content === 'object') {
              const contentText = 'text' in obs.content && obs.content.text ? String(obs.content.text) : '';
              
              const bulletPoints = 'bulletPoints' in obs.content && 
                                Array.isArray(obs.content.bulletPoints) ? 
                                obs.content.bulletPoints : [];
              
              processedContent = {
                text: contentText,
                bulletPoints: bulletPoints
              };
            } else {
              // Valor por defecto si no hay contenido o es null
              processedContent = {
                text: '',
                bulletPoints: []
              };
            }
            
            // Crear observación compatible con la interfaz
            const observation: Observation = {
              id: obs.id || `obs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              author: obs.author || authStore.user?.uid || 'unknown', // ID del autor
              authorName: obs.authorName || authStore.user?.email || 'Usuario',
              createdAt: obs.createdAt ? new Date(obs.createdAt) : new Date(),
              type: obs.type ? obs.type as ObservationType : ObservationType.GENERAL,
              category: obs.category ? obs.category as ObservationCategory : ObservationCategory.CLASS,
              status: obs.status ? obs.status as ObservationStatus : ObservationStatus.ACTIVE,
              priority: (obs.priority || 'media') as ObservationPriority,
              content: processedContent,
              classId: obs.classId || props.classId,
              date: obs.date || props.date,
              requiresFollowUp: Boolean(obs.requiresFollowUp) || false
            };
            
            processedObservations.push(observation);
          }
          
          classObservations.value = processedObservations;
        } catch (err) {
          console.error('[ObservationsModal] Error procesando observaciones:', err);
          classObservations.value = []; // Si hay un error, usar array vacío
        }
      } else {
        // Si tenemos observaciones heredadas pero no modernas, convertir las heredadas
        if (classObservations.value.length === 0 && legacyObservations.value) {
          // Crear una observación con el modelo nuevo basado en datos heredados
          const classInfo = classesStore.getClassById(props.classId);
          const className = classInfo ? classInfo.name : 'Clase';
          
          // Observación unificada con datos antiguos
          const legacyObs: Observation = {
            id: `legacy-${props.date}-${props.classId}`,
            content: {
              text: legacyObservations.value,
              bulletPoints: []
            },
            author: authStore.user?.uid || 'unknown',
            authorName: authStore.user?.email || 'Usuario',
            createdAt: new Date(),
            type: ObservationType.GENERAL,
            category: ObservationCategory.CLASS,
            priority: 'media' as ObservationPriority,
            classId: props.classId,
            className: className,
            date: props.date,
            status: ObservationStatus.ACTIVE,
            requiresFollowUp: false
          };
          
          classObservations.value = [legacyObs];
        }
      }
    }
    
    // Cargar clase actual si es necesario
    if (props.classId && classesStore.classes.length === 0) {
      try {
        await classesStore.fetchClasses()
      } catch (err) {
        console.error('[ObservationsModal] Error cargando clases:', err)
      }
    }
    
  } catch (err) {
    console.error('[ObservationsModal] Error al cargar observaciones:', err);
    error.value = `Error al cargar observaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`;
  } finally {
    isLoading.value = false;
  }
};

// Mostrar formulario para agregar observación
const showAddObservationForm = () => {
  isFormVisible.value = true;
  isEditMode.value = false;
  currentObservationId.value = null;
  
  // Resetear formulario
  formData.value.text = '';
  formData.value.bulletPoints = [];
  formData.value.type = ObservationType.GENERAL;
  formData.value.priority = 'media';
  formData.value.requiresFollowUp = false;
  formData.value.taggedStudentIds = [];
  
  // Cargar diccionario para autocompletado
  smartDictionary.loadSavedDictionary();
  
  // Foco en textarea después de renderizar
  nextTick(() => {
    if (observationTextarea.value) {
      observationTextarea.value.focus();
    }
  });
};

// Mostrar formulario para editar observación
const editObservation = (observation: Observation) => {
  isFormVisible.value = true;
  isEditMode.value = true;
  currentObservationId.value = observation.id;
  
  // Llenar formulario con datos existentes
  formData.value.text = typeof observation.content === 'object' ? observation.content.text : observation.content;
  formData.value.bulletPoints = typeof observation.content === 'object' ? observation.content.bulletPoints || [] : [];
  formData.value.type = observation.type;
  formData.value.priority = observation.priority || 'media';
  formData.value.requiresFollowUp = observation.requiresFollowUp;
};

// Cancelar formulario
const cancelForm = () => {
  isFormVisible.value = false;
  // Limpiar etiquetas
  if (Array.isArray(taggedStudents)) {
    // Si es un array puro
    taggedStudents.length = 0;
  } else if (taggedStudents && 'value' in taggedStudents) {
    // Si es un ref
    taggedStudents.value = [];
  }
  smartDictionary.rejectSuggestion();
};

// Manejo de eventos de teclado en el editor
const handleEditorKeydown = (event: KeyboardEvent) => {
  if (!observationTextarea.value) return;
  
  const textarea = event.target as HTMLTextAreaElement;
  const cursorPos = textarea.selectionStart || 0;
  const text = formData.value.text || '';
  const textBeforeCursor = text.substring(0, cursorPos);
  const textAfterCursor = text.substring(cursorPos);
  
  // Prevenir comportamiento predeterminado para Tab con sugerencia activa
  if (event.key === 'Tab' && smartDictionary.suggestionActive.value) {
    event.preventDefault();
    
    // Aplicar sugerencia
    const result = smartDictionary.applySuggestion(textBeforeCursor, textAfterCursor);
    if (result) {
      // Actualizar el modelo
      formData.value.text = result.text;
      
      // Colocar cursor al final de la sugerencia
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(result.cursorPos, result.cursorPos);
        }
      }, 50);
    }
    return;
  }
  
  // Rechazar sugerencia con Escape
  if (event.key === 'Escape' && smartDictionary.suggestionActive.value) {
    event.preventDefault();
    smartDictionary.rejectSuggestion();
    return;
  }
  
  // Detectar # para etiquetado de estudiantes
  if (handleTagTrigger(event, cursorPos)) {
    // Si se activó el modal de etiquetas, mostrar lista de estudiantes
    if (showTagModal) {
      // El modal de selección de estudiantes se muestra automáticamente
      // y el usuario seleccionará uno de la lista
      
      // Preparar la lista de estudiantes filtrada
      filterStudents();
    }
    return;
  }
  
  // Para cualquier otra tecla, buscar sugerencias después de un tiempo
  smartDictionary.setTypingTimeout(textBeforeCursor);
  
  // Actualizar etiquetas encontradas
  if (typeof findTaggedStudents === 'function') {
    findTaggedStudents(formData.value.text);
  }
};

// Guardar nueva observación o actualizar existente
const saveObservation = async () => {
  if (!formData.value.text.trim()) {
    error.value = 'El texto de la observación es obligatorio';
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Obtener información de la clase
    let className = 'Clase';
    const classInfo = classesStore.getClassById(props.classId);
    if (classInfo && classInfo.name) {
      className = classInfo.name;
    }
    
    if (isEditMode.value && currentObservationId.value) {
      // Actualizar observación existente
      // Aquí se implementaría la llamada al servicio
      console.log('[ObservationsModal] Actualizar observación:', currentObservationId.value);
      
      // Actualizar observación existente
      const existingObservation = classObservations.value.find(o => o.id === currentObservationId.value);
      if (!existingObservation) {
        throw new Error('No se encontró la observación para actualizar');
      }
      
      // Crear copia para actualizar
      // Crear un objeto Observation compatible con la interfaz
      const updatedContent = {
        text: formData.value.text,
        bulletPoints: formData.value.bulletPoints
      };
      
      const now = new Date();
      const updatedObservation: Observation = {
        ...existingObservation,
        content: updatedContent,
        type: formData.value.type,
        priority: formData.value.priority as ObservationPriority,
        updatedAt: now,
        author: existingObservation.author || authStore.user?.uid || 'unknown',
        authorName: authStore.user?.email || 'Usuario',
        requiresFollowUp: formData.value.requiresFollowUp,
        // Campos de historial para la modificación
        lastModified: now,
        modifiedBy: authStore.user?.uid || 'unknown',
        modifiedByName: authStore.user?.email || 'Usuario',
        text: formData.value.text // Asegurar que el campo text esté actualizado en la raíz
      };
      
      // Actualizar en el array local
      const index = classObservations.value.findIndex(o => o.id === currentObservationId.value);
      if (index !== -1) {
        classObservations.value[index] = updatedObservation;
      }
      
      // En producción, enviar a API
      // Actualizar en Firestore para asegurar la persistencia del historial
      try {
        await attendanceStore.updateClassObservation(props.date, props.classId, updatedObservation);
      } catch (updateErr) {
        console.error('[ObservationsModal] Error al actualizar observación en Firestore:', updateErr);
        // Continuar a pesar del error para no perder los cambios en la UI
      }
      
      emit('observation-updated', updatedObservation);
      showNotification('Observación actualizada correctamente', 'success');
      
      // Actualizar registro heredado para mantener compatibilidad
      if (legacyObservations.value) {
        legacyObservations.value += '\n\n' + formData.value.text;
      } else {
        legacyObservations.value = formData.value.text;
      }
      
      // Actualizar en el store
      try {
        await attendanceStore.updateObservations(props.date, props.classId, legacyObservations.value);
      } catch (legacyErr) {
        console.error('[ObservationsModal] Error al actualizar observaciones heredadas:', legacyErr);
      }
    } else {
      // Crear nueva observación
      const newObservation: ClassObservationData = prepareObservationData();
      
      // Aquí se implementaría la llamada al servicio
      console.log('[ObservationsModal] Crear nueva observación', newObservation);
      
      // Simulación de adición
      classObservations.value.push(newObservation);
      emit('observation-added', newObservation);
      showNotification('Observación creada correctamente', 'success');
      
      // Actualizar registro heredado para mantener compatibilidad
      if (legacyObservations.value) {
        legacyObservations.value += '\n\n' + formData.value.text;
      } else {
        legacyObservations.value = formData.value.text;
      }
      
      // Actualizar en el store
      try {
        await attendanceStore.updateObservations(props.date, props.classId, legacyObservations.value);
      } catch (legacyErr) {
        console.error('[ObservationsModal] Error al actualizar observaciones heredadas:', legacyErr);
      }
    }
    
    // Cerrar formulario
    isFormVisible.value = false;
  } catch (err) {
    console.error('[ObservationsModal] Error al guardar observación:', err);
    error.value = `Error al guardar observación: ${err instanceof Error ? err.message : 'Error desconocido'}`;
  } finally {
    isLoading.value = false;
  }
};

// Función para preparar datos de observación
const prepareObservationData = (): ClassObservationData => {
  const now = new Date()
  const baseData: ClassObservationData = {
    id: formData.value.id || `obs_${Date.now()}`,
    content: {
      text: formData.value.text,
      bulletPoints: formData.value.bulletPoints || []
    } as any, // Usamos as any para el contenido dinámico
    author: authStore.user?.uid || '',
    authorName: authStore.user?.email || 'Usuario',
    createdAt: (formData.value as any).createdAt || now,
    updatedAt: now,
    type: formData.value.type || ObservationType.GENERAL,
    category: 'class',
    priority: formData.value.priority || 'media',
    requiresFollowUp: formData.value.requiresFollowUp || false,
    classId: props.classId,
    date: props.date || new Date().toISOString().split('T')[0],
    status: 'active',
    // Usamos valores de etiquetado de estudiantes o null cuando no hay estudiante seleccionado
    studentId: selectedStudent.value?.id || null,
    studentName: selectedStudent.value?.name || null,
    // Aseguramos que todas las propiedades requeridas estén presentes
    tags: [],
    text: formData.value.text
  }
  return baseData
}

// Confirmar eliminación de observación
const confirmDeleteObservation = (observation: ClassObservationData) => {
  if (!observation || !observation.id) return;
  
  showDeleteConfirmation(observation);
};

// Mostrar diálogo de confirmación para eliminar
const showDeleteConfirmation = (observation: ClassObservationData) => {
  confirmationDialog.value = {
    show: true,
    isVisible: true,
    title: 'Confirmar eliminación',
    message: '¿Estás seguro de que deseas eliminar esta observación?',
    action: 'delete',
    data: observation,
    observationId: observation.id,
    observationText: typeof observation.content === 'string' 
      ? observation.content 
      : observation.content?.text || ''
  };
  
  // Extraer el texto para mostrar en la confirmación
  const contentText = typeof observation.content === 'string' 
    ? observation.content 
    : observation.content?.text || '';
                     (typeof observation.content === 'object' && observation.content && 'text' in observation.content) ? 
                     observation.content.text : '';
  
  // Usando la API de confirmación moderna del navegador
  if (window.confirm(`¿Estás seguro que deseas eliminar esta observación?

"${contentText.substring(0, 50)}${contentText.length > 50 ? '...' : ''}"`)) {
    deleteObservation(observation.id);
  }
};

// Mostrar notificación
const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  };
  
  // Ocultar automáticamente después de 3 segundos
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

// Eliminar observación
const deleteObservation = async (observationId: string) => {
  if (!observationId) return;
  
  isLoading.value = true;
  
  try {
    const updatedObservations = classObservations.value.filter(o => o.id !== observationId);
    classObservations.value = updatedObservations;
    
    // En producción, aquí se enviaría a la API para eliminar
    // await observationsService.delete(observationId);
    
    // Guardar el texto en el diccionario para autocompletado
    smartDictionary.analyzeText(formData.value.text);
    
    // Actualizar también en el modelo de datos heredado
    // Solo se mantiene para compatibilidad durante la transición
    const observationToDelete = classObservations.value.find(o => o.id === observationId);
    
    if (observationToDelete) {
      // Eliminar del texto heredado si existe
      if (legacyObservations.value) {
        // Versión muy simple: simplemente filtra líneas que contengan el texto de la observación
        // En una implementación real esto sería más sofisticado
        const lines = legacyObservations.value.split('\n');
        const filteredLines = lines.filter(line => {
          // Extraer el texto del contenido para comparar
        let contentText = '';
        if (typeof observationToDelete.content === 'object' && observationToDelete.content !== null) {
          contentText = String(observationToDelete.content.text || '');
        } else if (observationToDelete.content) {
          contentText = String(observationToDelete.content);
        }
          return !line.includes(contentText);
        });
        legacyObservations.value = filteredLines.join('\n');
        
        // Actualizar en Firebase el campo legacy
        await attendanceStore.updateObservations(props.date, props.classId, legacyObservations.value);
      }
    }
    
    emit('observation-deleted', observationId);
    showNotification('Observación eliminada correctamente', 'success');
  } catch (err) {
    console.error('[ObservationsModal] Error al eliminar observación:', err);
    error.value = 'Error al eliminar la observación. Inténtalo de nuevo.';
    showNotification('Error al eliminar la observación', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Observadores
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    loadObservations()
  }
})

// Ciclo de vida
onMounted(() => {
  if (props.isVisible) {
    loadObservations()
    
    // Inicializar diccionario para autocompletado
    smartDictionary.loadSavedDictionary()
    
    // Configurar modal para seleccionar estudiantes
    watch(showTagModal, (isVisible) => {
      if (isVisible) {
        // Preparar la lista de estudiantes cuando se active el modal
        studentSearchQuery.value = ''
        filterStudents()
        
        // Al cerrar, limpiar búsqueda
        if (!isVisible && editingTagName.value) {
          editingTagName.value = ''
        }
      }
    })
  }
})
</script>