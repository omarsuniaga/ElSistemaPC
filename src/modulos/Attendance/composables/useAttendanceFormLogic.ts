// src/modulos/Attendance/composables/useAttendanceFormLogic.ts
import { format, parseISO } from 'date-fns';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import { es } from 'date-fns/locale';

// External
import { useAuthStore } from '../../../stores/auth';
// Stores
import { useClassesStore } from '../../Classes/store/classes';
import { useStudentsStore } from '../../Students/store/students';
import { useAttendanceStore } from '../store/attendance';

// Composables
import { useAttendanceExportLogic } from './useAttendanceExportLogic';

// Tipos
type AttendanceStatus = 'Pendiente' | 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  status?: AttendanceStatus; // 'Presente', 'Ausente', etc.
  name?: string;
  justification?: string;
  isChanged?: boolean;
}

// Definimos los tipos de estado de asistencia que usa el componente hijo
type AttendanceGridStatus = 'pending' | 'absent' | 'present' | 'late' | 'justified';

interface IAttendanceRecord {
  studentId: string;
  status: AttendanceGridStatus; 
  justification?: string;
}

export function useAttendanceFormLogic() {
  const toast = useToast();
  const route = useRoute();
  const router = useRouter();

  // Stores
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  const attendanceStore = useAttendanceStore();
  const authStore = useAuthStore();

  // Composables
  const { showExportModal, closeExportModal, handleExport, handleExportPDF, handleExportExcel, handleExportHTML, handleShareWhatsApp } = useAttendanceExportLogic();

  // Estado del componente
  const students = ref<Student[]>([]);
  const classInfo = ref<any | null>(null);
  const searchQuery = ref('');
  const classObservations = ref('');
  const hasUnsavedChanges = ref(false);
  const isInitializing = ref(true);
  const loading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const lastSaved = ref<Date | null>(null);
  const showUnsavedWarning = ref(false);
  const showJustificationModal = ref(false);
  const selectedStudentForJustification = ref<any | null>(null);
  const attendanceRecords = ref<IAttendanceRecord[]>([]);

  // Props de la ruta (manejados en onMounted)
  const selectedDate = ref('');
  const selectedClass = ref('');

  // Referencia para el campo de observación (para scroll y focus)
  const observationSection = ref<HTMLElement | null>(null);

  /**
   * COMPUTED PROPERTIES
   */
  const canSave = computed(() => {
    const hasNonPendingStudents = students.value.some(s => s.status !== 'Pendiente');
    const hasObservations = classObservations.value && classObservations.value.trim() !== '';
    return hasNonPendingStudents && hasObservations;
  });

  const displayedStudents = computed(() => {
    if (!searchQuery.value.trim()) {
      return students.value;
    }
    const query = searchQuery.value.toLowerCase().trim();
    return students.value.filter(student => {
      const fullName = `${student.nombre || ''} ${student.apellido || ''}`.toLowerCase();
      if (fullName.includes(query)) return true;
      const fields = [student.id, student.grupo?.toString(), student.email];
      return fields.some(field => field && field.toLowerCase().includes(query));
    });
  });

  const currentClass = computed(() => classInfo.value);

  const attendanceStats = computed(() => {
    if (!students.value || students.value.length === 0) {
      return {
        total: 0,
        presente: 0,
        ausente: 0,
        tardanza: 0,
        justificado: 0,
        pendiente: 0,
        attendanceRate: 0
      };
    }
    const total = students.value.length;
    const presente = students.value.filter(s => s.status === 'Presente').length;
    const ausente = students.value.filter(s => s.status === 'Ausente').length;
    const tardanza = students.value.filter(s => s.status === 'Tardanza').length;
    const justificado = students.value.filter(s => s.status === 'Justificado').length;
    const pendiente = students.value.filter(s => s.status === 'Pendiente').length;
    const attendanceRate = total > 0 ? ((presente + tardanza) / total) * 100 : 0;
    return {
      total,
      presente,
      ausente,
      tardanza,
      justificado,
      pendiente,
      attendanceRate
    };
  });

  const formattedDate = computed(() => {
    if (!selectedDate.value) return '';
    try {
      const [year, month, day] = selectedDate.value.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      if (isNaN(dateObj.getTime())) {
        console.warn('Fecha inválida:', selectedDate.value);
        return selectedDate.value;
      }
      return format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (err) {
      console.error('Error al formatear fecha:', err);
      return selectedDate.value;
    }
  });

  /**
   * FUNCTIONS
   */
  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    const student = students.value.find(s => s.id === studentId);
    if (!student) return;
    student.status = status;
    student.isChanged = true;
    hasUnsavedChanges.value = true;
  };

  const handleAttendanceUpdate = (studentId: string, status: string) => {
    if (!studentId) return;
    const statusMap: Record<string, AttendanceStatus> = {
      'pending': 'Pendiente',
      'present': 'Presente', 
      'absent': 'Ausente',
      'late': 'Tardanza',
      'justified': 'Justificado'
    };
    const gridStatus = status as AttendanceGridStatus;
    const mappedStatus = statusMap[status] || 'Pendiente';
    const index = attendanceRecords.value.findIndex(record => record.studentId === studentId);
    if (index !== -1) {
      attendanceRecords.value[index].status = gridStatus;
    } else {
      attendanceRecords.value.push({
        studentId: studentId,
        status: gridStatus
      });
    }
    const studentIndex = students.value.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
      students.value[studentIndex].status = mappedStatus;
      students.value[studentIndex].isChanged = true;
    }
    hasUnsavedChanges.value = true;
  };

  const handleManualSave = async () => {
    isSaving.value = true;
    error.value = null;
    try {
      const attendanceData = {
        presentes: [],
        ausentes: [],
        tarde: [],
        justificacion: []
      };

      students.value.forEach(student => {
        switch (student.status) {
          case 'Presente':
            attendanceData.presentes.push(student.id);
            break;
          case 'Ausente':
            attendanceData.ausentes.push(student.id);
            break;
          case 'Tardanza':
            attendanceData.tarde.push(student.id);
            break;
          case 'Justificado':
            attendanceData.justificacion.push({
              studentId: student.id,
              reason: student.justification || ''
            });
            break;
        }
      });

      const result = await attendanceStore.saveAttendance({
        date: selectedDate.value,
        classId: selectedClass.value,
        presentes: attendanceData.presentes,
        ausentes: attendanceData.ausentes,
        tarde: attendanceData.tarde,
        justificacion: attendanceData.justificacion,
        observations: classObservations.value
      });

      if (result && result.success) {
        toast.success(`✅ ${result.message}`, {
          position: 'top-right',
          duration: 4000,
          dismissible: true
        });
        console.log(`✅ Asistencia guardada: ${result.studentsCount} estudiantes registrados`);
      } else {
        toast.success('✅ Asistencia guardada correctamente en Firestore', {
          position: 'top-right',
          duration: 4000,
          dismissible: true
        });
        console.log('✅ Asistencia guardada correctamente en Firestore');
      }

      students.value.forEach((s) => (s.isChanged = false));
      hasUnsavedChanges.value = false;
      lastSaved.value = new Date();
      showExportModal.value = true;
    } catch (err: any) {
      error.value = 'Error al guardar la asistencia.';
      console.error('❌ [AttendanceForm] Error en handleManualSave:', err);
    } finally {
      isSaving.value = false;
    }
  };

  const handleSaveButtonPress = (event: MouseEvent) => {
    console.log('[DEBUG] handleSaveButtonPress triggered', { canSave: canSave.value, isSaving: isSaving.value });
    if (!canSave.value || isSaving.value) {
      event.preventDefault();
      nextTick(() => {
        if (observationSection.value) {
          const rect = observationSection.value.getBoundingClientRect();
          if (rect.bottom > window.innerHeight || rect.top < 0) {
            window.scrollTo({
              top: window.scrollY + rect.top - 40,
              behavior: 'smooth',
            });
          } else {
            observationSection.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          // Llamar al método focusTextarea expuesto por el componente hijo
          const classObsInput = observationSection.value.querySelector('.class-observation-input');
          if (classObsInput && classObsInput.__vueParentComponent?.exposed?.focusTextarea) {
            classObsInput.__vueParentComponent.exposed.focusTextarea();
          }
        }
      });
    }
  };

  const handleOpenJustificationModal = (student: Student) => {
    selectedStudentForJustification.value = student;
    showJustificationModal.value = true;
  };

  const handleSaveJustification = ({ reason }: { reason: string }) => {
    if (!selectedStudentForJustification.value) return;
    const student = students.value.find(s => s.id === selectedStudentForJustification.value!.id);
    if (student) {
      student.justification = reason;
      student.status = 'Justificado';
      student.isChanged = true;
      hasUnsavedChanges.value = true;
    }
    showJustificationModal.value = false;
    selectedStudentForJustification.value = null;
  };

  const handleCloseJustificationModal = () => {
    showJustificationModal.value = false;
    selectedStudentForJustification.value = null;
  };

  const handleSearch = (query: string) => {
    searchQuery.value = query;
  };

  const clearSearch = () => {
    searchQuery.value = '';
    // Ahora podemos usar el método focus expuesto por AttendanceToolbar
    // searchInput.value?.focus(); // This needs to be handled in the component that uses this composable
  };

  const markAllPresent = () => {
    students.value.forEach((student) => {
      if (student.status !== 'Presente') {
        updateStudentStatus(student.id, 'Presente');
      }
    });
  };

  const resetAllStatuses = () => {
    students.value.forEach((student) => {
      updateStudentStatus(student.id, 'Ausente');
    });
  };

  const navigateBack = () => {
    router.push({ name: 'ProfessionalCalendarView' });
  };

  const exitWithoutSaving = () => {
    if (hasUnsavedChanges.value) {
      showUnsavedWarning.value = true;
    } else {
      navigateBack();
    }
  };

  const confirmExitWithoutSaving = () => {
    hasUnsavedChanges.value = false;
    showUnsavedWarning.value = false;
    navigateBack();
  };

  const initializeForm = async () => {
    loading.value = true;
    isInitializing.value = true;
    error.value = null;
    
    try {
      // Better parameter validation with fallbacks
      const classId = route.params.classId as string || route.query.classId as string;
      const date = route.params.date as string || route.query.date as string;
      
      console.log('🔍 [AttendanceForm] Route params:', { 
        classId: route.params.classId, 
        date: route.params.date,
        query: route.query 
      });
      
      if (!classId || !date) {
        console.error('❌ [AttendanceForm] Missing parameters:', { classId, date, route: route.path });
        throw new Error(`Parámetros requeridos no encontrados. Clase: ${classId || 'undefined'}, Fecha: ${date || 'undefined'}`);
      }
      
      selectedClass.value = classId;
      selectedDate.value = date;
      
      console.log('📊 [AttendanceForm] Inicializando con classId:', classId, 'fecha:', date);
      
      const classData = await classesStore.getClassById(classId);
      if (!classData) throw new Error(`Clase con ID ${classId} no encontrada`);
      classInfo.value = classData;
      
      await studentsStore.fetchStudents();
      const classStudents = studentsStore.getStudentsByClass(classId);
      
      if (!classStudents || classStudents.length === 0) {
        console.warn('⚠️ [AttendanceForm] No se encontraron estudiantes para esta clase');
      }
      
      console.log('👥 [AttendanceForm] Estudiantes cargados:', classStudents.length);
      
      console.log('🔄 [AttendanceForm] Cargando documento de asistencia para fecha:', date, 'y clase:', classId);
      
      try {
        // Usamos el método getRecordByClassAndDate del stateStore
        const stateStore = attendanceStore.stateStore;
        const record = stateStore.getRecordByClassAndDate(classId, date);
        
        // Si no encontramos el registro localmente, intentamos cargarlo desde Firebase
        if (!record) {
          console.log('📡 [AttendanceForm] No se encontró registro local, buscando en Firebase...');
          await attendanceStore.actionsStore.fetchAttendanceRecords();
          
          // Intentamos nuevamente después de cargar los registros
          const updatedRecord = stateStore.getRecordByClassAndDate(classId, date);
          if (updatedRecord) {
            console.log('✅ [AttendanceForm] Registro encontrado en Firebase');
            attendanceStore.currentAttendanceDoc = { id: updatedRecord.id, data: updatedRecord };
          } else {
            console.log('ℹ️ [AttendanceForm] No se encontró registro de asistencia para esta fecha y clase');
            attendanceStore.currentAttendanceDoc = null;
          }
        } else {
          console.log('📱 [AttendanceForm] Usando registro de asistencia de la caché local');
          attendanceStore.currentAttendanceDoc = { id: record.id, data: record };
        }
      } catch (err) {
        console.error('❌ [AttendanceForm] Error al cargar documento de asistencia:', err);
        toast.error('Error al cargar los datos de asistencia');
        isInitializing.value = false;
        return;
      }
      
      let attendanceDoc = null;
      const currentDoc = attendanceStore.currentAttendanceDoc;
      
      if (!currentDoc) {
        console.log('⚠️ [AttendanceForm] currentAttendanceDoc es null');
        console.log('⚠️ [AttendanceForm] No se encontró documento de asistencia para esta fecha/clase o pertenece a otro profesor');
      } else {
        attendanceDoc = currentDoc;
        console.log('📝 [AttendanceForm] Documento de asistencia cargado:', attendanceDoc);
        if (!attendanceDoc) {
          console.log('⚠️ [AttendanceForm] No se encontró documento de asistencia para esta fecha/clase');
        }
      }
      
      let existingRecords = {};
      
      if (attendanceDoc && attendanceDoc.data) {
        console.log('📊 [AttendanceForm] Datos del documento de asistencia:', JSON.stringify(attendanceDoc.data));
        const allStudentIds = [
          ...(attendanceDoc.data.presentes || []),
          ...(attendanceDoc.data.ausentes || []),
          ...(attendanceDoc.data.tarde || []),
          ...(attendanceDoc.data.justificacion || [])
        ];
        
        console.log('🔍 [AttendanceForm] IDs de estudiantes encontrados:', allStudentIds);
        
        allStudentIds.forEach(studentId => {
          let status = 'Pendiente';
          let justification = '';
          
          console.log(`🔎 [AttendanceForm] Verificando estado del estudiante ${studentId}:`, {
            enPresentes: attendanceDoc.data.presentes?.includes(studentId),
            enAusentes: attendanceDoc.data.ausentes?.includes(studentId),
            enTarde: attendanceDoc.data.tarde?.includes(studentId),
            enJustificados: attendanceDoc.data.justificacion?.includes(studentId)
          });
          
          if (attendanceDoc.data.presentes?.includes(studentId)) {
            status = 'Presente';
          } else if (attendanceDoc.data.ausentes?.includes(studentId)) {
            status = 'Ausente';
          } else if (attendanceDoc.data.tarde?.includes(studentId)) {
            status = 'Tardanza';
          } else if (attendanceDoc.data.justificacion?.includes(studentId)) {
            status = 'Justificado';
          }
          
          console.log(`⏩ [AttendanceForm] Estado asignado para estudiante ${studentId}:`, status);
          
          existingRecords[studentId] = {
            status,
            justification
          };
        });
        
        console.log('📚 [AttendanceForm] Registros de asistencia cargados:', Object.keys(existingRecords).length);
      }
      
      students.value = classStudents.map(student => ({
        ...student,
        id: student.id,
        nombre: student.nombre || '',
        apellido: student.apellido || '',
        name: `${student.nombre || ''} ${student.apellido || ''}`.trim(),
        status: 'Pendiente' as AttendanceStatus,
        isChanged: false,
      }));
      
      if (existingRecords && Object.keys(existingRecords).length > 0) {
        console.log('📊 [AttendanceForm] Aplicando registros existentes a', Object.keys(existingRecords).length, 'estudiantes');
        const studentsWithStringIds = students.value.map(s => ({
          ...s,
          id: String(s.id)
        }));
        students.value = studentsWithStringIds;
        for (const studentId in existingRecords) {
          const student = students.value.find(s => String(s.id) === String(studentId));
          if (student) {
            console.log(`🧩 [AttendanceForm] Aplicando estado '${existingRecords[studentId].status}' al estudiante:`, student.name);
            student.status = existingRecords[studentId].status;
            student.justification = existingRecords[studentId].justification || '';
            student.isChanged = false;
          } else {
            console.warn(`⚠️ [AttendanceForm] No se encontró estudiante con ID: ${studentId}`);
          }
        }
      } else {
        console.log('ℹ️ [AttendanceForm] No hay registros previos de asistencia para esta fecha/clase');
      }
      
      if (attendanceDoc?.data) {
        const observaciones = attendanceDoc.data.observación || attendanceDoc.data.observations;
        if (observaciones) {
          if (Array.isArray(observaciones)) {
            classObservations.value = observaciones.join('\n');
          } else {
            classObservations.value = observaciones;
          }
        } else {
          classObservations.value = '';
        }
      } else {
        classObservations.value = '';
      }
      
      console.log('📖 [AttendanceForm] Observaciones cargadas:', classObservations.value ? 'Sí' : 'No');
      updateAttendanceRecords();
      console.log('✅ [AttendanceForm] Formulario inicializado correctamente');
      
    } catch (err) {
      console.error('❌ [AttendanceForm] Error al inicializar el formulario:', err);
      console.error('❌ [AttendanceForm] Error stack:', err instanceof Error ? err.stack : 'No stack available');
      console.error('❌ [AttendanceForm] Error message:', err instanceof Error ? err.message : String(err));
      error.value = `Error al cargar los datos de asistencia: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      loading.value = false;
      isInitializing.value = false;
    }
  };

  const updateAttendanceRecords = () => {
    attendanceRecords.value = students.value.map(student => ({
      studentId: student.id,
      status: convertToGridStatus(student.status),
      justification: student.justification
    }));
  };

  const convertToGridStatus = (status: AttendanceStatus): AttendanceGridStatus => {
    const statusMap: Record<AttendanceStatus, AttendanceGridStatus> = {
      'Pendiente': 'pending',
      'Presente': 'present',
      'Ausente': 'absent',
      'Tardanza': 'late',
      'Justificado': 'justified'
    };
    return statusMap[status] || 'pending';
  };

  const convertToAttendanceRecords = (students: Student[]): IAttendanceRecord[] => {
    return students.map(student => ({
      studentId: student.id,
      status: convertToGridStatus(student.status || 'Pendiente'),
      justification: student.justification
    }));
  };

  onMounted(() => {
    initializeForm();

    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  });

  window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  return {
    students,
    classInfo,
    searchQuery,
    classObservations,
    hasUnsavedChanges,
    isInitializing,
    loading,
    isSaving,
    error,
    lastSaved,
    showUnsavedWarning,
    showJustificationModal,
    selectedStudentForJustification,
    attendanceRecords,
    selectedDate,
    selectedClass,
    observationSection,
    canSave,
    displayedStudents,
    currentClass,
    attendanceStats,
    formattedDate,
    updateStudentStatus,
    handleAttendanceUpdate,
    handleManualSave,
    handleSaveButtonPress,
    handleOpenJustificationModal,
    handleSaveJustification,
    handleCloseJustificationModal,
    handleSearch,
    clearSearch,
    markAllPresent,
    resetAllStatuses,
    navigateBack,
    exitWithoutSaving,
    confirmExitWithoutSaving,
    initializeForm,
    updateAttendanceRecords,
    convertToGridStatus,
    convertToAttendanceRecords,
    showExportModal,
    closeExportModal,
    handleExport,
    handleExportPDF,
    handleExportExcel,
    handleExportHTML,
    handleShareWhatsApp,
  };
}