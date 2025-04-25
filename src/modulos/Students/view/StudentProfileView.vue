<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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
  CameraIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  IdentificationIcon,
  BriefcaseIcon,
  MapPinIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'
import { useStudentsStore } from '../store/students'
import { useClassesStore } from '../../Classes/store/classes'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { useTeachersStore } from '../../Teachers/store/teachers'
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
const teachersStore = useTeachersStore()

const studentId = route.params.id as string
const student = computed(() => studentsStore.students.find(s => s.id.toString() === studentId))

// Add the missing classes computed property
const classes = computed(() => {
  // If classesStore has classes array, use it to extract the names
  // Otherwise provide a default set of groups
  return (classesStore.classes && classesStore.classes.length > 0) 
    ? Array.from(new Set(classesStore.classes.map(c => c.name)))
      .filter(name => name && typeof name === 'string')
    : ['Teoría Musical','Coro', 'Orquesta']
})

const attendanceData = computed(() => {
  // Si tenemos datos reales de asistencia, usarlos
  if (studentAttendance.value && studentAttendance.value.chartData) {
    const { labels, presentData, absentData, justifiedData, lateData, attendanceRateData } = studentAttendance.value.chartData;
    
    return {
      labels,
      datasets: [
        {
          label: '% Asistencia',
          data: attendanceRateData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.3,
          type: 'line',
          yAxisID: 'y1',
          order: 0
        },
        {
          label: 'Asistencias',
          data: presentData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Tardanzas',
          data: lateData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Ausencias',
          data: absentData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 3
        },
        {
          label: 'Justificadas',
          data: justifiedData,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 4
        }
      ]
    };
  }
  
  // Si no hay datos reales, usar datos de ejemplo
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const present = [12, 10, 14, 8, 10, 11];
  const absent = [3, 4, 2, 3, 2, 4];
  const justified = [1, 2, 1, 1, 1, 2];
  const late = [2, 1, 2, 3, 2, 1];
  const rate = [80, 75, 85, 70, 80, 75];

  return {
    labels,
    datasets: [
      {
        label: '% Asistencia',
        data: rate,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3,
        type: 'line',
        yAxisID: 'y1',
        order: 0
      },
      {
        label: 'Asistencias',
        data: present,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 1
      },
      {
        label: 'Tardanzas',
        data: late,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2
      },
      {
        label: 'Ausencias',
        data: absent,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 3
      },
      {
        label: 'Justificadas',
        data: justified,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 4
      }
    ]
  };
})

// Obtener y procesar los datos de asistencia del estudiante
const studentAttendance = computed(() => {
  if (!student.value || !studentId) return {
    records: [],
    summary: {
      total: 0,
      present: 0,
      absent: 0,
      justified: 0,
      late: 0,
      attendanceRate: 0
    },
    classification: 'Sin datos',
    monthlyData: {},
    recentRecords: [],
    classPerformance: []
  };
  
  // Obtener los registros de asistencia del estudiante
  const attendanceRecords = attendanceStore.getAttendanceByStudent ? 
    attendanceStore.getAttendanceByStudent(studentId) : 
    attendanceStore.records.filter(record => record.studentId === studentId);
  
  // Si no hay registros, devolvemos un objeto vacío
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      records: [],
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        attendanceRate: 0
      },
      classification: 'Sin datos',
      monthlyData: {},
      recentRecords: [],
      classPerformance: []
    };
  }
  
  // Resumen de asistencias (normalizar estados a minúsculas para consistencia)
  const present = attendanceRecords.filter(record => 
    record.status?.toLowerCase() === 'presente' || 
    record.status?.toLowerCase() === 'present').length;
  
  const absent = attendanceRecords.filter(record => 
    record.status?.toLowerCase() === 'ausente' || 
    record.status?.toLowerCase() === 'absent').length;
  
  const justified = attendanceRecords.filter(record => 
    (record.status?.toLowerCase() === 'ausente' || record.status?.toLowerCase() === 'absent') && 
    record.justification).length;
  
  const late = attendanceRecords.filter(record => 
    record.status?.toLowerCase() === 'tardanza' || 
    record.status?.toLowerCase() === 'tarde' || 
    record.status?.toLowerCase() === 'late').length;
  
  const total = attendanceRecords.length;
  
  // Para el cálculo de tasa de asistencia, consideramos presentes + justificados + tarde como "asistencias"
  const attendedClasses = present + late;
  const attendanceRate = total > 0 ? Math.round((attendedClasses / total) * 100) : 0;
  
  // Clasificación del estudiante según su tasa de asistencia
  let classification = 'Sin datos';
  if (total > 0) {
    if (attendanceRate >= 70) {
      classification = 'Responsable';
    } else if (attendanceRate >= 40) {
      classification = 'Irregular';
    } else {
      classification = 'Crítico';
    }
  }
  
  // Obtener rendimiento por clase
  const classPerformance = [];
  
  // Definir tipo para resumen de clases
  interface ClassSummary {
    classId: string;
    className: string;
    total: number;
    present: number;
    absent: number;
    justified: number;
    late: number;
    rate: number;
  }
  
  const classesSummary: Record<string, ClassSummary> = {};
  
  // Agrupar registros por clase
  attendanceRecords.forEach(record => {
    if (!record.classId) return;
    
    if (!classesSummary[record.classId]) {
      classesSummary[record.classId] = {
        classId: record.classId,
        className: '',
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        rate: 0
      };
    }
    
    // Obtener nombre de la clase
    if (!classesSummary[record.classId].className) {
      const classInfo = classesStore.getClassById ? 
        classesStore.getClassById(record.classId) : 
        classesStore.classes.find(c => c.id === record.classId);
      
      if (classInfo) {
        classesSummary[record.classId].className = classInfo.name || 'Clase sin nombre';
      }
    }
    
    classesSummary[record.classId].total++;
    
    if (record.status?.toLowerCase() === 'presente' || record.status?.toLowerCase() === 'present') {
      classesSummary[record.classId].present++;
    } else if (record.status?.toLowerCase() === 'ausente' || record.status?.toLowerCase() === 'absent') {
      classesSummary[record.classId].absent++;
      if (record.justification) {
        classesSummary[record.classId].justified++;
      }
    } else if (record.status?.toLowerCase() === 'tardanza' || record.status?.toLowerCase() === 'tarde' || record.status?.toLowerCase() === 'late') {
      classesSummary[record.classId].late++;
    }
  });
  
  // Calcular tasa de asistencia para cada clase
  Object.values(classesSummary).forEach(classData => {
    const attended = classData.present + classData.late;
    classData.rate = classData.total > 0 ? Math.round((attended / classData.total) * 100) : 0;
    classPerformance.push(classData);
  });
  
  // Ordenar clases por tasa de asistencia (de menor a mayor para resaltar problemas)
  classPerformance.sort((a, b) => a.rate - b.rate);
  
  // Datos para la gráfica por mes
  const monthlyData = attendanceRecords.reduce((acc, record) => {
    if (!record.Fecha) return acc;
    
    try {
      // Extraer el mes de la fecha
      const date = new Date(record.Fecha);
      const monthYear = format(date, 'MMM yyyy', { locale: es });
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          present: 0,
          absent: 0,
          justified: 0,
          late: 0,
          total: 0
        };
      }
      
      acc[monthYear].total++;
      
      if (record.status?.toLowerCase() === 'presente' || record.status?.toLowerCase() === 'present') {
        acc[monthYear].present++;
      } else if (record.status?.toLowerCase() === 'ausente' || record.status?.toLowerCase() === 'absent') {
        acc[monthYear].absent++;
        if (record.justification) {
          acc[monthYear].justified++;
        }
      } else if (record.status?.toLowerCase() === 'tardanza' || record.status?.toLowerCase() === 'tarde' || record.status?.toLowerCase() === 'late') {
        acc[monthYear].late++;
      }
    } catch (error) {
      console.error('Error al procesar fecha:', record.Fecha, error);
    }
    
    return acc;
  }, {});
  
  // Convertir los datos mensuales para la gráfica
  const months = Object.keys(monthlyData).slice(-6); // Últimos 6 meses
  const presentData = months.map(m => monthlyData[m].present);
  const absentData = months.map(m => monthlyData[m].absent);
  const justifiedData = months.map(m => monthlyData[m].justified);
  const lateData = months.map(m => monthlyData[m].late);
  const attendanceRateData = months.map(m => {
    const attended = monthlyData[m].present + monthlyData[m].late;
    return monthlyData[m].total > 0 ? Math.round((attended / monthlyData[m].total) * 100) : 0;
  });
  
  // Obtener los últimos 10 registros ordenados por fecha
  const recentRecords = [...attendanceRecords]
    .sort((a, b) => {
      if (!a.Fecha || !b.Fecha) return 0;
      return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    })
    .slice(0, 10)
    .map(record => {
      // Enriquecer los datos con información adicional
      const classInfo = classesStore.getClassById ? 
        classesStore.getClassById(record.classId) : 
        classesStore.classes.find(c => c.id === record.classId);
        
      const teacherInfo = classInfo?.teacherId && teachersStore.getTeacherById ? 
        teachersStore.getTeacherById(classInfo.teacherId) : 
        teachersStore.teachers?.find(t => t.id === classInfo?.teacherId);
      
      return {
        ...record,
        className: classInfo?.name || 'Clase desconocida',
        teacherName: teacherInfo?.name || 'Profesor desconocido',
        formattedDate: record.Fecha ? format(new Date(record.Fecha), 'dd/MM/yyyy') : 'Fecha desconocida'
      };
    });
    
  return {
    records: attendanceRecords,
    summary: {
      total,
      present,
      absent,
      justified,
      late,
      attendanceRate
    },
    classification,
    chartData: {
      labels: months,
      presentData,
      absentData,
      justifiedData,
      lateData,
      attendanceRateData
    },
    monthlyData,
    recentRecords,
    classPerformance
  };
});

// Lista reactiva de clases para el estudiante actual
const studentClasses = computed(() => {
  console.log('Student ID:', studentId)
  if (!student.value || !studentId) {
    console.log('No hay estudiante seleccionado o ID de estudiante')
    return []
  }
  
  // Normalizar el ID para asegurar que las comparaciones funcionen
  const normalizedStudentId = String(studentId)
  console.log('ID de estudiante normalizado:', normalizedStudentId)
  
  // Verificar si hay clases cargadas en el store
  console.log('Total de clases en el store:', classesStore.classes.length)
  
  // Usar el getter del classesStore para obtener las clases del estudiante
  const classesForStudent = classesStore.getClassesByStudentId(normalizedStudentId)
  console.log('Clases encontradas para el estudiante:', classesForStudent)  // Devolver información relevante de las clases
  return classesForStudent.map(classItem => {
    // Usar el getter del store para obtener directamente la información del profesor
    const teacherInfo = classItem.teacherId ? teachersStore.getTeacherById(classItem.teacherId) : null;
    const teacherName = teacherInfo ? teacherInfo.name : null;
    
    return {
      id: classItem.id,
      name: classItem.name || 'Clase sin nombre',
      teacher: teacherName || (classItem.teacherId ? `Profesor (ID: ${classItem.teacherId})` : 'Sin profesor asignado'),
      level: classItem.level || 'Nivel no especificado',
      schedule: classItem.schedule && classItem.schedule.slots ? classItem.schedule.slots.map(slot => 
        `${slot.day} ${slot.startTime}-${slot.endTime}`
      ).join(', ') : 'Horario no definido'
    };
  })
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            if (context.dataset.yAxisID === 'y1') {
              label += context.parsed.y + '%';
            } else {
              label += context.parsed.y;
            }
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cantidad de asistencias',
        color: '#6b7280'
      },
      grid: {
        color: 'rgba(160, 174, 192, 0.1)'
      },
      ticks: {
        color: '#6b7280'
      }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      max: 100,
      title: {
        display: true,
        text: 'Porcentaje (%)',
        color: '#3b82f6'
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        color: '#3b82f6',
        callback: function(value) {
          return value + '%';
        }
      }
    },
    x: {
      grid: {
        color: 'rgba(160, 174, 192, 0.1)'
      },
      ticks: {
        color: '#6b7280'
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
}

const isUploading = vueRef(false)

// Reemplazar la función actual por esta
const handleProfilePhotoUpload = async (url) => {
  if (!student.value) return
  
  isUploading.value = true
  try {
    console.log('[StudentProfileView] URL de foto recibida:', url);
    
    // Verificar que sea una URL válida de Firebase Storage
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      console.error('[StudentProfileView] URL inválida:', url);
      throw new Error('La URL de la imagen no es válida');
    }
    
    await studentsStore.updateStudent(studentId, { avatar: url })
    console.log('[StudentProfileView] Avatar actualizado correctamente');
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error)
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
      ...(student.value.documentos || {}),
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
// Define a type for localStudent that matches the student structure
type StudentType = typeof student.value
const localStudent = ref({} as StudentType)

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

// Extract unique classes from all students (using grupos values as classes)
const availableClasses = computed(() => {
  // Create a Set to automatically handle uniqueness
  const classSet = new Set()
  
  // Extract classes from students' grupo property
  studentsStore.students.forEach(student => {
    // Add regular clase values
    if (student.clase && typeof student.clase === 'string' && student.clase.trim() !== '') {
      classSet.add(student.clase.trim())
    }
    
    // Add values from grupo arrays as potential classes
    if (student.grupo) {
      // Handle grupo as array
      if (Array.isArray(student.grupo)) {
        student.grupo.forEach(group => {
          if (group && typeof group === 'string' && group.trim() !== '') {
            classSet.add(group.trim())
          }
        })
      }
      // Handle grupo as string (fallback)
      else if (typeof student.grupo === 'string' && student.grupo?.trim() !== '') {
        classSet.add(student.grupo.trim())
      }
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

// onMounted para cargar los datos necesarios del estudiante
onMounted(async () => {
  // Cargar el id de estudiante desde la ruta
  const studentId = route.params.id as string
  
  // Verificar si tenemos un ID de estudiante válido
  if (studentId) {
    try {
      // Asegurar que los estudiantes estén cargados
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents()
      }
      
      // Asegurar que tenemos el estudiante actual
      if (!student.value) {
        await studentsStore.fetchStudentById(studentId)
      }
      
      // Cargar las clases específicas para este estudiante desde Firestore
      await classesStore.fetchClassesByStudentId(studentId)
      
      // Si tenemos IDs de profesores, cargarlos también
      if (classesStore.classes.length > 0) {
        const teacherIds = new Set<string>()
        
        // Recopilar todos los IDs de profesores de las clases del estudiante
        classesStore.classes
          .filter(c => c.studentIds?.includes(studentId))
          .forEach(c => {
            if (c.teacherId) teacherIds.add(c.teacherId)
          })
        
        // Cargar información de los profesores si no la tenemos ya
        if (teacherIds.size > 0 && teachersStore.teachers.length === 0) {
          await teachersStore.fetchTeachers()
        }
        
        // Primero obtenemos todas las clases del estudiante
        const studentClassIds = classesStore.classes
          .filter(c => c.studentIds?.includes(studentId))
          .map(c => c.id)        // Cargar las asistencias para cada clase
        try {
          // Usar los métodos disponibles en el attendanceStore para cargar asistencias
          await attendanceStore.fetchAttendance()
          
          // Si hay clases específicas del estudiante, cargar sus documentos de asistencia
          if (studentClassIds.length > 0) {
            // Cargar documentos de asistencia para cada clase del estudiante
            for (const classId of studentClassIds) {
              try {
                // Intentar cargar datos por fecha y clase
                // Usamos fechas recientes para tener algún dato (último mes)
                const today = new Date()
                const lastMonth = new Date(today)
                lastMonth.setMonth(today.getMonth() - 1)
                
                const startDate = format(lastMonth, 'yyyy-MM-dd')
                const endDate = format(today, 'yyyy-MM-dd')
                
                // Usar fetchAttendanceByDateRange si está disponible
                if (typeof attendanceStore.fetchAttendanceByDateRange === 'function') {
                  await attendanceStore.fetchAttendanceByDateRange(startDate, endDate)
                }
                
                // También intentar cargar documentos específicos
                if (typeof attendanceStore.fetchAttendanceByClassAndDate === 'function') {
                  await attendanceStore.fetchAttendanceByClassAndDate(classId, format(today, 'yyyy-MM-dd'))
                }
              } catch (err) {
                console.error(`Error al cargar asistencias para la clase ${classId}:`, err)
              }
            }
          }
        } catch (error) {
          console.error('Error al cargar registros de asistencia:', error)
        }
      }
      
    } catch (error) {
      console.error('Error al cargar datos del estudiante:', error)
    }
  } 
  else {
    console.error('ID de estudiante no válido:', studentId)
  }
})
</script>

<style scoped>
/* Animaciones y transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  0% { 
    opacity: 0;
    transform: translateY(20px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.dark .card {
  background-color: #1f2937;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.info-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.info-tag-primary {
  background-color: #dbeafe;
  color: #1e40af;
}

.dark .info-tag-primary {
  background-color: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
}

.info-tag-success {
  background-color: #dcfce7;
  color: #166534;
}

.dark .info-tag-success {
  background-color: rgba(22, 101, 52, 0.3);
  color: #86efac;
}

.info-tag-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.dark .info-tag-warning {
  background-color: rgba(146, 64, 14, 0.3);
  color: #fcd34d;
}

.info-tag-danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.dark .info-tag-danger {
  background-color: rgba(185, 28, 28, 0.3);
  color: #fca5a5;
}

.profile-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.profile-section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2rem;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.profile-section-title:hover::after {
  width: 100%;
}

.profile-avatar {
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  transform: scale(1.05);
  border-color: #8b5cf6;
}

.data-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .data-label {
  color: #9ca3af;
}

.data-value {
  font-weight: 500;
}

/* Estilos para la tarjeta de clase */
.class-card {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
  background: linear-gradient(145deg, #f3f4f6 0%, #eff6ff 100%);
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.dark .class-card {
  border-color: #374151;
  background: linear-gradient(145deg, #1e293b 0%, #1e3a8a 100%);
}

.class-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Animación para mostrar datos cargando */
@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
  background-color: #e5e7eb;
  border-radius: 0.375rem;
}

.dark .loading-pulse {
  background-color: #374151;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.btn-success {
  background-color: #10b981;
  color: white;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background-color: #059669;
  transform: translateY(-2px);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <div v-if="student" class="py-6 animate-fade-in">
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
            @success="handleProfilePhotoUpload" 
            :path="`students/${student.id}/profile`"
            :maxSize="3"  
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
    <div class="card">      <h2 class="profile-section-title">
        <UserIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        Información Personal
      </h2>
      <div class="space-y-3" v-if="!isEditing">
        <div class="animate-slide-up" style="animation-delay: 0.1s;">
          <p class="data-label">Edad</p>
          <p class="data-value flex items-center gap-2">
            <span class="info-tag info-tag-primary">{{ student.edad }} años</span>
          </p>
        </div>
        <div class="animate-slide-up" style="animation-delay: 0.15s;">
          <p class="data-label flex items-center gap-1">
            <CalendarIcon class="w-4 h-4" />
            Fecha de Nacimiento
          </p>
          <p class="data-value">{{ student.nac }}</p>
        </div>
        <div class="animate-slide-up" style="animation-delay: 0.2s;">
          <p class="data-label flex items-center gap-1">
            <IdentificationIcon class="w-4 h-4" />
            Sexo
          </p>
          <p class="data-value">
            <span v-if="student.sexo === 'Masculino'" class="info-tag info-tag-primary">
              {{ student.sexo }}
            </span>
            <span v-else class="info-tag info-tag-warning">
              {{ student.sexo }}
            </span>
          </p>
        </div>
        <div class="pt-3 border-t dark:border-gray-700 animate-slide-up" style="animation-delay: 0.25s;">
          <p class="data-label flex items-center gap-1">
            <UserGroupIcon class="w-4 h-4" />
            Padres
          </p>
          <p class="data-value flex items-center gap-2 mt-1">
            <span class="text-purple-600 dark:text-purple-400">•</span>
            {{ student.madre }} (Madre)
          </p>
          <p class="data-value flex items-center gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            {{ student.padre }} (Padre)
          </p>
        </div>
        <div class="animate-slide-up" style="animation-delay: 0.3s;">
          <p class="data-label">Contacto</p>
          <p class="data-value flex items-center gap-2 mt-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
            <PhoneIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
            {{ student.tlf }}
          </p>
          <p class="data-value flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
            <EnvelopeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
        </div>        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Clases</p>
          <div class="space-y-2 mt-1">
            <div v-if="studentClasses.length === 0" class="text-gray-500 italic">
              No está inscrito en ninguna clase
            </div>            <div 
              v-for="(classItem, index) in studentClasses" 
              :key="classItem.id" 
              class="class-card"
              :style="{'animation-delay': `${index * 0.1}s`}"
            >
              <p class="font-medium flex items-center gap-2">
                <MusicalNoteIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {{ classItem.name }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <UserIcon class="w-4 h-4" /> 
                {{ classItem.teacher }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <AcademicCapIcon class="w-4 h-4" /> 
                {{ classItem.level }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <ClockIcon class="w-4 h-4" />
                {{ classItem.schedule }}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Grupos (Histórico)</p>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-if="student.grupo && student.grupo.length > 0"
              v-for="grupo in student.grupo"
              :key="grupo"
              class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              {{ grupo }}
            </span>
            <span v-else class="text-gray-500 italic">Sin grupos asignados</span>
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
        </div>                <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Clases</label>
          <div class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
            <p>Las clases se gestionan desde el módulo de Clases.</p>
            <p class="mt-1">Para inscribir al estudiante en una nueva clase, por favor:</p>
            <ol class="list-decimal ml-5 mt-1 space-y-1">
              <li>Ve al menú de Clases</li>
              <li>Selecciona o crea una clase</li>
              <li>Agrega este estudiante a la lista de inscritos</li>
            </ol>
          </div>
          <div class="mt-2 space-y-1">
            <p class="font-medium">Clases actuales:</p>
            <ul class="list-disc ml-5">
              <li v-for="classItem in studentClasses" :key="classItem.id">
                {{ classItem.name }} ({{ classItem.teacher }})
              </li>
              <li v-if="studentClasses.length === 0" class="text-gray-500 italic">
                No está inscrito en ninguna clase
              </li>
            </ul>
          </div>
        </div>
        <div>
          <label class="text-sm text-gray-600 dark:text-gray-400">Grupos Históricos</label>
          <select v-model="localStudent.grupo" class="input w-full" multiple>
            <option v-for="group in uniqueGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Estos son grupos históricos para referencia y pueden ser diferentes de las clases actuales.</p>
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
    </div>    <!-- Análisis de Asistencia -->
    <div class="card lg:col-span-2">
      <h2 class="profile-section-title">
        <ChartBarIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        Análisis de Asistencia
      </h2>      <!-- Clasificación del estudiante -->
      <div class="mb-6 bg-gradient-to-r rounded-lg p-4 shadow-sm animate-slide-up"
           :class="{
             'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30': studentAttendance.classification === 'Responsable',
             'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30': studentAttendance.classification === 'Irregular',
             'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30': studentAttendance.classification === 'Crítico',
             'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30': studentAttendance.classification === 'Sin datos'
           }">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-medium mb-1">Estado: {{ studentAttendance.classification }}</h3>
            <p class="text-sm" 
               :class="{
                 'text-green-700 dark:text-green-400': studentAttendance.classification === 'Responsable',
                 'text-yellow-700 dark:text-yellow-400': studentAttendance.classification === 'Irregular',
                 'text-red-700 dark:text-red-400': studentAttendance.classification === 'Crítico',
                 'text-gray-700 dark:text-gray-400': studentAttendance.classification === 'Sin datos'
               }">
              <span v-if="studentAttendance.classification === 'Responsable'">Excelente asistencia. El estudiante asiste regularmente a clases.</span>
              <span v-else-if="studentAttendance.classification === 'Irregular'">Asistencia inconsistente. Es necesario mejorar la regularidad.</span>
              <span v-else-if="studentAttendance.classification === 'Crítico'">Atención requerida. Asistencia muy baja.</span>
              <span v-else>No hay datos suficientes para evaluar al estudiante.</span>
            </p>
          </div>
          <div class="text-4xl font-bold"
              :class="{
                'text-green-600 dark:text-green-400': studentAttendance.classification === 'Responsable',
                'text-yellow-600 dark:text-yellow-400': studentAttendance.classification === 'Irregular',
                'text-red-600 dark:text-red-400': studentAttendance.classification === 'Crítico',
                'text-gray-600 dark:text-gray-400': studentAttendance.classification === 'Sin datos'
              }">
            {{ studentAttendance.summary?.attendanceRate || 0 }}%
          </div>
        </div>
      </div>

      <!-- Panel de estadísticas -->
      <div class="grid grid-cols-5 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 p-4 rounded-lg shadow-sm animate-slide-up" style="animation-delay: 0.1s;">
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <ClockIcon class="w-4 h-4" />
            Clases Totales
          </p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {{ studentAttendance.summary?.total || 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 p-4 rounded-lg shadow-sm animate-slide-up" style="animation-delay: 0.15s;">
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <CheckCircleIcon class="w-4 h-4 text-green-500" />
            Asistencias
          </p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {{ studentAttendance.summary?.present || 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 p-4 rounded-lg shadow-sm animate-slide-up" style="animation-delay: 0.2s;">
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <XCircleIcon class="w-4 h-4 text-red-500" />
            Ausencias
          </p>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {{ studentAttendance.summary?.absent || 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 p-4 rounded-lg shadow-sm animate-slide-up" style="animation-delay: 0.25s;">
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <DocumentTextIcon class="w-4 h-4 text-amber-500" />
            Justificadas
          </p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {{ studentAttendance.summary?.justified || 0 }}
          </p>
        </div>
        
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30 p-4 rounded-lg shadow-sm animate-slide-up" style="animation-delay: 0.3s;">
          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <ClockIcon class="w-4 h-4 text-yellow-500" />
            Tardanzas
          </p>
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {{ studentAttendance.summary?.late || 0 }}
          </p>
        </div>
      </div>

      <!-- Porcentaje de asistencia en círculo -->
      <div class="flex justify-between items-center mb-6">
        <div class="animate-slide-up" style="animation-delay: 0.3s;">
          <div class="relative w-24 h-24">
            <svg class="w-24 h-24" viewBox="0 0 100 100">
              <!-- Círculo de fondo -->
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="10"
              />
              <!-- Círculo de progreso -->
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="studentAttendance.summary?.attendanceRate >= 80 ? '#22c55e' : studentAttendance.summary?.attendanceRate >= 60 ? '#f59e0b' : '#ef4444'"
                stroke-width="10"
                :stroke-dasharray="`${studentAttendance.summary?.attendanceRate || 0}, 100`"
                stroke-dashoffset="25"
                transform="rotate(-90 50 50)"
              />
              <!-- Texto de porcentaje -->
              <text
                x="50"
                y="50"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="18"
                font-weight="bold"
                :fill="studentAttendance.summary?.attendanceRate >= 80 ? '#22c55e' : studentAttendance.summary?.attendanceRate >= 60 ? '#f59e0b' : '#ef4444'"
              >
                {{ studentAttendance.summary?.attendanceRate || 0 }}%
              </text>
            </svg>
          </div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Asistencia</p>
        </div>

        <!-- Gráfico de asistencia -->
        <div class="h-64 w-3/4 animate-slide-up" style="animation-delay: 0.35s;">
          <Line
            :data="attendanceData"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- Historial de asistencias recientes -->
      <div class="animate-slide-up" style="animation-delay: 0.4s;">
        <h3 class="text-base font-medium mb-3 flex items-center gap-2">
          <CalendarIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Asistencias Recientes
        </h3>
        
        <div v-if="studentAttendance.recentRecords && studentAttendance.recentRecords.length > 0">
          <div class="overflow-hidden overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clase</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Justificación</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                <tr v-for="(record, index) in studentAttendance.recentRecords" :key="index" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-gray-200">{{ record.formattedDate }}</td>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-gray-200">{{ record.className }}</td>
                  <td class="px-3 py-2 text-sm">
                    <span v-if="record.status === 'presente'" class="info-tag info-tag-success flex items-center gap-1">
                      <CheckCircleIcon class="w-3 h-3" />
                      Presente
                    </span>
                    <span v-else-if="record.status === 'ausente' && record.justification" class="info-tag info-tag-warning flex items-center gap-1">
                      <DocumentTextIcon class="w-3 h-3" />
                      Justificada
                    </span>
                    <span v-else class="info-tag info-tag-danger flex items-center gap-1">
                      <XCircleIcon class="w-3 h-3" />
                      Ausente
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    <span v-if="record.justification">{{ record.justification }}</span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400 italic">
          No hay registros de asistencia disponibles
        </div>
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