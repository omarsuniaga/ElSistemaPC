<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow p-4 md:p-6 max-w-full w-full mx-auto transition-colors duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Asistencia</h2>
      <div class="flex flex-wrap gap-2 items-center">
        <select v-model="selectedClass" @change="handleClassChange" class="min-w-[120px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400">
          <option value="">Todas</option>
          <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">{{ classItem.name }}</option>
        </select>
        <select v-model="viewMode" @change="changeViewMode" class="min-w-[90px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400">
          <option value="week">Semana</option>
          <option value="biweek">Quincena</option>
          <option value="month">Mes</option>
        </select>
        <button @click="exportToPdf" :disabled="isLoading || students.length === 0" class="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span class="hidden sm:inline">PDF</span>
        </button>
      </div>
    </div>

    <!-- Date navigation -->
    <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1 mb-2">
      <button @click="navigatePrevious" class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Anterior">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
      </button>
      <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">{{ dateRangeText }}</span>
      <button @click="navigateNext" class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Siguiente">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
      </button>
    </div>

    <!-- Table -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded p-2 text-xs flex items-center gap-2">
      <span>{{ error }}</span>
      <button @click="loadAttendanceData" class="ml-auto underline text-blue-600 dark:text-blue-400">Reintentar</button>
    </div>
    <div v-else-if="students.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
      <span>No hay datos para mostrar</span>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-xs border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th class="sticky left-0 z-10 bg-white dark:bg-gray-900 px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-l-lg">Estudiante</th>
            <th v-for="day in visibleDays" :key="day.getTime()" class="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDayName(day) }}<br><span class="font-bold">{{ formatDayNumber(day) }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in sortedStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td class="sticky left-0 z-10 bg-white dark:bg-gray-900 px-2 py-2 flex items-center gap-2 rounded-l-lg">
              <div class="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                <span>{{ getInitials(student.name) }}</span>
              </div>
              <span class="truncate max-w-[100px]">{{ student.name }}</span>
            </td>
            <td v-for="day in visibleDays" :key="day.getTime()" class="px-2 py-2 text-center">
              <span :class="getAttendanceClass(student.id, day) + ' rounded-full px-2 py-1 min-w-[1.5rem] inline-block font-semibold'">
                {{ getAttendanceStatus(student.id, day) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-1 mt-3">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50">&lt;</button>
        <span class="text-xs text-gray-500 dark:text-gray-400">Página {{ currentPage }} de {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50">&gt;</button>
      </div>
    </div>
    <!-- Legend -->
    <div class="flex flex-wrap gap-3 mt-4 text-xs justify-center">
      <div class="flex items-center gap-1"><span class="inline-block w-4 h-4 rounded-full bg-green-200 dark:bg-green-800"></span>Presente</div>
      <div class="flex items-center gap-1"><span class="inline-block w-4 h-4 rounded-full bg-red-200 dark:bg-red-800"></span>Ausente</div>
      <div class="flex items-center gap-1"><span class="inline-block w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800"></span>Tarde</div>
      <div class="flex items-center gap-1"><span class="inline-block w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800"></span>Justificado</div>
      <div class="flex items-center gap-1"><span class="inline-block w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></span>Sin clase</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { es } from 'date-fns/locale';
import { ref, computed, onMounted, watch } from 'vue';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths, parseISO, isValid } from 'date-fns';

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
    fillColor: number[][];
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
        return 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'A':
        return 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'T':
        return 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'J':
        return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
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
  
  async function loadAttendanceData() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Get the current date range
    const startDate = format(visibleDays.value[0], 'yyyy-MM-dd');
    const endDate = format(visibleDays.value[visibleDays.value.length - 1], 'yyyy-MM-dd');
    
    // Filter students by selected class if needed
    if (selectedClass.value) {
      students.value = allStudents.value.filter(student => 
        student.classIds?.includes(selectedClass.value)
      );
    } else {
      students.value = [...allStudents.value];
    }
    
    // Load attendance data from the store
    await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
    
    // Map the records from the store to the format we need
    const attendanceRecords: AttendanceRecord[] = [];
    
    // Get records from the store
    const records = attendanceStore.records;
    
    // Debug information
    console.log('Registros obtenidos:', records.length);
    
    for (const record of records) {
      // Skip records without a date or student ID
      if (!record.Fecha || !record.studentId) {
        continue;
      }
      
      // Only include records for the filtered students
      const isStudentInFilteredList = students.value.some(s => s.id === record.studentId);
      if (!isStudentInFilteredList) continue;

      // Only include records for the selected class if one is selected
      if (selectedClass.value && record.classId !== selectedClass.value) continue;
      
      // Convert attendance status to display format
      let status: AttendanceStatusType;
      
      switch (record.status) {
        case 'Presente': 
          status = 'P'; 
          break;
        case 'Ausente': 
          status = 'A'; 
          break;
        case 'Tardanza': 
          status = 'T'; 
          break;
        case 'Justificado': 
          status = 'J'; 
          break;
        default:
          status = '';
      }
      
      attendanceRecords.push({
        studentId: record.studentId,
        date: record.Fecha,
        status
      });
    }
    
    console.log('Registros procesados:', attendanceRecords.length);
    
    // Update the local state with the processed records
    attendance.value = attendanceRecords;
    
    // Load class schedules to show the gray cells
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

// Agrupar estudiantes por prioridad de asistencia: P > T > J > A > resto
const attendancePriority = { P: 1, T: 2, J: 3, A: 4, '': 5 };

const sortedStudents = computed(() => {
  // Para cada estudiante, buscamos su primer estado de asistencia en el rango visible
  return paginatedStudents.value.slice().sort((a, b) => {
    // Buscar el primer estado relevante en el rango visible
    const getFirstStatus = (student: any) => {
      for (const day of visibleDays.value) {
        const status = getAttendanceStatus(student.id, day);
        if (status && status !== '-') return status;
      }
      return '';
    };
    const statusA = getFirstStatus(a);
    const statusB = getFirstStatus(b);
    return attendancePriority[statusA] - attendancePriority[statusB];
  });
});
</script>

<style scoped>
/* Minimal custom styles, rely on Tailwind */
</style>