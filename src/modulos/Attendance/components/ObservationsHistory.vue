<template>
  <div class="observations-history">
    <!-- Image Viewer Modal -->
    <div
      v-if="showImageViewer"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click="closeImageViewer"
    >
      <div class="relative max-w-4xl max-h-[90vh] p-2">
        <button
          class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
          @click.stop="closeImageViewer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
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
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">Cargando observaciones...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 mx-auto text-red-500 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p class="text-red-700 dark:text-red-400 font-medium">{{ error }}</p>
    </div>

    <div
      v-else-if="!localObservations || localObservations.length === 0"
      class="text-center py-12 flex flex-col items-center"
    >
      <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p class="text-gray-600 dark:text-gray-300 font-medium">No hay observaciones registradas</p>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Las observaciones que agregues aparecerán aquí.
      </p>
    </div>
    <div v-else class="space-y-6">
      <div
        v-for="(observation, index) in sortedObservations"
        :key="observation.id || index"
        class="bg-white dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-600 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <div class="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                {{ getTeacherName(observation.author) }}
                <span
                  v-if="observation.author === 'Sistema'"
                  class="ml-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 py-0.5 px-1.5 rounded-full"
                  >(sistema)</span
                >
                <button
                  v-if="typeof editObservation === 'function'"
                  class="ml-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="Editar esta observación"
                  @click="editObservation(observation)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(observation.createdAt) }}
              </div>
            </div>
          </div>
          <div
            v-if="date && observation.fecha && observation.fecha !== date"
            class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md"
          >
            Fecha: {{ formatDate(observation.fecha) }}
          </div>
        </div>
        <div class="mt-3 pl-9">
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <div class="text-gray-700 dark:text-gray-300 leading-relaxed">
              <div
                v-if="getObservationDisplayText(observation)"
                class="observation-text"
                v-html="processTextForDisplay(getObservationDisplayText(observation)).__html"
              />

              <!-- Fallback for object text if not handled by getObservationDisplayText -->
              <div
                v-else-if="
                  typeof observation.text === 'object' && observation.text && observation.text.text
                "
                class="observation-content"
              >
                <div
                  class="observation-text"
                  v-html="processTextForDisplay(observation.text.text).__html"
                />
              </div>

              <!-- Mostrar imágenes del array si están disponibles -->
              <div v-if="observation.images && observation.images.length" class="mt-4">
                <div
                  class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10v4m0 0h.01M15 10v4m0 0h.01"
                        />
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
import type { ClassObservation } from '../types/attendance';
import * as _ from 'lodash';
import { useAuthStore } from '../../../stores/auth';
import { useTeachersStore } from '../../Teachers/store/teachers';

interface Timestamp {
  seconds: number
  nanoseconds: number
}

const props = defineProps<{
  classId: string
  date?: string
}>();

const emit = defineEmits(['request-edit']);

const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const teachersStore = useTeachersStore();

// Function to get teacher name from teacher ID
const getTeacherName = (teacherId: string): string => {
  if (!teacherId) return 'Usuario desconocido';

  // If it's 'Sistema', return as is
  if (teacherId === 'Sistema') return 'Sistema';

  // Try to find teacher by ID in the teachers store
  const teacher = teachersStore.getTeacherById(teacherId);
  if (teacher) {
    return teacher.name;
  }

  // If not found, try to find by auth UID (fallback)
  const teacherByUid = teachersStore.teachers.find((t) => t.uid === teacherId);
  if (teacherByUid) {
    return teacherByUid.name;
  }

  // Return the original ID if no teacher found
  return teacherId || 'Usuario desconocido';
};

const localObservations = ref<ClassObservation[]>([]);
const loading = ref(true);
const showImageViewer = ref(false);
const currentViewedImage = ref('');
const error = ref<string | null>(null);

const fetchObservations = async () => {
  loading.value = true;
  error.value = null;
  try {
    console.log(
      `[ObservationsHistory] Fetching ALL observations for classId: ${props.classId}, date: ${props.date}`,
    );

    // Obtener TODAS las observaciones de la clase, no solo las del profesor actual
    // Usar el método que obtiene observaciones de todos los profesores
    const allObservations = await attendanceStore.fetchObservationsForClass(props.classId);

    let filteredObservations = allObservations;

    // Filtrar por fecha solo si se especifica una fecha
    if (props.date) {
      filteredObservations = filteredObservations.filter((obs) => obs.fecha === props.date);
      console.log(
        `[ObservationsHistory] Filtered observations for specific date ${props.date}:`,
        filteredObservations,
      );
    } else {
      console.log(
        `[ObservationsHistory] Fetched all observations for class ${props.classId} (no date filter):`,
        filteredObservations,
      );
    }

    localObservations.value = filteredObservations;

    if (!localObservations.value || localObservations.value.length === 0) {
      console.log('[ObservationsHistory] No observations found after fetch/filter.');
    } else {
      console.log(
        `[ObservationsHistory] Found ${localObservations.value.length} observations for display`,
      );
    }
  } catch (err) {
    console.error('[ObservationsHistory] Error fetching observations:', err);
    error.value = 'Error al cargar el historial de observaciones. ' + (err.message || '');
  } finally {
    loading.value = false;
  }
};

const sortedObservations = computed(() => {
  return [...localObservations.value].sort((a, b) => {
    const getDate = (obs: ClassObservation): Date | null => {
      if (obs.fecha) return parseISO(obs.fecha);
      if (obs.createdAt) {
        if (typeof obs.createdAt === 'string') return parseISO(obs.createdAt);
        if (typeof obs.createdAt === 'object' && obs.createdAt instanceof Date) {
          return obs.createdAt;
        }
        if (typeof obs.createdAt === 'object' && 'seconds' in obs.createdAt) {
          return new Date((obs.createdAt as any).seconds * 1000);
        }
      }
      return null;
    };
    const dateA = getDate(a);
    const dateB = getDate(b);
    if (dateA && dateB) return dateB.getTime() - dateA.getTime();
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
});

const formatDateTime = (dateValue: string | Timestamp | Date | any): string => {
  if (!dateValue) return 'Fecha desconocida';
  try {
    let date;
    if (
      typeof dateValue === 'object' &&
      dateValue !== null &&
      'seconds' in dateValue &&
      'nanoseconds' in dateValue
    ) {
      date = new Date((dateValue as Timestamp).seconds * 1000);
    } else if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'Fecha desconocida';
    }
    return format(date, 'd \'de\' MMMM yyyy, HH:mm', { locale: es });
  } catch (error) {
    return typeof dateValue === 'string' ? dateValue : 'Fecha desconocida';
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Fecha desconocida';
  try {
    const date = parseISO(dateString);
    return format(date, 'd \'de\' MMMM yyyy', { locale: es });
  } catch (error) {
    return dateString;
  }
};

const processTextForDisplay = (text: string): {__html: string} => {
  if (!text) return { __html: '' };
  let processedText = _.escape(text);
  processedText = processedText.replace(
    /@([A-Za-z0-9À-ÖØ-öø-ÿ]+(?:\s+[A-Za-z0-9À-ÖØ-öø-ÿ]+)*)/g,
    '<span class="student-tag">@$1</span>',
  );
  processedText = processedText.replace(
    /#([A-Za-z0-9À-ÖØ-öø-ÿ]+(?:\s+[A-Za-z0-9À-ÖØ-öø-ÿ]+)*)/g,
    '<span class="student-tag">#$1</span>',
  );
  const keywords = ['importante', 'urgente', 'pendiente', 'completado', 'revisar'];
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    processedText = processedText.replace(
      regex,
      `<span class="keyword-tag keyword-${keyword.toLowerCase()}">$1</span>`,
    );
  });
  const lines = processedText.split(/\r\n|\n|\r/);
  let htmlOutput = '';
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  for (const line of lines) {
    const trimmedLine = line.trim();
    let listItem = null;
    if (trimmedLine.match(/^[-•*]\s+/)) {
      listItem = `<li>${trimmedLine.substring(trimmedLine.indexOf(' ') + 1)}</li>`;
      if (!inList || listType === 'ol') {
        if (inList && listType === 'ol') htmlOutput += '</ol>';
        htmlOutput += '<ul class="list-disc pl-5">';
        listType = 'ul';
        inList = true;
      }
    } else if (trimmedLine.match(/^\d+\.\s+/)) {
      listItem = `<li>${trimmedLine.substring(trimmedLine.indexOf('.') + 2)}</li>`;
      if (!inList || listType === 'ul') {
        if (inList && listType === 'ul') htmlOutput += '</ul>';
        htmlOutput += '<ol class="list-decimal pl-5">';
        listType = 'ol';
        inList = true;
      }
    } else {
      if (inList) {
        htmlOutput += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
        listType = null;
      }
      htmlOutput += line + '\n';
    }
    if (listItem) {
      htmlOutput += listItem;
    }
  }
  if (inList) {
    htmlOutput += listType === 'ul' ? '</ul>' : '</ol>';
  }
  const finalHtml = htmlOutput.replace(/\n/g, '<br />').replace(/<br \/>(<(ul|ol|li))/g, '$1');
  return { __html: finalHtml };
};

const getObservationDisplayText = (observation: ClassObservation): string => {
  // Prioridad: usar el campo text directamente
  if (observation.text && typeof observation.text === 'string') {
    return observation.text;
  }

  // Fallback: usar content.text
  if (observation.content && observation.content.text) {
    return observation.content.text;
  }

  // Compatibilidad con formato anterior
  if (
    (observation as any).formattedText &&
    typeof (observation as any).formattedText === 'string'
  ) {
    return (observation as any).formattedText;
  }

  if (typeof (observation as any).text === 'object' && (observation as any).text !== null) {
    const textObj = (observation as any).text as any;
    if (textObj.formattedText && typeof textObj.formattedText === 'string') {
      return textObj.formattedText;
    }
    if (textObj.text && typeof textObj.text === 'string') {
      return textObj.text;
    }
  }

  console.log('[ObservationsHistory] No se pudo extraer texto de la observación:', observation);
  return 'Sin contenido de texto';
};

const openImageViewer = (imageSrc: string) => {
  currentViewedImage.value = imageSrc;
  showImageViewer.value = true;
  document.body.style.overflow = 'hidden';
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  currentViewedImage.value = '';
  document.body.style.overflow = '';
};

const editObservation = (observation: ClassObservation) => {
  console.log('[ObservationsHistory] Requesting edit for:', JSON.parse(JSON.stringify(observation)));
  emit('request-edit', JSON.parse(JSON.stringify(observation)));
};

// Function to delete an observation
const deleteObservation = async (observation: ClassObservation) => {
  if (!observation.id) {
    console.error('No observation ID provided for deletion');
    return;
  }

  const confirmDelete = confirm(
    '¿Está seguro de que desea eliminar esta observación? Esta acción no se puede deshacer.',
  );
  if (!confirmDelete) return;

  try {
    loading.value = true;
    // Call store method to delete observation
    await attendanceStore.deleteObservation(observation.id);

    // Remove from local array
    localObservations.value = localObservations.value.filter((obs) => obs.id !== observation.id);

    console.log('Observation deleted successfully');
  } catch (error) {
    console.error('Error deleting observation:', error);
    alert(
      'Error al eliminar la observación: ' +
        (error instanceof Error ? error.message : 'Error desconocido'),
    );
  } finally {
    loading.value = false;
  }
};

// Function to download observations as PDF
const downloadObservationsPDF = async () => {
  try {
    loading.value = true;

    // Dynamic import of jsPDF and autoTable
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Historial de Observaciones', 14, 20);

    // Add subtitle with class and date info
    doc.setFontSize(12);
    let subtitle = `Clase: ${props.classId}`;
    if (props.date) {
      subtitle += ` | Fecha: ${formatDate(props.date)}`;
    }
    doc.text(subtitle, 14, 30);

    // Prepare data for table
    const tableData = sortedObservations.value.map((obs) => [
      formatDateTime(obs.createdAt),
      getTeacherName(obs.authorId || obs.author || ''),
      getObservationDisplayText(obs).substring(0, 200) +
        (getObservationDisplayText(obs).length > 200 ? '...' : ''),
      obs.type || 'General',
      obs.priority || 'Media',
    ])

    // Create table
    ;(doc as any).autoTable({
      head: [['Fecha', 'Autor', 'Observación', 'Tipo', 'Prioridad']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    });

    // Save the PDF
    const fileName = `observaciones_${props.classId}_${props.date || 'todas'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(
      'Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'),
    );
  } finally {
    loading.value = false;
  }
};

// Expose functions for parent component
defineExpose({
  fetchObservations,
  downloadObservationsPDF,
});

watch(() => [props.classId, props.date, authStore.user?.uid], fetchObservations, {
  immediate: true,
  deep: true,
});

onMounted(() => {
  // Initial fetch handled by watcher
});
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
  gap: 0.5rem; /* 8px */
}
.image-thumbnail {
  width: 100px; /* Adjust as needed */
  height: 100px; /* Adjust as needed */
  border-radius: 0.375rem; /* 6px */
  overflow: hidden;
  position: relative;
  border: 1px solid #e5e7eb; /* Tailwind gray-200 */
}
.image-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease-in-out;
}
.image-thumbnail:hover img {
  transform: scale(1.05);
}
.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  color: white;
}
.image-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.dark .image-thumbnail {
  border-color: #4b5563; /* Tailwind gray-600 */
}

.prose :where(ul):not(:where([class~="not-prose"] *)) {
  list-style-type: disc;
  padding-left: 1.5em; /* Adjust as needed */
}
.prose :where(ol):not(:where([class~="not-prose"] *)) {
  list-style-type: decimal;
  padding-left: 1.5em; /* Adjust as needed */
}
</style>
