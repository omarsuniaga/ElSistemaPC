<template>
  <div class="observations-history">
    <!-- Image Viewer Modal -->
    <div v-if="showImageViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="closeImageViewer">
      <div class="relative max-w-4xl max-h-[90vh] p-2">
        <button 
          @click.stop="closeImageViewer" 
          class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          :src="currentViewedImage" 
          alt="Vista ampliada" 
          class="max-h-[85vh] max-w-full rounded-lg shadow-xl"
          @click.stop
        />
      </div>
    </div>
    
    <div v-if="loading" class="flex flex-col justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">Cargando observaciones...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-red-700 dark:text-red-400 font-medium">{{ error }}</p>
    </div>
    
    <div v-else-if="!observations.length" class="text-center py-12 flex flex-col items-center">
      <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-gray-600 dark:text-gray-300 font-medium">No hay observaciones registradas</p>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Las observaciones que agregues aparecerán aquí.</p>
    </div>
      <div v-else class="space-y-6">
      <div v-for="(observation, index) in sortedObservations" :key="index" 
           class="bg-white dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-600 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <div class="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ observation.author || 'Usuario desconocido' }}
                <span v-if="observation.author === 'Sistema'" class="ml-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 py-0.5 px-1.5 rounded-full">(sistema)</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(observation.createdAt) }}
                
              </div>
            </div>
          </div>
          <div v-if="date && observation.date && observation.date !== date" 
               class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md">
            Fecha: {{ formatDate(observation.date) }}
          </div>
        </div>
          <div class="mt-3 pl-9">
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <div class="text-gray-700 dark:text-gray-300 leading-relaxed">              <!-- Formatear el texto de la observación con soporte para etiquetas y listas -->
              <div 
                v-if="getObservationText(observation)" 
                class="observation-text"
                v-html="processTextForDisplay(getObservationText(observation)).__html"
              ></div>
              
              <!-- Mostrar datos adicionales si existen en formato objeto -->
              <div v-else-if="typeof observation.text === 'object' && observation.text" class="observation-content">
                <div v-if="observation.text.text" class="observation-text" v-html="processTextForDisplay(observation.text.text).__html"></div>
              </div>
              <!-- Detectar y mostrar imágenes por referencias en el texto -->
              <div v-if="observation.text && hasImageReferences(observation.text)" class="mt-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tiene imágenes adjuntas
                </div>
              </div>
                <!-- Mostrar imágenes del array si están disponibles -->
              <div v-if="observation.images && observation.images.length" class="mt-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Imágenes adjuntas ({{ observation.images.length }})
                </div>
                <div class="image-gallery">
                  <div 
                    v-for="(img, imgIndex) in observation.images" 
                    :key="imgIndex" 
                    class="image-thumbnail cursor-pointer"
                    @click="openImageViewer(img)"
                  >
                    <img 
                      :src="img" 
                      alt="Imagen adjunta" 
                      class="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div class="thumbnail-overlay">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10v4m0 0h.01M15 10v4m0 0h.01" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../store/attendance';
import * as _ from 'lodash'; // Import full lodash library instead of just debounce

interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

interface Observation {
  text: string | any; // Make text support both string and object types
  createdAt: string | Timestamp;
  timestamp?: Timestamp;
  author?: string;
  id?: string;
  classId?: string;
  date?: string;
  images?: string[];
  formattedText?: string;
}

const props = defineProps<{
  classId: string;
  date?: string;
}>();

const attendanceStore = useAttendanceStore();
const observations = ref<Observation[]>([]);
const loading = ref(true);
const showImageViewer = ref(false);
const currentViewedImage = ref('');
const error = ref<string | null>(null);

// Sort observations by date of la clase (observation.date), most recent first
const sortedObservations = computed(() => {
  return [...observations.value].sort((a, b) => {
    // Si ambos tienen campo 'date', ordenar por ese campo (descendente)
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    // Si solo uno tiene 'date', ese va primero
    if (a.date) return -1;
    if (b.date) return 1;
    
    // Si ninguno tiene 'date', usar createdAt o timestamp
    let aTime, bTime;
    
    // Get timestamp from createdAt (string or timestamp object)
    if (a.createdAt) {
      aTime = typeof a.createdAt === 'object' && 'seconds' in a.createdAt 
        ? new Date(a.createdAt.seconds * 1000).getTime() 
        : new Date(a.createdAt).getTime();
    }
    
    if (b.createdAt) {
      bTime = typeof b.createdAt === 'object' && 'seconds' in b.createdAt 
        ? new Date(b.createdAt.seconds * 1000).getTime() 
        : new Date(b.createdAt).getTime();
    }
    
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return bTime - aTime; // Most recent first
  });
});

// Format date and time for display
const formatDateTime = (dateValue: string | Timestamp | { seconds: number, nanoseconds: number } | any): string => {
  if (!dateValue) return 'Fecha desconocida';
  
  try {
    let date;
    
    // Handle Firebase timestamp format
    if (typeof dateValue === 'object' && 'seconds' in dateValue && 'nanoseconds' in dateValue) {
      // Convert seconds to milliseconds
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      console.warn('Unknown date format:', dateValue);
      return 'Fecha desconocida';
    }
    
    if (!isNaN(date.getTime())) {
      // Format with just hours and minutes, no seconds or nanoseconds
      return format(date, "d 'de' MMMM yyyy, HH:mm", { locale: es });
    }
    
    // Fallback to string representation
    return typeof dateValue === 'string' ? dateValue : 'Fecha desconocida';
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return typeof dateValue === 'string' ? dateValue : 'Fecha desconocida';
  }
};

// Format just the date portion
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Fecha desconocida';
  
  try {
    const date = parseISO(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, "d 'de' MMMM yyyy", { locale: es });
    }
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format observation text to handle image references, bullet points, and student tags
const formatObservationText = (text: string): string => {
  if (!text) return '';
  
  // If the text has image references marker, split the text and return only the content part
  const imageSectionMarker = '--- Imágenes adjuntas ---';
  if (text.includes(imageSectionMarker)) {
    text = text.split(imageSectionMarker)[0].trim();
  }
  
  return text;
};

// Process text for displaying, handling bullets and student tags
const processTextForDisplay = (text: string): { __html: string } => {
  if (!text) return { __html: '' };
  
  // Replace student tags with styled span elements
  // This handles both @username and full names like @FirstName LastName
  let processedText = text.replace(/@([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)/g, '<span class="student-tag">@$1</span>');
  
  // Also handle any potential "#" tags that might be incorrectly formatted
  processedText = processedText.replace(/#([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)/g, '<span class="student-tag">#$1</span>');
  
  // Add special styling for keywords
  const keywords = ['importante', 'urgente', 'pendiente', 'completado', 'revisar'];
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    processedText = processedText.replace(regex, `<span class="keyword-tag keyword-${keyword.toLowerCase()}">$&</span>`);
  });
  
  // Process bullet points and lists
  // Convert "- " or "• " at the beginning of lines to bullet points
  processedText = processedText.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  // Convert "* " at the beginning of lines to bullet points
  processedText = processedText.replace(/^\* (.+)$/gm, '<li>$1</li>');
  // Convert "1. ", "2. " etc. at the beginning of lines to numbered list items
  processedText = processedText.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  
  // Wrap lists in <ul> or <ol> tags if they contain list items
  if (processedText.includes('<li>')) {
    const lines = processedText.split('\n');
    let inList = false;
    let isNumberedList = false;
    let result = '';
    
    for (const line of lines) {
      // Check if this is a numbered list item
      const isNumbered = /^\d+\.\s/.test(line.trim());
      
      if (line.trim().startsWith('<li>') && !inList) {
        // Start a new list
        isNumberedList = isNumbered;
        const listTag = isNumberedList ? 'ol' : 'ul';
        const listClass = isNumberedList ? 'list-decimal' : 'list-disc';
        result += `<${listTag} class="${listClass} pl-5 mb-3">\n`;
        inList = true;
      } else if (!line.trim().startsWith('<li>') && inList) {
        // End the current list
        const listTag = isNumberedList ? 'ol' : 'ul';
        result += `</${listTag}>\n`;
        inList = false;
      }
      
      result += line + '\n';
    }
    
    if (inList) {
      // Close any open list at the end
      const listTag = isNumberedList ? 'ol' : 'ul';
      result += `</${listTag}>\n`;
    }
    
    processedText = result;
  }
  
  // Convert line breaks to <br> tags for non-list content
  processedText = processedText.replace(/\n/g, '<br>');
  
  return { __html: processedText };
};

// Check if text contains image references
const hasImageReferences = (text: string | any): boolean => {
  if (!text) return false;
  
  if (typeof text === 'string') {
    // Check if text has the image references marker
    const imageSectionMarker = '--- Imágenes adjuntas ---';
    return text.includes(imageSectionMarker);
  }
  
  // Check if text is an object with images property
  if (typeof text === 'object' && text !== null) {
    if ('images' in text && Array.isArray((text as any).images) && (text as any).images.length > 0) {
      return true;
    }
  }
  
  return false;
};

// Get the appropriate text from the observation object
const getObservationText = (observation: Observation): string => {
  // First try to use formattedText if available
  if (observation.formattedText && typeof observation.formattedText === 'string') {
    return observation.formattedText;
  }
  
  // Fall back to text if formattedText is not available
  if (observation.text && typeof observation.text === 'string') {
    return formatObservationText(observation.text);
  }
  
  // Handle nested text object
  if (observation.text && typeof observation.text === 'object') {
    const textObj = observation.text as any; // Cast to any to avoid TypeScript errors
    
    if (textObj && 'text' in textObj && typeof textObj.text === 'string') {
      return formatObservationText(textObj.text);
    } else if (textObj && 'formattedText' in textObj && typeof textObj.formattedText === 'string') {
      return textObj.formattedText;
    }
  }
  
  // Return empty string as last resort
  return '';
};
// Alias for backward compatibility in template
const getObservationDisplayText = getObservationText;

// Fetch observations for the class
const fetchObservations = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Only attempt to fetch if we have a classId
    if (props.classId) {
      observations.value = await attendanceStore.getObservationsHistory(props.classId, props.date);
      console.log('Fetched observations:', observations.value);
    } else {
      console.warn('No classId provided, skipping observation fetch');
      observations.value = [];
    }
  } catch (err) {
    // Fix: Use toString() instead of String() constructor
    const errorMsg = err instanceof Error ? err.message : (err ? err.toString() : 'Unknown error');
    console.error('Error fetching observations:', errorMsg);
    error.value = 'Error al cargar las observaciones: ' + errorMsg;
    observations.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for changes in props to refetch data
watch(() => [props.classId, props.date], fetchObservations);

// Also watch for changes in the observationsHistory from the store
// This ensures that when new observations are added from other components,
// this component refreshes automatically
const updateObservationsFromStore = _.debounce((newObservations: any[]) => {
  if (newObservations && newObservations.length > 0) {
    // Filter to only include observations matching our classId if specified
    if (props.classId) {
      observations.value = newObservations.filter(obs => obs.classId === props.classId);
    } else {
      observations.value = [...newObservations];
    }
    console.log('Updated observations from store watch:', observations.value);
  }
}, 500);

watch(
  () => attendanceStore.observationsHistory,
  (newObservations) => {
    if (newObservations) {
      updateObservationsFromStore(newObservations);
    }
  },
  { deep: true }
);

// Image viewer functions
const openImageViewer = (imageSrc: string) => {
  currentViewedImage.value = imageSrc;
  showImageViewer.value = true;
  
  // Prevent scrolling when modal is open
  document.body.style.overflow = 'hidden';
  
  // Add analytics for tracking (optional)
  console.log('Image viewer opened:', imageSrc);
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  currentViewedImage.value = '';
  
  // Restore scrolling when modal is closed
  document.body.style.overflow = '';
};

watch(() => [props.classId, props.date], fetchObservations);

onMounted(fetchObservations);
</script>

<style scoped>
.student-tag {
  display: inline-block;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  color: #3b82f6;
  font-weight: 500;
  margin: 0 0.125rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.2s;
}

.student-tag:hover {
  background-color: rgba(59, 130, 246, 0.15);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .student-tag {
  background-color: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.3);
}

.keyword-tag {
  display: inline-block;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-weight: 500;
  margin: 0 0.125rem;
}

.keyword-importante {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.keyword-urgente {
  background-color: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.keyword-pendiente {
  background-color: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.keyword-completado {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.keyword-revisar {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.image-thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.dark .image-thumbnail {
  border-color: #374151;
}

.image-thumbnail:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.2s ease;
}

.thumbnail-overlay svg {
  opacity: 0;
  color: white;
  transition: opacity 0.2s ease;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.image-thumbnail:hover .thumbnail-overlay {
  background-color: rgba(0, 0, 0, 0.3);
}

.image-thumbnail:hover .thumbnail-overlay svg {
  opacity: 1;
}

.observation-text {
  line-height: 1.5;
}

.observation-text ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.observation-text ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.observation-text li {
  margin-bottom: 0.25rem;
}
</style>