<template>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <!-- Filtros y opciones -->
      <div class="flex flex-wrap justify-between items-center mb-6 gap-y-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Historial de Asistencia</h2>
        
        <div class="flex flex-wrap items-center gap-4">
          <!-- Selector de clase -->
          <div class="min-w-[200px]">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Clase</label>
            <select
              v-model="selectedClass"
              @change="handleClassChange"
              class="form-select w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
            >
              <option value="">Todas las clases</option>
              <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
                {{ classItem.name }}
              </option>
            </select>
          </div>
          
          <!-- Selector de vista -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ver por</label>
            <select
              v-model="viewMode"
              @change="changeViewMode"
              class="form-select w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
            >
              <option value="week">Semana</option>
              <option value="biweek">Quincena</option>
              <option value="month">Mes</option>
            </select>
          </div>
          
          <!-- Botón exportar PDF -->
          <button
            @click="exportToPdf"
            class="btn-primary flex items-center gap-2 self-end"
            :disabled="isLoading || students.length === 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>
      
      <!-- Navegación entre fechas -->
      <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 py-2 px-4 rounded-lg mb-4">
        <button
          @click="navigatePrevious"
          class="btn-icon"
          title="Periodo anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div class="font-medium text-gray-700 dark:text-gray-300">
          {{ dateRangeText }}
        </div>
        
        <button
          @click="navigateNext"
          class="btn-icon"
          title="Periodo siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Estados de carga y errores -->
      <div v-if="isLoading" class="flex items-center justify-center my-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando datos...</span>
      </div>
      
      <div v-else-if="error" class="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-4">
        <p>{{ error }}</p>
        <button 
          @click="loadAttendanceData" 
          class="text-sm underline hover:no-underline mt-2"
        >
          Reintentar
        </button>
      </div>
      
      <!-- Tabla de asistencia -->
      <div v-else-if="students.length > 0" class="overflow-x-auto">
        <div id="attendance-table-container" class="relative">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed border-collapse">
            <thead class="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64 sticky left-0 bg-gray-50 dark:bg-gray-800/60 shadow-sm z-10">
                  Estudiante
                </th>
                <template v-for="day in visibleDays" :key="day.getTime()">
                  <th 
                    scope="col" 
                    class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16"
                  >
                    <div>{{ formatDayName(day) }}</div>
                    <div class="font-bold">{{ formatDayNumber(day) }}</div>
                  </th>
                </template>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="student in paginatedStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                  <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mr-3">
                      <img
                        v-if="student.photoURL"
                        :src="student.photoURL"
                        :alt="student.name"
                        class="h-full w-full object-cover"
                      >
                      <div v-else class="h-full w-full flex items-center justify-center bg-blue-500 text-white text-sm">
                        {{ getInitials(student.name) }}
                      </div>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ student.name }}
                      </div>
                      <!-- <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ student.classInfo || 'Sin clase asignada' }}
                      </div> -->
                    </div>
                  </div>
                </td>
                
                <template v-for="day in visibleDays" :key="day.getTime()">
                  <td 
                    class="px-2 py-4 text-center"
                  >
                    <div 
                      class="attendance-cell" 
                      :class="getAttendanceClass(student.id, day)"
                    >
                      {{ getAttendanceStatus(student.id, day) }}
                    </div>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 mt-4">
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Mostrando
                <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                a
                <span class="font-medium">{{ Math.min(currentPage * pageSize, filteredStudents.length) }}</span>
                de
                <span class="font-medium">{{ filteredStudents.length }}</span>
                estudiantes
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="changePage(1)"
                  :disabled="currentPage === 1"
                  :class="{'opacity-50 cursor-not-allowed': currentPage === 1}"
                  class="pagination-btn rounded-l-md"
                >
                  <span class="sr-only">Primera</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <button
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  :class="{'opacity-50 cursor-not-allowed': currentPage === 1}"
                  class="pagination-btn"
                >
                  <span class="sr-only">Anterior</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <template v-for="page in paginationRange" :key="page">
                  <button
                    v-if="page !== '...'"
                    @click="changePage(page)"
                    :class="{'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400': page === currentPage}"
                    class="pagination-number"
                  >
                    {{ page }}
                  </button>
                  <span 
                    v-else
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ...
                  </span>
                </template>
                
                <button
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  :class="{'opacity-50 cursor-not-allowed': currentPage === totalPages}"
                  class="pagination-btn"
                >
                  <span class="sr-only">Siguiente</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <button
                  @click="changePage(totalPages)"
                  :disabled="currentPage === totalPages"
                  :class="{'opacity-50 cursor-not-allowed': currentPage === totalPages}"
                  class="pagination-btn rounded-r-md"
                >
                  <span class="sr-only">Última</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
          
          <!-- Paginación móvil simplificada -->
          <div class="flex items-center justify-between w-full sm:hidden">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="{'opacity-50 cursor-not-allowed': currentPage === 1}"
              class="pagination-btn"
            >
              Anterior
            </button>
            
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="{'opacity-50 cursor-not-allowed': currentPage === totalPages}"
              class="pagination-btn"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      
      <div v-else-if="!isLoading" class="text-center py-10">
        <div class="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">No hay datos para mostrar</h3>
        <p class="mt-1 text-gray-500 dark:text-gray-400">{{ selectedClass ? 'No hay estudiantes en esta clase' : 'Selecciona una clase para ver sus registros de asistencia' }}</p>
      </div>
      
      <!-- Leyenda -->
      <div class="mt-6 flex flex-wrap gap-4 text-xs border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="flex items-center">
          <div class="attendance-cell bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">P</div>
          <span class="ml-1 text-gray-600 dark:text-gray-400">Presente</span>
        </div>
        <div class="flex items-center">
          <div class="attendance-cell bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800">A</div>
          <span class="ml-1 text-gray-600 dark:text-gray-400">Ausente</span>
        </div>
        <div class="flex items-center">
          <div class="attendance-cell bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800">T</div>
          <span class="ml-1 text-gray-600 dark:text-gray-400">Tarde</span>
        </div>
        <div class="flex items-center">
          <div class="attendance-cell bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">J</div>
          <span class="ml-1 text-gray-600 dark:text-gray-400">Justificado</span>
        </div>
        <div class="flex items-center">
          <div class="attendance-cell bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600"></div>
          <span class="ml-1 text-gray-600 dark:text-gray-400">Sin clase</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
// Importación corregida de jsPDF
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface AutoTableOptions {
  startY: number;
  head: string[][];
  body: string[][];
  theme: string;
  styles: {
    fontSize: number;
    cellPadding: number;
  };
  headStyles: {
    fillColor: number[];
    textColor: number;
    fontStyle: string;
  };
  columnStyles: {
    [key: string]: { cellWidth: number };
  };
  didDrawCell: (data: any) => void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
  }
}

interface StoreAttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
  justification?: string | {
    reason?: string;
    documentUrl?: string;
    timestamp?: Date;
  };
  documentUrl?: string;
  timestamp?: string;
  createdAt?: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: AttendanceStatusType;
}

type AttendanceStatusType = 'P' | 'A' | 'T' | 'J' | '';

// Update the AttendanceStatus type to match the store
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED";

// Update type for color arrays
const createColorArray = (r: number, g: number, b: number): [number, number, number] => [r, g, b];

// Fix the mapping between store and component attendance status
const mapStoreStatusToComponent = (status: AttendanceStatus): AttendanceStatusType => {
  switch(status) {
    case "PRESENT": return "P";
    case "ABSENT": return "A";
    case "LATE": return "T";
    case "JUSTIFIED": return "J";
    default: return "";
  }
};

// Fix the setFillColorForCell function being undefined
function setFillColorForCell(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

  // Importar stores
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  const attendanceStore = useAttendanceStore();
  
  // Tipos
  interface Student {
    id: string;
    name: string;
    photoURL?: string;
    classInfo?: string;
    classIds?: string[];
  }
  
  interface Class {
    id: string;
    name: string;
    studentIds?: string[];
  }
  
  interface ClassSchedule {
    studentId: string;
    dayOfWeek: number; // 0 = domingo, 1 = lunes, ... 6 = sábado
    time: string;
  }
  
  // Estado
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const students = ref<Student[]>([]);
  const allStudents = ref<Student[]>([]);
  const classes = ref<Class[]>([]);
  const attendance = ref<AttendanceRecord[]>([]);
  const classSchedules = ref<ClassSchedule[]>([]);
  const currentDate = ref(new Date());
  const viewMode = ref<'week' | 'biweek' | 'month'>('week');
  const selectedClass = ref<string>('');
  
  // Paginación
  const currentPage = ref(1);
  const pageSize = ref(10);
  
  // Filtrar estudiantes por clase seleccionada
  const filteredStudents = computed(() => {
    if (!selectedClass.value) {
      return students.value;
    }
    
    return students.value.filter(student => 
      student.classIds?.includes(selectedClass.value)
    );
  });
  
  // Estudiantes en la página actual
  const paginatedStudents = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredStudents.value.slice(start, end);
  });
  
  // Total de páginas
  const totalPages = computed(() => 
    Math.max(1, Math.ceil(filteredStudents.value.length / pageSize.value))
  );
  
  // Rango para la paginación con ellipsis
  const paginationRange = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const range = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        range.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) {
          range.push(i);
        }
        range.push('...', total);
      } else if (current >= total - 2) {
        range.push(1, '...');
        for (let i = total - 4; i <= total; i++) {
          range.push(i);
        }
      } else {
        range.push(1, '...');
        for (let i = current - 1; i <= current + 1; i++) {
          range.push(i);
        }
        range.push('...', total);
      }
    }
    
    return range;
  });
  
  // Días visibles según el modo de visualización y la fecha actual
  const visibleDays = computed(() => {
    let start: Date;
    let end: Date;
    
    switch (viewMode.value) {
      case 'week':
        start = startOfWeek(currentDate.value, { weekStartsOn: 1 }); // Semana comienza el lunes
        end = endOfWeek(currentDate.value, { weekStartsOn: 1 });
        break;
      case 'biweek':
        start = startOfWeek(currentDate.value, { weekStartsOn: 1 });
        end = addDays(endOfWeek(currentDate.value, { weekStartsOn: 1 }), 7);
        break;
      case 'month':
        start = startOfMonth(currentDate.value);
        end = endOfMonth(currentDate.value);
        break;
      default:
        start = startOfWeek(currentDate.value, { weekStartsOn: 1 });
        end = endOfWeek(currentDate.value, { weekStartsOn: 1 });
    }
    
    return eachDayOfInterval({ start, end });
  });
  
  // Texto para mostrar el rango de fechas actual
  const dateRangeText = computed(() => {
    const firstDay = visibleDays.value[0];
    const lastDay = visibleDays.value[visibleDays.value.length - 1];
    
    const firstMonth = format(firstDay, 'MMMM', { locale: es });
    const lastMonth = format(lastDay, 'MMMM', { locale: es });
    
    if (firstMonth === lastMonth) {
      return `${format(firstDay, 'd', { locale: es })} - ${format(lastDay, 'd', { locale: es })} ${firstMonth}`;
    } else {
      return `${format(firstDay, 'd MMM', { locale: es })} - ${format(lastDay, 'd MMM', { locale: es })}`;
    }
  });
  
  // Formatear nombre de día
  function formatDayName(date: Date): string {
    return format(date, 'EEE', { locale: es });
  }
  
  // Formatear número de día
  function formatDayNumber(date: Date): string {
    return format(date, 'd', { locale: es });
  }
  
  // Obtener iniciales para avatar
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  
  // Obtener estado de asistencia
  function getAttendanceStatus(studentId: string, date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance.value.find(a => 
      a.studentId === studentId && 
      a.date === dateStr
    );
    
    if (!record) {
      const dayOfWeek = date.getDay();
      const hasClass = classSchedules.value.some(s => 
        s.studentId === studentId && 
        s.dayOfWeek === dayOfWeek
      );
      return hasClass ? '-' : '';
    }
    
    return record.status;
  }
  
  // Obtener clase CSS para celda de asistencia
  function getAttendanceClass(studentId: string, date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance.value.find(a => 
      a.studentId === studentId && 
      a.date === dateStr
    );
    
    // Si no hay registro pero ese día de la semana tiene clase programada, muestra gris
    if (!record) {
      const dayOfWeek = date.getDay();
      const hasClass = classSchedules.value.some(s => 
        s.studentId === studentId && 
        s.dayOfWeek === dayOfWeek
      );
      
      return hasClass ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600' : '';
    }
    
    switch (record.status) {
      case 'P':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'A':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'T':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'J':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  }
  
  // Navegar al período anterior
  function navigatePrevious() {
    switch (viewMode.value) {
      case 'week':
        currentDate.value = subWeeks(currentDate.value, 1);
        break;
      case 'biweek':
        currentDate.value = subWeeks(currentDate.value, 2);
        break;
      case 'month':
        currentDate.value = subMonths(currentDate.value, 1);
        break;
    }
    loadAttendanceData();
  }
  
  // Navegar al período siguiente
  function navigateNext() {
    switch (viewMode.value) {
      case 'week':
        currentDate.value = addWeeks(currentDate.value, 1);
        break;
      case 'biweek':
        currentDate.value = addWeeks(currentDate.value, 2);
        break;
      case 'month':
        currentDate.value = addMonths(currentDate.value, 1);
        break;
    }
    loadAttendanceData();
  }
  
  // Cambiar modo de visualización
  function changeViewMode() {
    loadAttendanceData();
  }
  
  // Cambiar clase seleccionada
  function handleClassChange() {
    // Resetear paginación cuando cambia la clase
    currentPage.value = 1;
    loadAttendanceData();
  }
  
  // Cambiar página actual
  function changePage(page: string | number) {
    if (typeof page === 'string') {
      return;
    }
    currentPage.value = page;
  }
  
  // Cargar datos iniciales
  async function loadData() {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Cargar clases, estudiantes y configuraciones desde los stores
      await Promise.all([
        classesStore.fetchClasses(),
        studentsStore.fetchStudents(),
        // Aquí irían más llamadas para cargar datos iniciales
      ]);
      
      // Obtener clases del store
      classes.value = classesStore.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        studentIds: cls.studentIds || []
      }));
      
      // Preparar estudiantes con información de clases
      const allStudentsData = studentsStore.students.map(student => {
        // Encontrar clases a las que pertenece el estudiante
        const studentClasses = classes.value.filter(cls => 
          cls.studentIds?.includes(student.id)
        );
        
        // Agregar información de clase
        return {
          id: student.id,
          name: `${student.nombre || ''} ${student.apellido || ''}`.trim(),
          photoURL: student.photoURL,
          classIds: studentClasses.map(c => c.id),
          classInfo: studentClasses.map(c => c.name).join(', ')
        };
      });
      
      // Guardar todos los estudiantes
      allStudents.value = allStudentsData;
      
      // Aplicar filtro inicial
      if (selectedClass.value) {
        students.value = allStudentsData.filter(student => 
          student.classIds?.includes(selectedClass.value)
        );
      } else {
        students.value = allStudentsData;
      }
      
      // Cargar datos de asistencia
      await loadAttendanceData();
      
    } catch (err: any) {
      console.error("Error al cargar datos iniciales:", err);
      error.value = `Error al cargar datos: ${err.message}`;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Cargar datos de asistencia para el período actual
  async function loadAttendanceData() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Obtener rango de fechas actual
    const startDate = format(visibleDays.value[0], 'yyyy-MM-dd');
    const endDate = format(visibleDays.value[visibleDays.value.length - 1], 'yyyy-MM-dd');
    
    // Filtrar estudiantes por clase seleccionada si es necesario
    if (selectedClass.value) {
      students.value = allStudents.value.filter(student => 
        student.classIds?.includes(selectedClass.value)
      );
    } else {
      students.value = [...allStudents.value];
    }
    
    // Cargar datos de asistencia desde el store
    await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
    
    // Mapear los registros del store al formato que necesitamos
    const attendanceRecords: AttendanceRecord[] = [];
    
    // Utilizar los registros del store de asistencia
    const records = attendanceStore.records;
    
    // Depuración
    console.log('Registros obtenidos:', records.length);
    
    for (const record of records) {
      // Verificar qué campo de fecha está disponible
      const dateField = record.Fecha || (record.date ? (typeof record.date === 'string' ? record.date : format(record.date, 'yyyy-MM-dd')) : null);
      
      if (!dateField || !record.studentId) {
        console.warn('Registro sin fecha o ID de estudiante:', record);
        continue;
      }
      
      // Solo incluir registros para los estudiantes filtrados
      const isStudentInFilteredList = students.value.some(s => s.id === record.studentId);
      if (!isStudentInFilteredList) continue;

      // Solo incluir registros para la clase seleccionada si hay una
      if (selectedClass.value && record.classId && record.classId !== selectedClass.value) continue;
      
      // Asegúrate de que la fecha esté en formato yyyy-MM-dd
      let formattedDate: string;
      try {
        // Si es string, parsearlo a Date y luego formatearlo
        if (typeof dateField === 'string') {
          formattedDate = format(parseISO(dateField), 'yyyy-MM-dd');
        } else {
          // Si es Date, solo formatearlo
          formattedDate = format(dateField, 'yyyy-MM-dd');
        }
      } catch (err) {
        console.warn(`Error al formatear fecha ${dateField}:`, err);
        formattedDate = typeof dateField === 'string' ? dateField : format(new Date(), 'yyyy-MM-dd');
      }
      
      // Mapear el estado correctamente
      let status: AttendanceStatusType;
      
      if (record.status === 'Presente' || record.status === 'PRESENT') {
        status = 'P';
      } else if (record.status === 'Ausente' || record.status === 'ABSENT') {
        status = 'A';
      } else if (record.status === 'Tardanza' || record.status === 'LATE') {
        status = 'T';
      } else if (record.status === 'Justificado' || record.status === 'JUSTIFIED') {
        status = 'J';
      } else {
        // Si hay un valor no reconocido, usar mapeo existente o valor vacío
        status = mapStoreStatusToComponent(record.status as AttendanceStatus) || '';
      }
      
      attendanceRecords.push({
        studentId: record.studentId,
        date: formattedDate,
        status
      });
    }
    
    console.log('Registros procesados:', attendanceRecords.length);
    
    // Actualizar el estado local con los registros obtenidos
    attendance.value = attendanceRecords;
    
    // Cargar horarios de clase para mostrar las celdas grises
    await loadClassSchedules();
    
  } catch (err: any) {
    error.value = `Error al cargar los datos de asistencia: ${err.message}`;
    console.error("Error cargando datos de asistencia:", err);
  } finally {
    isLoading.value = false;
  }
}

// Cargar horarios de clase
async function loadClassSchedules() {
  // Limpiar horarios anteriores
  classSchedules.value = [];
  
  try {
    // Para cada estudiante, obtener sus horarios de clase
    for (const student of students.value) {
      // Obtener las clases a las que pertenece el estudiante
      const studentClassIds = student.classIds || [];
      
      // Si hay una clase seleccionada, filtrar solo por esa
      const classesToProcess = selectedClass.value 
        ? studentClassIds.filter(id => id === selectedClass.value)
        : studentClassIds;
      
      // Para cada clase del estudiante
      for (const classId of classesToProcess) {
        // Buscar la clase en el store
        const classData = classesStore.getClassById(classId);
        if (!classData || !classData.schedule || !classData.schedule.slots) continue;
        
        // Procesar los slots de horario de la clase
        for (const slot of classData.schedule.slots) {
          // Convertir día de semana de texto a número (0 = domingo, 1 = lunes, etc.)
          const days = {
            'lunes': 1,
            'martes': 2,
            'miércoles': 3, 
            'jueves': 4,
            'viernes': 5,
            'sábado': 6,
            'domingo': 0
          };
          
          const dayOfWeek = days[slot.day.toLowerCase() as keyof typeof days];
          
          // Agregar el horario de clase
          classSchedules.value.push({
            studentId: student.id,
            dayOfWeek,
            time: slot.startTime
          });
        }
      }
    }
  } catch (error) {
    console.error('Error al cargar horarios de clase:', error);
  }
}

 // Exportar a PDF
async function exportToPdf() {
  if (students.value.length === 0) return;
  
  try {
    // Crear documento PDF con la importación corregida
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Título del documento
    doc.setFontSize(16);
    doc.text('Historial de Asistencia', 14, 15);
    
    // Período de fechas
    doc.setFontSize(10);
    doc.text(`Período: ${dateRangeText.value}`, 14, 22);
    
    // Clase seleccionada
    if (selectedClass.value) {
      const className = classes.value.find(c => c.id === selectedClass.value)?.name || '';
      doc.text(`Clase: ${className}`, 14, 28);
    }
    
    // Fecha de generación
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);
    
    // Preparar datos para la tabla
    const tableHeaders = ['Estudiante', ...visibleDays.value.map(day => format(day, 'EEE d', { locale: es }))];
    
    const tableBody = students.value.map(student => {
      const row = [student.name];
      
      visibleDays.value.forEach(day => {
        const status = getAttendanceStatus(student.id, day);
        row.push(status || '-');
      });
      
      return row;
    });
    
    // Generar tabla con autoTable
    doc.autoTable({
      startY: 40,
      head: [tableHeaders],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 } // Ancho para la columna de nombres
      },
      // Update didDrawCell function to handle color arrays properly
      didDrawCell: (data: any) => {
        // Colorear celdas según estado
        if (data.section === 'body' && data.column.index > 0) {
          const status = data.cell.text[0];
          let fillColor: [number, number, number] | undefined;
          
          switch (status) {
            case 'P':
              fillColor = [200, 250, 200];
              break;
            case 'A':
              fillColor = [250, 200, 200];
              break;
            case 'T':
              fillColor = [230, 200, 250];
              break;
            case 'J':
              fillColor = [200, 220, 250];
              break;
          }
          
          if (fillColor && status !== '-') {
            setFillColorForCell(doc, fillColor);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(0);
            doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
              align: 'center', 
              baseline: 'middle'
            });
          }
        }
      }
    });
    
    // Agregar leyenda
    const legendY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(8);
    doc.text('Leyenda:', 14, legendY);
    
    const legends = [
      { text: 'P: Presente', color: createColorArray(200, 250, 200) },
      { text: 'A: Ausente', color: createColorArray(250, 200, 200) },
      { text: 'T: Tarde', color: createColorArray(230, 200, 250) },
      { text: 'J: Justificado', color: createColorArray(200, 220, 250) },
      { text: '-: Sin clase', color: createColorArray(240, 240, 240) }
    ];
    
    legends.forEach((item, index) => {
      const x = 14 + (index * 30);
      const y = legendY + 6;
      
      // Dibujar rectángulo de color
      doc.setFillColor(...item.color);
      doc.rect(x, y - 4, 5, 5, 'F');
      
      // Texto
      doc.text(item.text, x + 7, y);
    });
    
    // Nombre del archivo
    const fileName = `asistencia_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    // Guardar archivo
    doc.save(fileName);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el PDF. Por favor, intente de nuevo.');
  }
}

// Cargar datos iniciales cuando el componente se monta
onMounted(() => {
  loadData();
});

// Vigilar cambios en la clase seleccionada
watch(selectedClass, () => {
  handleClassChange();
});
</script>
  
  <style scoped>
/* Remove @apply and use the full class names directly in the template */
.attendance-cell {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border-width: 1px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: auto;
  margin-right: auto;
}

.form-select {
  border-radius: 0.375rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  padding-left: 0.75rem;
  padding-right: 2rem;
  font-size: 0.875rem;
}

.form-select:focus {
  border-color: rgb(59, 130, 246);
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background-color: rgb(37, 99, 235);
  color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition-property: background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.btn-primary:hover {
  background-color: rgb(29, 78, 216);
}

.btn-icon {
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: rgb(107, 114, 128);
  transition-property: background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.dark .btn-icon {
  color: rgb(156, 163, 175);
}

.btn-icon:hover {
  background-color: rgb(243, 244, 246);
}

.dark .btn-icon:hover {
  background-color: rgb(75, 85, 99);
}

.pagination-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem;
  border-width: 1px;
  border-color: rgb(209, 213, 219);
  background-color: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(107, 114, 128);
}

.dark .pagination-btn {
  border-color: rgb(75, 85, 99);
  background-color: rgb(31, 41, 55);
  color: rgb(156, 163, 175);
}

.pagination-number {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-width: 1px;
  border-color: rgb(209, 213, 219);
  background-color: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55, 65, 81);
}

.dark .pagination-number {
  border-color: rgb(75, 85, 99);
  background-color: rgb(31, 41, 55);
  color: rgb(209, 213, 219);
}

.pagination-number:hover {
  background-color: rgb(243, 244, 246);
}

.dark .pagination-number:hover {
  background-color: rgb(55, 65, 81);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .attendance-cell {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>