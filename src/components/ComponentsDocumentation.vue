<template>
  <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
      Documentación de Componentes - El Sistema PC
    </h2>
    
    <div class="prose dark:prose-invert max-w-none">
      <h3 class="text-primary-600 dark:text-primary-400">1. TodayClassesPanel.vue</h3>
      <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
        <h4>Descripción Funcional</h4>
        <p>
          El componente TodayClassesPanel muestra un resumen de las clases programadas para el día actual, 
          proporcionando una vista rápida para maestros y administradores.
        </p>
        
        <h4>Estructura Recomendada</h4>
        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
/**
 * TodayClassesPanel.vue
 * ===========================================
 * Componente que muestra las clases programadas para hoy
 * 
 * Responsabilidades:
 * - Suscribirse a las clases de la fecha actual en tiempo real
 * - Filtrar por status activo y fechas correspondientes
 * - Mostrar información relevante como hora, nombre, maestro
 * - Permitir navegación a la vista detallada de cada clase
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useClassesStore } from '@/stores/classes';
import { useTeachersStore } from '@/stores/teachers';
import { ClockIcon, UserCircleIcon, MapPinIcon } from '@heroicons/vue/24/outline';

// Componente para mostrar clases del día actual con actualización en tiempo real
export default {
  name: 'TodayClassesPanel',
  
  props: {
    // Permite filtrar por maestro específico (opcional)
    teacherId: {
      type: String,
      default: null
    },
    
    // Número máximo de clases a mostrar
    limit: {
      type: Number,
      default: 5
    }
  },
  
  setup(props) {
    // Estado local
    const classes = ref([]);
    const isLoading = ref(true);
    const error = ref(null);
    const unsubscribe = ref(null);
    
    // Stores y router
    const classesStore = useClassesStore();
    const teachersStore = useTeachersStore();
    const router = useRouter();
    
    /**
     * Genera timestamps para inicio y fin del día actual
     * para realizar consultas precisas por fecha
     */
    const getTodayTimestamps = () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      return {
        start: Timestamp.fromDate(startOfDay),
        end: Timestamp.fromDate(endOfDay)
      };
    };
    
    /**
     * Inicia la suscripción para actualización en tiempo real
     * de las clases programadas para hoy
     */
    const subscribeToTodayClasses = () => {
      try {
        isLoading.value = true;
        const { start, end } = getTodayTimestamps();
        
        // Construir la consulta base
        const classesRef = collection(db, 'classes');
        let constraints = [
          where('date', '>=', start),
          where('date', '<=', end),
          where('status', '==', 'active')
        ];
        
        // Añadir filtro por profesor si se especificó
        if (props.teacherId) {
          constraints.push(where('teacherId', '==', props.teacherId));
        }
        
        const q = query(classesRef, ...constraints);
        
        // Iniciar escucha en tiempo real
        unsubscribe.value = onSnapshot(q, (snapshot) => {
          // Mapear los documentos a objetos más fáciles de usar
          const todayClasses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir Timestamp a Date para más fácil manipulación
            date: doc.data().date.toDate()
          }));
          
          // Ordenar por hora de inicio
          todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          // Aplicar límite si se especificó
          classes.value = todayClasses.slice(0, props.limit);
          isLoading.value = false;
          
        }, (err) => {
          console.error('Error al obtener clases:', err);
          error.value = 'Error al cargar las clases del día';
          isLoading.value = false;
        });
        
      } catch (err) {
        console.error('Error en suscripción:', err);
        error.value = 'Error al configurar suscripción de clases';
        isLoading.value = false;
      }
    };
    
    /**
     * Navega a la vista detallada de una clase
     */
    const navigateToClass = (classId) => {
      router.push(`/classes/${classId}`);
    };
    
    // Ciclo de vida
    onMounted(() => {
      subscribeToTodayClasses();
    });
    
    onUnmounted(() => {
      // Importante: cancelar suscripción para evitar memory leaks
      if (unsubscribe.value) {
        unsubscribe.value();
      }
    });
    
    return {
      classes,
      isLoading,
      error,
      navigateToClass
    };
  }
}
        </pre>
        
        <h4>Integración con Firestore</h4>
        <ul class="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Colección:</strong> 'classes' - Almacena información de todas las clases programadas</li>
          <li><strong>Consulta en tiempo real:</strong> Utilizando onSnapshot para mantener la UI actualizada</li>
          <li><strong>Filtros recomendados:</strong> 
            <ul class="list-disc pl-5 mt-1">
              <li>Fecha: Entre inicio y fin del día actual</li>
              <li>Estado: Activo ('status' == 'active')</li>
              <li>Opcional: Por maestro específico ('teacherId' == [ID])</li>
            </ul>
          </li>
        </ul>
        
        <h4>Recomendaciones para extensiones futuras</h4>
        <ol class="list-decimal pl-5 space-y-1 mt-2">
          <li>Implementar paginación para permitir ver más clases con un botón "Ver más"</li>
          <li>Añadir filtros dinámicos por ubicación o tipo de clase</li>
          <li>Incorporar gestión de estado de asistencia directamente desde este panel</li>
          <li>Añadir detección de conflictos de horarios para alertar al usuario</li>
          <li>Implementar caché local con Firestore persistente para funcionamiento offline</li>
        </ol>
        
        <h4>Estructura de datos relacionada</h4>
        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
// Estructura recomendada para documento en colección 'classes'
{
  id: "clase123", // ID autogenerado por Firestore
  name: "Violín - Nivel Intermedio",
  date: Timestamp, // Fecha de la clase
  startTime: "14:00", // Formato 24h para facilitar ordenamiento
  endTime: "15:30",
  teacherId: "maestro456",
  roomId: "aula789",
  status: "active", // active, cancelled, completed
  type: "individual", // individual, grupal
  studentIds: ["alumno123", "alumno456"], // Array de IDs de estudiantes
  attendanceTracked: false, // Indica si ya se registró asistencia
  instrumentId: "violin001",
  notes: "Traer partituras del concierto",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
        </pre>
      </div>
      
      <h3 class="text-primary-600 dark:text-primary-400">2. AdminHomeView.vue</h3>
      <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
        <h4>Descripción Funcional</h4>
        <p>
          AdminHomeView es la vista principal para administradores y directores. Proporciona un dashboard
          con métricas clave, acceso rápido a las funciones principales y una visión general del estado
          actual de la academia de música.
        </p>
        
        <h4>Estructura Recomendada</h4>
        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
/**
 * AdminHomeView.vue
 * ===========================================
 * Vista principal del dashboard para administradores
 * 
 * Responsabilidades:
 * - Mostrar KPIs y métricas importantes
 * - Proporcionar acceso rápido a las funciones principales
 * - Visualizar estadísticas de asistencia y actividad
 * - Identificar estudiantes en riesgo o situaciones que requieren atención
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useTeachersStore } from '@/stores/teachers';
import { useStudentsStore } from '@/modulos/Students/store/students';
import { useClassesStore } from '@/stores/classes';
import { useAuthStore } from '@/stores/auth';
import DashboardHeader from '@/components/DashboardHeader.vue';
import TodayClassesPanel from '@/components/TodayClassesPanel.vue';
import StatsCard from '@/components/StatsCard.vue';
import PerformanceKpi from '@/components/PerformanceKpi.vue';
import AccessRequests from '@/components/AccessRequests.vue';

export default {
  name: 'AdminHomeView',
  
  components: {
    DashboardHeader,
    TodayClassesPanel,
    StatsCard,
    PerformanceKpi,
    AccessRequests
  },
  
  setup() {
    // Estado local
    const isLoading = ref({
      students: true,
      teachers: true,
      attendance: true,
      classes: true
    });
    const error = ref(null);
    const stats = ref({
      totalStudents: 0,
      activeStudents: 0,
      totalTeachers: 0,
      activeTeachers: 0,
      todayAttendance: {
        present: 0,
        absent: 0,
        excused: 0,
        notTracked: 0
      },
      weeklyClasses: 0
    });
    const subscriptions = ref([]);
    
    // Stores
    const teachersStore = useTeachersStore();
    const studentsStore = useStudentsStore();
    const classesStore = useClassesStore();
    const authStore = useAuthStore();
    
    /**
     * Inicializa todas las suscripciones en tiempo real
     * necesarias para el dashboard
     */
    const initSubscriptions = () => {
      // 1. Suscripción a estadísticas de estudiantes
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(studentsRef);
      
      const studentsSub = onSnapshot(studentsQuery, (snapshot) => {
        stats.value.totalStudents = snapshot.size;
        stats.value.activeStudents = snapshot.docs.filter(
          doc => doc.data().status === 'active'
        ).length;
        isLoading.value.students = false;
      }, handleError);
      
      subscriptions.value.push(studentsSub);
      
      // 2. Suscripción a estadísticas de profesores
      const teachersRef = collection(db, 'teachers');
      const teachersQuery = query(teachersRef);
      
      const teachersSub = onSnapshot(teachersQuery, (snapshot) => {
        stats.value.totalTeachers = snapshot.size;
        stats.value.activeTeachers = snapshot.docs.filter(
          doc => doc.data().status === 'active'
        ).length;
        isLoading.value.teachers = false;
      }, handleError);
      
      subscriptions.value.push(teachersSub);
      
      // 3. Suscripción a asistencia del día actual
      const { start, end } = getTodayTimestamps();
      const attendanceRef = collection(db, 'attendance');
      const attendanceQuery = query(
        attendanceRef,
        where('date', '>=', start),
        where('date', '<=', end)
      );
      
      const attendanceSub = onSnapshot(attendanceQuery, (snapshot) => {
        let present = 0;
        let absent = 0;
        let excused = 0;
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'present') present++;
          else if (data.status === 'absent') absent++;
          else if (data.status === 'excused') excused++;
        });
        
        stats.value.todayAttendance = {
          present,
          absent,
          excused,
          total: present + absent + excused
        };
        
        isLoading.value.attendance = false;
      }, handleError);
      
      subscriptions.value.push(attendanceSub);
      
      // 4. Clases de la semana actual
      const weekStart = getWeekTimestamps().start;
      const weekEnd = getWeekTimestamps().end;
      const classesRef = collection(db, 'classes');
      const weeklyClassesQuery = query(
        classesRef,
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd),
        where('status', '==', 'active')
      );
      
      const classesSub = onSnapshot(weeklyClassesQuery, (snapshot) => {
        stats.value.weeklyClasses = snapshot.size;
        isLoading.value.classes = false;
      }, handleError);
      
      subscriptions.value.push(classesSub);
    };
    
    /**
     * Maneja errores en las suscripciones
     */
    const handleError = (err) => {
      console.error('Error en suscripción de dashboard:', err);
      error.value = 'Error al cargar estadísticas';
    };
    
    /**
     * Genera timestamps para inicio y fin del día actual
     */
    const getTodayTimestamps = () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      return {
        start: Timestamp.fromDate(startOfDay),
        end: Timestamp.fromDate(endOfDay)
      };
    };
    
    /**
     * Genera timestamps para inicio y fin de la semana actual
     */
    const getWeekTimestamps = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes...
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajuste para que lunes sea inicio de semana
      
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return {
        start: Timestamp.fromDate(startOfWeek),
        end: Timestamp.fromDate(endOfWeek)
      };
    };
    
    // Ciclo de vida
    onMounted(() => {
      initSubscriptions();
    });
    
    onUnmounted(() => {
      // Limpiar todas las suscripciones
      subscriptions.value.forEach(unsub => unsub());
      subscriptions.value = [];
    });
    
    // Datos computados
    const isAllDataLoaded = computed(() => {
      return !Object.values(isLoading.value).some(value => value === true);
    });
    
    const attendanceRate = computed(() => {
      const { present, absent, excused } = stats.value.todayAttendance;
      const total = present + absent + excused;
      
      if (total === 0) return 0;
      return Math.round((present / total) * 100);
    });
    
    return {
      stats,
      isLoading,
      error,
      isAllDataLoaded,
      attendanceRate,
      // Exponer usuario para mostrar mensaje de bienvenida personalizado
      currentUser: authStore.currentUser
    };
  }
}
        </pre>
        
        <h4>Integración con Firestore</h4>
        <ul class="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Colecciones utilizadas:</strong>
            <ul class="list-disc pl-5 mt-1">
              <li>'students' - Para estadísticas de estudiantes</li>
              <li>'teachers' - Para estadísticas de personal docente</li>
              <li>'attendance' - Para métricas de asistencia</li>
              <li>'classes' - Para programación de clases</li>
            </ul>
          </li>
          <li><strong>Queries en tiempo real:</strong> Utilizando múltiples onSnapshot para diferentes métricas</li>
          <li><strong>Gestión de suscripciones:</strong> Array central para almacenar y limpiar todas las suscripciones</li>
        </ul>
        
        <h4>Recomendaciones para extensiones futuras</h4>
        <ol class="list-decimal pl-5 space-y-1 mt-2">
          <li>Implementar sistema de notificaciones para alertas importantes</li>
          <li>Añadir gráficos interactivos para visualizar tendencias de asistencia</li>
          <li>Crear vistas personalizables donde el administrador pueda elegir qué métricas mostrar</li>
          <li>Incorporar sistema de detección temprana de estudiantes en riesgo de abandono</li>
          <li>Añadir informes programados que se generen automáticamente</li>
          <li>Implementar permisos granulares para diferentes tipos de administradores</li>
        </ol>
        
        <h4>Estructura de datos relacionada</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h5 class="font-semibold mb-2">Colección: 'students'</h5>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs">
{
  id: "student123",
  firstName: "Elena",
  lastName: "García",
  email: "elena@ejemplo.com",
  phone: "+34600000000",
  status: "active", // active, inactive, suspended
  enrollmentDate: Timestamp,
  instrumentId: "violin001",
  teacherId: "teacher456",
  level: "intermediate",
  attendance: {
    present: 24,
    absent: 3,
    excused: 1,
    rate: 0.86  // Tasa calculada
  },
  lastAttendance: Timestamp,
  parentInfo: {
    motherName: "Ana García",
    motherPhone: "+34600000001",
    fatherName: "Pedro López",
    fatherPhone: "+34600000002"
  },
  notes: "",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
            </pre>
          </div>
          <div>
            <h5 class="font-semibold mb-2">Colección: 'attendance'</h5>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs">
{
  id: "att789",
  classId: "class123",
  studentId: "student123",
  teacherId: "teacher456",
  date: Timestamp,
  status: "present", // present, absent, excused
  justification: "",
  notes: "",
  updatedBy: "admin001",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
            </pre>
          </div>
          <div>
            <h5 class="font-semibold mb-2">Colección: 'teachers'</h5>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs">
{
  id: "teacher456",
  firstName: "Carlos",
  lastName: "Martínez",
  email: "carlos@ejemplo.com",
  phone: "+34600000003",
  status: "active", // active, inactive, onLeave
  specialties: ["violin", "cello"],
  instruments: ["violin001", "cello002"],
  schedule: {
    monday: ["09:00-12:00", "15:00-18:00"],
    tuesday: ["09:00-14:00"],
    // ...otros días
  },
  classCount: 12,
  studentCount: 8,
  biography: "Graduado del Conservatorio...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
            </pre>
          </div>
          <div>
            <h5 class="font-semibold mb-2">Colección: 'classes'</h5>
            <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs">
{
  id: "class123",
  name: "Violín - Nivel Intermedio",
  date: Timestamp,
  startTime: "14:00",
  endTime: "15:30",
  teacherId: "teacher456",
  roomId: "room789",
  status: "active", // active, cancelled, completed
  type: "individual", // individual, group
  studentIds: ["student123"],
  attendanceTracked: true,
  instrumentId: "violin001",
  notes: "",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
            </pre>
          </div>
        </div>
      </div>
      
      <h3 class="text-primary-600 dark:text-primary-400">Recomendaciones Generales</h3>
      <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <ol class="list-decimal pl-5 space-y-2">
          <li>
            <strong>Organización del código:</strong> Mantener una estructura consistente separando hooks de 
            Firestore en composables reutilizables.
          </li>
          <li>
            <strong>Gestión de suscripciones:</strong> Siempre crear un sistema centralizado para manejar 
            todas las suscripciones y limpiarlas en onUnmounted.
          </li>
          <li>
            <strong>Manejo de errores:</strong> Implementar try/catch en todas las operaciones de Firestore
            y mostrar mensajes de error apropiados al usuario.
          </li>
          <li>
            <strong>Estado de carga:</strong> Utilizar variables de estado isLoading granulares para cada 
            tipo de datos que se está cargando.
          </li>
          <li>
            <strong>Cálculos derivados:</strong> Preferir computed properties para valores derivados de 
            los datos principales.
          </li>
          <li>
            <strong>Optimización de consultas:</strong> Crear índices adecuados en Firestore para consultas complejas 
            y limitar resultados cuando sea posible.
          </li>
          <li>
            <strong>Caché local:</strong> Configurar persistencia de Firestore para mejorar la experiencia offline.
          </li>
          <li>
            <strong>Documentación:</strong> Incluir comentarios JSDoc en todas las funciones principales para 
            facilitar el mantenimiento.
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
// Este componente es solo una guía de documentación y no necesita lógica específica
</script>

<style scoped>
.prose pre {
  font-size: 0.9em;
  line-height: 1.5;
}
</style>