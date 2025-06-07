<template>
  <div
    v-if="modelValue || isVisible"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl z-10 max-h-[90vh] overflow-y-auto">
      <!-- Toast notification -->
      <Toast 
        v-if="showToastMessage" 
        :show="showToastMessage"
        :message="toastMessage" 
        :type="toastType" 
        @close="showToastMessage = false" 
      />
      
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold">
              {{ classObservationMode ? 'Observaciones de Clase' : 'Observaciones de Estudiante' }}
            </h2>
            <button @click="openHelp" class="text-blue-500 hover:text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <button @click="handleClose" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Información de contexto -->
        <div class="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p v-if="!classObservationMode">
             <strong>Estudiante:</strong> {{ studentName }}</p>
          <p><strong>Clase:</strong> {{ className }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(attendanceDate) }}</p>
        </div>

        <!-- Tabs para cambiar entre añadir observación e historial -->
        <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
          <ul class="flex flex-wrap -mb-px">
            <li class="mr-2">
              <button
                @click="activeTab = 'new'"
                :class="[
                  'inline-block p-3 rounded-t-lg',
                  activeTab === 'new'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                    : 'border-b-2 border-transparent hover:border-gray-300 text-gray-500 dark:text-gray-400'
                ]"
              >
                Nueva Observación
              </button>
            </li>
            <li class="mr-2">
              <button
                @click="activeTab = 'history'"
                :class="[
                  'inline-block p-3 rounded-t-lg',
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                    : 'border-b-2 border-transparent hover:border-gray-300 text-gray-500 dark:text-gray-400'
                ]"
              >
                Historia de Observaciones
              </button>
            </li>
          </ul>
        </div>

        <!-- Tab de nueva observación -->
        <div v-if="activeTab === 'new'" class="mb-6">
          <h3 class="text-lg font-medium mb-3">
            {{ classObservationMode ? 'Observaciones generales de la clase' : 'Observación para el estudiante' }}
          </h3>

          <textarea
            ref="observationTextarea"
            v-model="newObservation"
            rows="6"
            class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :placeholder="'Escriba su observación aquí...'"
            @keydown="handleTextareaKeydown"
          ></textarea>

          <!-- Panel de etiquetas encontradas -->
          <div v-if="taggedStudents.length > 0" class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="(tag, index) in taggedStudents"
              :key="index"
              class="tagged-student-display"
              @click="editStudentTag(tag)"
              title="Clic para editar esta etiqueta"
            >
              @{{ tag }}
            </div>
          </div>

          <!-- Sugerencia de autocompletado -->
          <div v-if="suggestionActive && currentSuggestion" class="mt-1 text-sm">
            <div class="flex items-center">
              <span class="text-gray-500">Sugerencia:</span>
              <span class="ml-2 text-blue-600 font-medium">{{ currentSuggestion }}</span>
              <span class="ml-2 text-gray-500 italic">(Presiona Tab para autocompletar)</span>
            </div>
          </div>

          <div class="flex justify-between text-sm text-gray-500 mt-1">
            <span>{{ characterCount }}/1000 caracteres</span>
            <span :class="{'text-red-500': characterCount > 1000}">
              {{ characterCount > 1000 ? 'Límite excedido' : '' }}
            </span>
          </div>
          <!-- Sección de imágenes -->
          <div class="mt-4 mb-3">
            <!-- Miniaturas de imágenes -->
            <div v-if="imageUrls.length > 0" class="mb-3">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imágenes adjuntas:</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(url, index) in imageUrls"
                  :key="index"
                  class="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-300 cursor-pointer"
                  @click="openImageGallery(index)"
                >
                  <img
                    :src="url"
                    alt="Imagen adjunta"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <button
                      @click.stop="removeImage(index)"
                      class="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-all"
                      title="Eliminar imagen"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de acción para nueva observación -->
          <div class="flex justify-between gap-3 mt-4">
            <div class="flex items-center gap-2">
              <button
                @click="openImageUpload"
                class="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                title="Adjuntar imagen"
              >
                <CameraIcon class="h-5 w-5" />
                <span>Adjuntar imagen</span>
              </button>
            </div>

            <div class="flex gap-2">
              <button @click="handleClose" class="btn btn-secondary">
                Cancelar
              </button>
              <button
                @click="saveObservation"
                :disabled="!(typeof newObservation === 'string' && newObservation.trim()) || isLoading || characterCount > 1000"
                class="btn btn-primary"
              >
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
                <span v-else>Guardar observación</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab de historial -->
        <div v-else-if="activeTab === 'history'">
          <ObservationsHistory
            ref="historyComponent"
            :classId="classId"
            :date="classObservationMode ? undefined : attendanceDate"
            :studentId="classObservationMode ? undefined : studentId"
            @request-edit="handleEditRequestFromHistory"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para etiquetado de estudiantes -->
  <StudentTagModal
    :show="showTagModal"
    :classId="classId"
    @close="closeTagModal"
    @select="insertStudentTag"
  />
  <!-- Modal de ayuda con instrucciones -->
  <div v-if="showHelp" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/50" @click="closeHelp"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl z-10 p-6 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Guía de funcionalidades del editor</h2>
        <button @click="closeHelp" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Viñetas automáticas</h3>
          <p class="mb-2">Para crear listas con viñetas de forma automática:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Escribe una frase y termínala con un punto <span class="font-mono">(.)</span> o dos puntos <span class="font-mono">(:)</span></li>
            <li>Presiona <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd></li>
            <li>Se insertará automáticamente una viñeta en la siguiente línea</li>
          </ol>
          <div class="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded">
            <p class="text-sm italic">Ejemplo: "El estudiante debe practicar lo siguiente:"<br>
            Al presionar Enter, se crea: "• "</p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Etiquetas de estudiantes</h3>
          <p class="mb-2">Puedes etiquetar estudiantes en tus observaciones:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Escribe el símbolo <span class="font-mono">#</span> en cualquier parte del texto</li>
            <li>Se abrirá un selector de estudiantes</li>
            <li>Selecciona al estudiante para insertarlo como <span class="font-mono">@NombreEstudiante</span></li>
            <li>Las etiquetas aparecerán resaltadas debajo del área de texto</li>
            <li>Puedes hacer clic en cualquier etiqueta para editarla si hay algún error</li>
          </ol>
        </div>
          <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Diccionario inteligente</h3>
          <p class="mb-2">El sistema aprende de tus observaciones anteriores para ofrecerte sugerencias:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Escribe observaciones completas y guárdalas para "entrenar" al sistema</li>
            <li>Al escribir nuevas observaciones, cuando el sistema detecte patrones, mostrará sugerencias</li>
            <li>Para aceptar una sugerencia, presiona <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd></li>
            <li>Para ignorar una sugerencia, sigue escribiendo o presiona <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd></li>
          </ol>
          <div class="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded">
            <p class="text-sm italic">El sistema busca coincidencias entre las últimas 3 palabras que escribes y patrones guardados anteriormente. Cuantas más observaciones guardes, más inteligente será el sistema.</p>
          </div>
        </div>
          <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Adjuntar imágenes</h3>
          <p class="mb-2">Puedes adjuntar imágenes a tus observaciones:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Haz clic en el botón <span class="inline-flex items-center dark:text-black gap-1 rounded bg-gray-200 px-2 py-1"><svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg></span> Adjuntar imagen</li>
            <li>Selecciona o arrastra una imagen desde tu dispositivo</li>
            <li>La imagen se subirá automáticamente y aparecerá como miniatura debajo del editor</li>
            <li>Puedes adjuntar múltiples imágenes a una observación</li>
            <li>Las imágenes se guardarán junto con el texto de la observación</li>
          </ol>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Galería de imágenes</h3>
          <p class="mb-2">Ver y gestionar las imágenes adjuntas:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Haz clic en cualquier miniatura para abrir la galería a pantalla completa</li>
            <li>Si hay múltiples imágenes, usa las flechas para navegar entre ellas</li>
            <li>Para eliminar una imagen, pasa el cursor sobre la miniatura y haz clic en el ícono de papelera</li>
            <li>Haz clic fuera de la imagen o en la X para cerrar la galería</li>
          </ol>
          <div class="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded">
            <p class="text-sm italic">Consejo: Las imágenes subidas son perfectas para documentar partituras, posicionamiento de manos, o técnicas específicas que el estudiante debe practicar.</p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Ayuda</h3>
          <p class="mb-2">Siempre puedes volver a mostrar esta ayuda:</p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>Haz clic en el botón <span class="inline-flex items-center px-1 py-1 rounded-full bg-blue-100 text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg></span> junto al título para mostrar esta guía</li>
          </ol>
        </div>
      </div>
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          @click="closeHelp" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de subida de imágenes -->
  <div v-if="showImageUpload" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/50" @click="closeImageUpload"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg z-10 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Subir imagen</h3>
        <button @click="closeImageUpload" class="text-gray-500 hover:text-gray-700">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <FileUpload
        accept="image/*"
        :multiple="false"
        :maxSize="5"
        path="observations"
        @select="isUploadingImage = true"
        @success="handleImageUploadSuccess"
        @error="handleImageUploadError"
        @progress="handleImageUploadProgress"
      />

      <div v-if="isUploadingImage" class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            class="bg-blue-600 h-2.5 rounded-full"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
        <p class="text-sm text-center mt-2">{{ uploadProgress }}% completado</p>
      </div>
    </div>
  </div>

  <!-- Modal de galería de imágenes -->
  <div v-if="showImageGallery && imageUrls.length > 0" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/80" @click="closeImageGallery"></div>
    <div class="relative z-10 max-w-4xl w-full">
      <!-- Imagen principal -->
      <div class="relative bg-white dark:bg-gray-900 p-1 rounded-lg shadow-xl">
        <img
          :src="imageUrls[selectedImageIndex]"
          alt="Imagen ampliada"
          class="w-full h-auto max-h-[80vh] object-contain"
        />

        <!-- Controles de navegación -->
        <div class="absolute top-0 right-0 p-2">
          <button
            @click="handleClose"
            class="bg-white/80 dark:bg-gray-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Controles de navegación -->
        <div v-if="imageUrls.length > 1" class="absolute inset-x-0 top-1/2 flex justify-between px-4 -translate-y-1/2">
          <button
            @click="prevImage"
            class="bg-white/80 dark:bg-gray-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </button>
          <button
            @click="nextImage"
            class="bg-white/80 dark:bg-gray-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800"
          >
            <ArrowRightIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Indicadores de imágenes -->
        <div v-if="imageUrls.length > 1" class="absolute bottom-4 inset-x-0 flex justify-center gap-2">
          <button
            v-for="(_, index) in imageUrls"
            :key="index"
            @click="selectedImageIndex = index"
            :class="[
              'w-2 h-2 rounded-full',
              selectedImageIndex === index ? 'bg-blue-500' : 'bg-gray-400'
            ]"
          ></button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <Toast
    v-if="showToastMessage"
    :show="showToastMessage"
    :message="toastMessage"
    :type="toastType"
    @close="showToastMessage = false"
    class="fixed bottom-5 right-5 z-50"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { XMarkIcon, CameraIcon, ArrowLeftIcon, ArrowRightIcon, TrashIcon } from '@heroicons/vue/24/outline'; // Removed PhotoIcon, DocumentIcon as they are not used
import ObservationsHistory from './ObservationsHistory.vue';
import StudentTagModal from './StudentTagModal.vue';
import FileUpload from '../../../components/FileUpload.vue';
import Toast from '../../../components/Toast.vue'; // Import Toast component
import { useRichEditor } from '../../../composables/useRichEditor';

// Definición de props con TypeScript
const props = defineProps<{
  modelValue?: boolean;
  isVisible: boolean;
  classId: string;
  attendanceDate: string;
  studentId?: string;
  studentName?: string;
  className?: string;
  existingObservation?: any;
  initialObservation?: any;
  classObservationMode?: boolean;
}>();

// Definición de emits con TypeScript
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'observation-saved', observation: any): void;
  (e: 'update:modelValue', value: boolean): void;
  (e: 'observation', observation: any): void;
}>();

// Toast state
const showToastMessage = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Function to display toast
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToastMessage.value = true;
  setTimeout(() => { showToastMessage.value = false }, 3000);
};

const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const teachersStore = useTeachersStore();

// Function to get teacher name by ID
const getTeacherName = async (teacherId: string): Promise<string> => {
  try {
    // First check if teachers are already loaded
    if (teachersStore.teachers.length === 0) {
      await teachersStore.fetchTeachers();
    }
    
    // Find teacher by ID (uid)
    const teacher = teachersStore.teachers.find(t => t.uid === teacherId);
    if (teacher) {
      return teacher.name;
    }
    
    // If not found by uid, try by id
    const teacherById = teachersStore.teachers.find(t => t.id === teacherId);
    if (teacherById) {
      return teacherById.name;
    }
    
    // Fallback to email if teacher not found
    return authStore.user?.email || 'Usuario del Sistema';
  } catch (error) {
    console.error('Error getting teacher name:', error);
    return authStore.user?.email || 'Usuario del Sistema';
  }
};

const activeTab = ref('new');
const isLoading = ref(false);
const historyComponent = ref(null);

const {
  observationTextarea,
  newObservation,
  suggestionActive,
  currentSuggestion,
  showTagModal,
  taggedStudents,
  editStudentTag,
  closeTagModal,
  showHelp,
  openHelp,
  closeHelp,
  showImageUpload,
  imageUrls,
  isUploadingImage,
  uploadProgress,
  showImageGallery,
  selectedImageIndex,
  openImageUpload,
  closeImageUpload,
  handleImageUploadSuccess,
  handleImageUploadError,
  handleImageUploadProgress,
  openImageGallery,
  closeImageGallery,
  nextImage,
  prevImage,
  removeImage,
  handleTextareaKeydown,
  insertStudentTag,
  watchObservationText, // Method to call on text changes
  initializeEditor,      // Method to call on mount
  prepareObservationForSave // Method to prepare data for saving
} = useRichEditor();


const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'Fecha no especificada';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, "d 'de' MMMM yyyy", { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

// Props y emits ya declarados arriba

// Debugging logs
console.log('[AttendanceObservation] Componente inicializado con props:', {
  isVisible: props.isVisible,
  studentId: props.studentId || 'no definido',
  studentName: props.studentName || 'no definido',
  classId: props.classId,
  className: props.className,
  attendanceDate: props.attendanceDate,
  classObservationMode: props.classObservationMode
});

// Watch for modal visibility changes
watch(() => props.modelValue || props.isVisible, (newValue, oldValue) => {
  console.log('[AttendanceObservation] Modal visibility changed:', { 
    anterior: oldValue, 
    nuevo: newValue,
    modelValue: props.modelValue,
    isVisible: props.isVisible,
    timestamp: new Date().toISOString()
  });
}, { immediate: true });

// Watch for initial observation changes
watch(() => props.initialObservation, (newValue) => {
  if (newValue) {
    console.log('[AttendanceObservation] Initial observation received:', newValue);
    // Handle initial observation if needed
  }
}, { immediate: true });

const characterCount = computed(() => {
  return typeof newObservation.value === 'string' ? newObservation.value.length : 0;
});

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
  resetForm();
  emit('close');
};

const resetForm = () => {
  newObservation.value = ''; // This will reset the ref from useRichEditor
  imageUrls.value = [];    // This will reset the ref from useRichEditor
  // taggedStudents.value = []; // This is also from useRichEditor, reset if needed or let useRichEditor handle
  if (Array.isArray(taggedStudents.value)) {
    taggedStudents.value.length = 0; // Clear the array
  }
  isLoading.value = false;
  activeTab.value = 'new';
};

const handleEditRequestFromHistory = (observationToEdit: any) => {
  console.log('Edit request received in AttendanceObservation:', observationToEdit);
  if (observationToEdit) {
    newObservation.value = typeof observationToEdit.text === 'string'
      ? observationToEdit.text
      : (observationToEdit.text as any)?.formattedText || (observationToEdit.text as any)?.text || '';
    
    // Ensure imageUrls from useRichEditor is updated
    if (observationToEdit.imageUrls && Array.isArray(observationToEdit.imageUrls)) {
      imageUrls.value = [...observationToEdit.imageUrls];
    } else {
      imageUrls.value = [];
    }

    if (observationToEdit.taggedStudents && Array.isArray(observationToEdit.taggedStudents)) {
      taggedStudents.value = [...observationToEdit.taggedStudents];
    } else {
      taggedStudents.value = [];
    }
    
    activeTab.value = 'new';
    nextTick(() => {
      observationTextarea.value?.focus();
    });
  }
};

const saveObservation = async () => {
  // newObservation.value is from useRichEditor
  if (!newObservation.value.trim() || characterCount.value > 1000) return;
  isLoading.value = true;
  try {
    // Get teacher name instead of email
    const currentUserId = authStore.user?.uid;
    const teacherName = currentUserId ? await getTeacherName(currentUserId) : 'Usuario del Sistema';
    
    // Use prepareObservationForSave from useRichEditor
    const observationPayload = prepareObservationForSave(); 
    
    const finalObservationData = {
      ...observationPayload, // This includes text, formattedText, and imageUrls
      classId: props.classId,
      date: props.attendanceDate, // This is the date of the attendance/class
      author: teacherName, // Now using teacher name instead of email
      studentId: props.classObservationMode ? null : props.studentId, // Null if class observation
      // createdAt will be set by Firestore server timestamp or service
      // taggedStudents are already part of observationPayload if handled by useRichEditor's prepareObservationForSave
    };

    console.log("Attempting to save observation:", finalObservationData);

    try {
      // Determinar el tipo de observación basado en si tenemos studentId
      const isStudentSpecific = props.studentId && !props.classObservationMode;
      
      console.log(`Saving ${isStudentSpecific ? 'student-specific' : 'class'} observation using addObservationToHistoryFirebase`);
      
      // Preparar datos base de la observación
      const baseObservationData = {
        classId: props.classId,
        date: props.attendanceDate, // Required field
        fecha: props.attendanceDate, // For compatibility
        authorId: currentUserId || '', // Required field
        author: teacherName, // Using teacher name
        text: finalObservationData.text || '', // Required field
        content: {
          text: finalObservationData.text || '', // Ensure text is at least an empty string
          // Si tenemos studentId específico, agregarlo a taggedStudents
          taggedStudents: isStudentSpecific ? [props.studentId!] : [],
          // Agregar otros campos del rich editor si están disponibles
          // bulletPoints: finalObservationData.bulletPoints,
          // works: finalObservationData.works,
          // classDynamics: finalObservationData.classDynamics
        },
        type: 'general' as const, // Type must be one of the specific values
        priority: 'media' as const, // Priority must be one of the specific values
        requiresFollowUp: false // Default, adjust as needed
      };

      // Guardar la observación usando el store
      await attendanceStore.addObservationToHistory(baseObservationData);
      console.log("Observation saved successfully");
      
      // Show success message to the user
      showToast('Observación guardada correctamente', 'success');
      
      // After successful save, let's reload observations history if we're in history tab
      if (activeTab.value === 'history') {
        // Add a small delay before refreshing to allow the database to update
        setTimeout(() => {
          if (historyComponent.value) {
            historyComponent.value.fetchObservations();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error saving observation:", error);
      showToast('Error al guardar la observación', 'error');
      throw error;
    }

    emit('observation-saved', finalObservationData);
    // Also emit the 'observation' event that AttendanceView.vue is listening for
    emit('observation', finalObservationData.text);
    // showToast('Observación guardada'); // Implement or import a toast notification system
    console.log('Observation save initiated (actual call pending). Events emitted: observation-saved, observation');
    close();

  } catch (err) {
    console.error('Error in saveObservation:', err);
    // showToast('Error al guardar: ' + (err as Error).message, { type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.existingObservation, (newVal) => {
  if (newVal && newVal.id && activeTab.value === 'new') { // Check activeTab to avoid overwriting if user switched
    console.log('Populating form with existingObservation:', newVal);
    newObservation.value = typeof newVal.text === 'string' 
        ? newVal.text 
        : (newVal.text as any)?.formattedText || (newVal.text as any)?.text || '';
    imageUrls.value = newVal.imageUrls || [];
    taggedStudents.value = newVal.taggedStudents || [];
     nextTick(() => {
      observationTextarea.value?.focus();
    });
  }
}, { deep: true, immediate: true });


watch(newObservation, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    watchObservationText(); // Call the method from useRichEditor to update tags
  }
});

onMounted(() => {
  initializeEditor(); // Initialize the rich editor features
  if (props.existingObservation && props.existingObservation.id) {
    console.log('Populating form with existingObservation on mount:', props.existingObservation);
    handleEditRequestFromHistory(props.existingObservation);
    activeTab.value = 'new';
  }
});

// Make sure the component is exported as default
defineExpose({});
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {};
}
</script>

<style scoped>
.tagged-student-display {
  background-color: #e0e7ff; /* indigo-100 */
  color: #4f46e5; /* indigo-700 */
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.tagged-student-display:hover {
  background-color: #c7d2fe; /* indigo-200 */
}
.dark .tagged-student-display {
  background-color: #3730a3; /* indigo-800 */
  color: #a5b4fc; /* indigo-400 */
}
.dark .tagged-student-display:hover {
  background-color: #4338ca; /* indigo-700 */
}

/* Ensure prose styles from ObservationsHistory don't conflict if this component has similar needs */
.prose :where(ul):not(:where([class~="not-prose"] *)) {
  list-style-type: disc;
  padding-left: 1.5em;
}
.prose :where(ol):not(:where([class~="not-prose"] *)) {
  list-style-type: decimal;
  padding-left: 1.5em;
}
</style>