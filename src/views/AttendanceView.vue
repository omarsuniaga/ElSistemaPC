<template>
  <div class="attendance-view min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Registro de Asistencia
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ mode === 'calendar' ? 'Seleccione una fecha en el calendario' : 'Gestione la asistencia de los alumnos' }}
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2">
        <button 
          @click="$router.push('/attendance/calendar')" 
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
        >
          <CalendarIcon class="mr-2 h-5 w-5" />
          Calendario
        </button>
        <button 
          @click="$router.push('/teacher/attendance/informe')" 
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
        >
          <DocumentChartBarIcon class="mr-2 h-5 w-5" />
          Informes
        </button>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Left Side Content - Class & Date Selection -->
      <div class="w-full lg:w-1/3">
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <!-- Date Selection -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <CalendarIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Seleccionar Fecha
            </h2>
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                <input 
                  type="date" 
                  v-model="selectedDate"
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div v-if="mode === 'calendar'">
                <!-- Calendar Component Placeholder -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                  <div class="calendar-container">
                    <!-- Calendar will be rendered here -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Class Selection -->
          <div class="p-4">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <AcademicCapIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Seleccionar Clase
            </h2>
            <div class="mt-4 space-y-4">
              <div v-if="classes.length > 0">
                <div class="mt-1 space-y-2">
                  <div v-for="cls in classes" :key="cls.id" 
                       class="flex items-center">
                    <button 
                      @click="selectClass(cls)"
                      :class=" [
                        'flex-1 flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        selectedClassId === cls.id ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500 dark:border-primary-400' : ''
                      ]"
                    >
                      <div class="flex items-start">
                        <div class="flex-shrink-0">
                          <span class="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                            {{ cls.name[0] }}
                          </span>
                        </div>
                        <div class="ml-3 text-left">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cls.name }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ cls.schedule ? formatSchedule(cls.schedule) : "Sin horario" }}
                          </p>
                        </div>
                      </div>
                      <div 
                        v-if="hasAttendanceRecord(cls.id, selectedDate)" 
                        class="flex-shrink-0 ml-2"
                      >
                        <CheckCircleIcon class="h-5 w-5 text-green-500" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay clases disponibles</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron clases asignadas para este día.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Content - Attendance List -->
      <div class="w-full lg:w-2/3">
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ClipboardDocumentCheckIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Lista de Asistencia
            </h2>

            <div class="flex flex-wrap gap-2">
              <div class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                Presentes: {{ attendanceSummary.present }}
              </div>
              <div class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                Ausentes: {{ attendanceSummary.absent }}
              </div>
              <div class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                Tardanzas: {{ attendanceSummary.late }}
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-center items-center p-8">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-white transition ease-in-out duration-150">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando lista de asistencia...
            </div>
          </div>

          <div v-else-if="!selectedClassId || !selectedDate" class="flex flex-col items-center justify-center p-8 text-center">
            <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700">
              <HandRaisedIcon class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Seleccione una clase y fecha</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Para gestionar la asistencia de los alumnos, seleccione una fecha y clase.
            </p>
          </div>

          <div v-else-if="students.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
            <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700">
              <UserGroupIcon class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No hay estudiantes en esta clase</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Esta clase no tiene estudiantes asignados actualmente.
            </p>
          </div>

          <div v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-750">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div v-if="student.photoURL" class="h-10 w-10 rounded-full overflow-hidden">
                            <img :src="student.photoURL" alt="" class="h-full w-full object-cover" />
                          </div>
                          <div v-else class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span class="text-md font-medium text-gray-500 dark:text-gray-400">
                              {{ student.nombre ? student.nombre[0] : '?' }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ student.nombre }} {{ student.apellido }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            ID: {{ student.id.substring(0, 6) }}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col sm:flex-row justify-center items-center gap-2">
                        <div class="flex justify-center items-center gap-2">
                          <!-- Present -->
                          <button 
                            @click="updateAttendance(student.id, 'Presente')"
                            :class=" [
                              'px-3 py-1 rounded-md flex items-center text-sm font-medium',
                              attendanceData[student.id] === 'Presente' 
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                            ]"
                          >
                            <CheckIcon class="h-4 w-4 mr-1" />
                            <span class="hidden sm:inline">Presente</span>
                            <span class="sm:hidden">P</span>
                          </button>
                          
                          <!-- Absent -->
                          <button 
                            @click="updateAttendance(student.id, 'Ausente')"
                            :class=" [
                              'px-3 py-1 rounded-md flex items-center text-sm font-medium',
                              attendanceData[student.id] === 'Ausente' 
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30'
                            ]"
                          >
                            <XMarkIcon class="h-4 w-4 mr-1" />
                            <span class="hidden sm:inline">Ausente</span>
                            <span class="sm:hidden">A</span>
                          </button>
                        </div>
                        
                        <div class="flex justify-center items-center gap-2">
                          <!-- Late -->
                          <button 
                            @click="updateAttendance(student.id, 'Tardanza')"
                            :class=" [
                              'px-3 py-1 rounded-md flex items-center text-sm font-medium',
                              attendanceData[student.id] === 'Tardanza' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                            ]"
                          >
                            <ClockIcon class="h-4 w-4 mr-1" />
                            <span class="hidden sm:inline">Tarde</span>
                            <span class="sm:hidden">T</span>
                          </button>
                          
                          <!-- Justified -->
                          <button 
                            @click="updateAttendance(student.id, 'Justificado')"
                            :class=" [
                              'px-3 py-1 rounded-md flex items-center text-sm font-medium',
                              attendanceData[student.id] === 'Justificado' 
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                            ]"
                          >
                            <DocumentTextIcon class="h-4 w-4 mr-1" />
                            <span class="hidden sm:inline">Justificado</span>
                            <span class="sm:hidden">J</span>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        @click="openJustificationDialog(student)" 
                        class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Añadir justificante
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-750">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones:</label>
                <textarea 
                  v-model="observations" 
                  class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Agregar observaciones para esta clase..."
                ></textarea>
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="clearAttendance()" 
                  class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button 
                  @click="saveAttendance()" 
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Justification Modal -->
    <Dialog :open="showJustificationModal" @close="closeJustificationModal" class="relative z-50">
      <div class="fixed inset-0 bg-black/30 dark:bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div class="mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Añadir Justificante</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Estudiante: {{ selectedStudent?.nombre }} {{ selectedStudent?.apellido }}
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo:</label>
              <textarea 
                id="reason" 
                v-model="justificationReason"
                rows="3" 
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Escribe el motivo de la justificación"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Documento (opcional):</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <label for="file-upload" class="relative cursor-pointer rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none">
                      <span>Subir un archivo</span>
                      <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="onFileSelected">
                    </label>
                    <p class="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, PDF hasta 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button 
              @click="closeJustificationModal"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button 
              @click="saveJustification"
              class="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              Guardar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Dialog, DialogPanel } from '@headlessui/vue';
import { 
  CalendarIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  DocumentChartBarIcon
} from '@heroicons/vue/24/outline';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useClassesStore } from '../stores/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useToast } from '../components/ui/toast/use-toast';

// Props
const props = defineProps({
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD
  },
  classId: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: '' // 'calendar' or empty
  }
});

// Store initialization
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const { toast } = useToast();
const route = useRoute();
const router = useRouter();

// State
const selectedDate = ref(props.date || new Date().toISOString().split('T')[0]);
const selectedClassId = ref(props.classId || '');
const classes = ref([]);
const students = ref([]);
const isLoading = ref(true);
const attendanceData = ref({});
const observations = ref('');
const showJustificationModal = ref(false);
const selectedStudent = ref(null);
const justificationReason = ref('');
const justificationFile = ref(null);

// Computed properties
const attendanceSummary = computed(() => {
  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    justified: 0
  };
  
  Object.values(attendanceData.value).forEach(status => {
    if (status === 'Presente') summary.present++;
    else if (status === 'Ausente') summary.absent++;
    else if (status === 'Tardanza') summary.late++;
    else if (status === 'Justificado') summary.justified++;
  });
  
  return summary;
});

// Watch for route/prop changes
watch([() => props.date, () => props.classId], () => {
  selectedDate.value = props.date || selectedDate.value;
  selectedClassId.value = props.classId || selectedClassId.value;
  loadData();
});

// Methods
async function loadData() {
  try {
    isLoading.value = true;
    
    // Load classes
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }
    
    classes.value = classesStore.classes;
    
    // If a class is selected, load its students
    if (selectedClassId.value) {
      await loadStudentsForClass(selectedClassId.value);
      
      // Load existing attendance data
      if (selectedDate.value) {
        await loadAttendanceData(selectedDate.value, selectedClassId.value);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar los datos. Inténtelo de nuevo.',
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
}

async function loadStudentsForClass(classId) {
  try {
    // Make sure students are loaded
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }
    
    // Filter students for this class
    students.value = studentsStore.students.filter(student => student.classId === classId);
  } catch (error) {
    console.error('Error loading students for class:', error);
    students.value = [];
  }
}

async function loadAttendanceData(date, classId) {
  try {
    const records = await attendanceStore.fetchAttendanceByClassAndDate(classId, date);
    
    // Initialize attendance data
    const data = {};
    students.value.forEach(student => {
      // Set default status to 'Ausente'
      data[student.id] = 'Ausente';
    });
    
    // Update with existing records
    for (const studentId in records) {
      const status = records[studentId];
      data[studentId] = status;
    }
    
    attendanceData.value = data;
    
    // Load observations
    if (attendanceStore.currentAttendanceDoc?.data?.observations) {
      observations.value = attendanceStore.currentAttendanceDoc.data.observations;
    } else {
      observations.value = '';
    }
    
  } catch (error) {
    console.error('Error loading attendance data:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar los datos de asistencia. Inténtelo de nuevo.',
      variant: 'destructive'
    });
  }
}

function selectClass(cls) {
  selectedClassId.value = cls.id;
  // Update the URL to reflect the selection
  router.replace({
    path: `/attendance/${selectedDate.value}/${cls.id}`
  });
  
  // Load students and attendance data for this class
  loadStudentsForClass(cls.id);
  loadAttendanceData(selectedDate.value, cls.id);
}

function updateAttendance(studentId, status) {
  attendanceData.value[studentId] = status;
}

function hasAttendanceRecord(classId, date) {
  // Check if we have any attendance records for this class on this date
  return attendanceStore.attendanceDocuments.some(doc => 
    doc.classId === classId && 
    (doc.fecha === date || doc.Fecha === date || doc.date === date) &&
    doc.data && (
      (doc.data.presentes && doc.data.presentes.length > 0) || 
      (doc.data.ausentes && doc.data.ausentes.length > 0) || 
      (doc.data.tarde && doc.data.tarde.length > 0)
    )
  );
}

function formatSchedule(schedule) {
  if (!schedule || !schedule.slots || schedule.slots.length === 0) {
    return "Sin horario";
  }
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const days = schedule.slots.map(slot => {
    let day = typeof slot.day === 'number' ? slot.day : 0;
    return dayNames[day];
  }).join(', ');
  
  return days;
}

function openJustificationDialog(student) {
  selectedStudent.value = student;
  
  // Check if there's an existing justification
  if (attendanceStore.currentAttendanceDoc?.data?.justificacion) {
    const existing = attendanceStore.currentAttendanceDoc.data.justificacion.find(
      j => j.id === student.id
    );
    
    if (existing) {
      justificationReason.value = existing.reason || '';
    } else {
      justificationReason.value = '';
    }
  } else {
    justificationReason.value = '';
  }
  
  justificationFile.value = null;
  showJustificationModal.value = true;
}

function closeJustificationModal() {
  showJustificationModal.value = false;
  selectedStudent.value = null;
  justificationReason.value = '';
  justificationFile.value = null;
}

function onFileSelected(event) {
  justificationFile.value = event.target.files[0] || null;
}

async function saveJustification() {
  try {
    if (!selectedStudent.value) return;
    
    // Mark student as justified and tardy
    attendanceData.value[selectedStudent.value.id] = 'Justificado';
    
    // Add justification to the database
    await attendanceStore.addJustificationToAttendance(
      selectedStudent.value.id,
      selectedDate.value,
      selectedClassId.value,
      justificationReason.value,
      justificationFile.value
    );
    
    toast({
      title: 'Justificación guardada',
      description: 'La justificación ha sido registrada correctamente.',
      variant: 'default'
    });
    
    closeJustificationModal();
  } catch (error) {
    console.error('Error saving justification:', error);
    toast({
      title: 'Error',
      description: 'No se pudo guardar la justificación. Inténtelo de nuevo.',
      variant: 'destructive'
    });
  }
}

async function saveAttendance() {
  try {
    isLoading.value = true;
    
    // Prepare attendance data to save
    const presentStudents = [];
    const absentStudents = [];
    const lateStudents = [];
    
    for (const [studentId, status] of Object.entries(attendanceData.value)) {
      if (status === 'Presente') presentStudents.push(studentId);
      else if (status === 'Ausente') absentStudents.push(studentId);
      else if (status === 'Tardanza' || status === 'Justificado') lateStudents.push(studentId);
      
      // Also save individual records for backward compatibility
      await attendanceStore.saveAttendance({
        studentId,
        classId: selectedClassId.value,
        Fecha: selectedDate.value,
        status
      });
    }
    
    // Create or update the attendance document
    const attendanceDoc = {
      fecha: selectedDate.value,
      classId: selectedClassId.value,
      teacherId: classesStore.classes.find(c => c.id === selectedClassId.value)?.teacherId || '',
      data: {
        presentes: presentStudents,
        ausentes: absentStudents,
        tarde: lateStudents,
        observations: observations.value,
        justificacion: attendanceStore.currentAttendanceDoc?.data?.justificacion || []
      }
    };
    
    await attendanceStore.saveAttendanceDocument(attendanceDoc);
    
    toast({
      title: 'Asistencia guardada',
      description: 'Los datos de asistencia han sido guardados correctamente.',
      variant: 'default'
    });
    
    // Reload the attendance data to ensure everything is updated
    await loadAttendanceData(selectedDate.value, selectedClassId.value);
    
  } catch (error) {
    console.error('Error saving attendance:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron guardar los datos de asistencia. Inténtelo de nuevo.',
      variant: 'destructive'
    });
  } finally {
    isLoading.value = false;
  }
}

function clearAttendance() {
  // Reset attendance data to default values
  const data = {};
  students.value.forEach(student => {
    data[student.id] = 'Ausente';
  });
  
  attendanceData.value = data;
  observations.value = '';
}

// Initialize
onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
/* Custom styles for the calendar */
.calendar-container {
  min-height: 280px;
}

/* Responsive improvements for mobile */
@media (max-width: 640px) {
  .attendance-view {
    padding: 1rem;
  }
  
  /* Stack buttons on mobile */
  .attendance-buttons {
    flex-direction: column;
  }
}

/* Smooth transitions for theme changes */
.attendance-view {
  transition: background-color 0.3s ease;
}

.dark .attendance-view,
.dark button,
.dark input,
.dark textarea,
.dark select {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
</style>
