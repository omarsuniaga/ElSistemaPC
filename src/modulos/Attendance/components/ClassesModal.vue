<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '../store/attendance';
import { useOptimizedAttendance } from '../composables/useOptimizedAttendance';
import { useAuthStore } from '../../../stores/auth';

// Define props and emits
const props = defineProps<{
  isOpen: boolean;
  date: string;
  classes: {
    id: string;
    name: string;
    teacher?: string;
    teacherId?: string; // ID del profesor principal
    teachers?: { // Array de profesores para clases compartidas
      teacherId: string;
      role: string;
      permissions?: {
        canTakeAttendance?: boolean;
        canEditClass?: boolean;
        canViewReports?: boolean;
      };
    }[];
    time?: string;
    students?: number;
    hasAttendance?: boolean;
    classroom?: string;
    studentIds?: string[];
    isLoadingAttendance?: boolean;
    attendanceStatus?: boolean;
    // Nuevas propiedades para clasificar tipos de clases
    classType?: string;
    isScheduledClass?: boolean;
    hasAttendanceRecord?: boolean;
    attendanceRecord?: any;
    teacherPermissions?: {
      canTakeAttendance?: boolean;
    };
    // Propiedades agregadas desde TeacherHome para clases compartidas
    isSharedWithMe?: boolean;
    userRole?: string;
    schedule: {
      slots: {
        id: string;
        startTime: string;
        endTime: string;
      }[];
    };
  }[];
}>();

const emit = defineEmits(['close', 'select-class']);

const router = useRouter();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const { checkAttendanceExists } = useOptimizedAttendance();

// Estado para los indicadores de asistencia
const attendanceStatus = ref<Record<string, boolean>>({});
const attendanceStatusLoading = ref<Record<string, boolean>>({});

// Computed property for development mode
const isDevelopment = computed(() => import.meta.env?.DEV || false);

// Function to check if attendance exists for a class on a specific date (async version)
const hasAttendanceRecord = async (classId: string, date: string): Promise<boolean> => {
  try {
    // console.log('[ClassesModal] ===== CHECKING ATTENDANCE RECORD =====');
    // console.log('[ClassesModal] Input:', { classId, date });
    // console.log('[ClassesModal] Available attendance documents:');
    
    
    // First check the attendance store cache
    const record = attendanceStore.attendanceDocuments.find(
      doc => doc.classId === classId && doc.fecha === date
    );
    
    if (record) {
      // console.log('[ClassesModal] ✅ Found record in store cache:', record.id);
      return true;
    }

    // console.log('[ClassesModal] ❌ No record found in store cache');

    // If not in cache, use optimized query to check Firestore
    // console.log('[ClassesModal] Checking Firestore...');
    const exists = await checkAttendanceExists(classId, date);
    // console.log('[ClassesModal] Firestore query result:', exists);

    return exists;
  } catch (error) {
    console.error('[ClassesModal] Error checking attendance record:', error);
    return false;
  }
};

// Function to check attendance status for a specific class
const checkAttendanceStatus = async (classId: string, date: string) => {
  const key = `${classId}|${date}`;
  // console.log('[ClassesModal] Starting attendance check for:', { classId, date, key });
  attendanceStatusLoading.value[key] = true;
  
  try {
    const hasRecord = await hasAttendanceRecord(classId, date);
    // console.log('[ClassesModal] Attendance check result:', { classId, date, hasRecord });
    attendanceStatus.value[key] = hasRecord;
  } catch (error) {
    console.error('[ClassesModal] Error checking attendance status:', error);
    attendanceStatus.value[key] = false;
  } finally {
    attendanceStatusLoading.value[key] = false;
    //   console.log('[ClassesModal] Attendance status set:', { key, status: attendanceStatus.value[key] });
  }
};

// Function for manual debug
const debugAttendance = async () => {
  console.log('=== MANUAL DEBUG ATTENDANCE (ClassesModal) ===');
  console.log('Current date:', props.date);
  console.log('Current user:', authStore.user?.uid);
  console.log('Attendance store documents:', attendanceStore.attendanceDocuments);
  console.log('Classes:', props.classes);
  
  // Manually test each class
  for (const classItem of props.classes) {
    console.log(`\n--- Testing class: ${classItem.name} (${classItem.id}) ---`);
    console.log('Teachers array:', classItem.teachers);
    console.log('Primary teacherId:', classItem.teacherId);
    console.log('Class type:', classItem.classType);
    
    const hasRecord = await hasAttendanceRecord(classItem.id, props.date);
    console.log(`Attendance result for ${classItem.name}: ${hasRecord}`);
    
    // Test shared class logic
    const currentUserId = authStore.user?.uid;
    const hasTeachersArray = classItem.teachers && Array.isArray(classItem.teachers) && classItem.teachers.length > 0;
    const isPrimaryTeacher = classItem.teacherId === currentUserId;
    const userTeacher = hasTeachersArray && classItem.teachers ? classItem.teachers.find(t => t.teacherId === currentUserId) : null;
    
    console.log('Shared class analysis:', {
      hasTeachersArray,
      isPrimaryTeacher,
      userTeacher,
      isUserInTeachersArray: !!userTeacher,
      wouldBeSharedClass: hasTeachersArray && classItem.teachers && (classItem.teachers.length > 1 || !isPrimaryTeacher),
      isSharedWithCurrentUser: hasTeachersArray && classItem.teachers && classItem.teachers.some(t => t.teacherId === currentUserId),
      currentUserRole: userTeacher?.role || 'none',
      studentCount: classItem.studentIds?.length || classItem.students || 0,
      isLargeClass: (classItem.studentIds?.length || classItem.students || 0) >= 90,
      classType: classItem.classType,
      isSharedWithMe: classItem.isSharedWithMe
    });
    
    // Verificar específicamente si es la clase con 95+ estudiantes como asistente
    const studentCount = classItem.studentIds?.length || classItem.students || 0;
    if (studentCount >= 90 && userTeacher && !isPrimaryTeacher) {
      console.log(`🎯🎯🎯 CLASE OBJETIVO ENCONTRADA: ${classItem.name}`, {
        studentCount,
        myRole: userTeacher.role,
        permissions: userTeacher.permissions,
        shouldAppearInModal: true
      });
    }
  }
};

// Function for debug específico para clases con 95+ estudiantes
const debugLargeClasses = () => {
  console.log('🎯 === DEBUG ESPECÍFICO: CLASES CON 95+ ESTUDIANTES ===');
  console.log('Current date:', props.date);
  console.log('Current user:', authStore.user?.uid);
  console.log('Total classes received:', props.classes.length);
  
  const currentUserId = authStore.user?.uid;
  let largeClassesFound = 0;
  let assistantClassesFound = 0;
  
  props.classes.forEach((classItem, index) => {
    const studentCount = classItem.studentIds?.length || classItem.students || 0;
    const isLargeClass = studentCount >= 90;
    
    if (isLargeClass) {
      largeClassesFound++;
      console.log(`\n🎓 CLASE GRANDE #${largeClassesFound}: ${classItem.name}`);
      console.log(`  📊 Estudiantes: ${studentCount}`);
      console.log(`  👑 Profesor principal: ${classItem.teacherId}`);
      console.log(`  👥 Teachers array:`, classItem.teachers);
      console.log(`  🏷️  Class type: ${classItem.classType}`);
      console.log(`  🤝 isSharedWithMe: ${classItem.isSharedWithMe}`);
      
      // Verificar si el usuario actual está en teachers
      const userInTeachers = classItem.teachers?.find(t => t.teacherId === currentUserId);
      if (userInTeachers) {
        assistantClassesFound++;
        console.log(`  ✅ USUARIO ENCONTRADO EN TEACHERS:`, {
          role: userInTeachers.role,
          permissions: userInTeachers.permissions,
          isPrimaryTeacher: classItem.teacherId === currentUserId
        });
        
        if (classItem.teacherId !== currentUserId) {
          console.log(`  🎯 ESTA ES UNA CLASE COMPARTIDA DONDE SOY ASISTENTE`);
          console.log(`  ⚡ DEBE APARECER EN EL MODAL PARA REGISTRAR ASISTENCIA`);
        }
      } else {
        console.log(`  ❌ Usuario NO encontrado en teachers array`);
      }
    }
  });
  
  console.log(`\n📈 RESUMEN:`);
  console.log(`🎓 Clases con 90+ estudiantes encontradas: ${largeClassesFound}`);
  console.log(`🤝 De esas, soy asistente en: ${assistantClassesFound}`);
  
  if (assistantClassesFound === 0) {
    console.log(`❌ PROBLEMA: No se encontraron clases grandes donde seas asistente`);
    console.log(`💡 Posibles causas:`);
    console.log(`   - La clase no está siendo enviada desde TeacherHome.vue`);
    console.log(`   - El filtrado por día no está funcionando`);
    console.log(`   - El teachers array no está configurado correctamente`);
  } else {
    console.log(`✅ Clases objetivo encontradas. Verificar si aparecen en el modal.`);
  }
  
  return { largeClassesFound, assistantClassesFound };
};

// Computed property for classes with attendance status
const classesWithAttendanceStatus = computed(() => {
  if (!props.classes || !props.date) return [];
  
  const currentUserId = authStore.user?.uid;
  
  // Las clases ya vienen filtradas por el componente padre (AttendanceView.vue o TeacherHome.vue)
  console.log(`[ClassesModal] Procesando ${props.classes.length} clases para la fecha ${props.date}`);
  console.log(`[ClassesModal] Usuario actual: ${currentUserId}`);
  
  // Log detallado de cada clase recibida
  props.classes.forEach((classItem, index) => {
    console.log(`[ClassesModal] Clase ${index + 1}: ${classItem.name}`, {
      id: classItem.id,
      teacherId: classItem.teacherId,
      teachers: classItem.teachers,
      classType: classItem.classType,
      hasTeachersArray: !!(classItem.teachers && Array.isArray(classItem.teachers) && classItem.teachers.length > 0)
    });
  });
  
  return props.classes.map(classItem => {
    const key = `${classItem.id}|${props.date}`;
    const isLoading = attendanceStatusLoading.value[key];
    const hasAttendance = attendanceStatus.value[key];
    
    // Verificar si es una clase compartida y el rol del usuario actual
    const hasTeachersArray = classItem.teachers && Array.isArray(classItem.teachers) && classItem.teachers.length > 0;
    const isPrimaryTeacher = classItem.teacherId === currentUserId;
    
    // Buscar al usuario actual en el array de teachers
    let userTeacherInfo = null;
    let userRole = null;
    let userPermissions = null;
    let isSharedClass = false;
    let isCollaboratingTeacher = false;
    
    // PASO 1: Verificar si el usuario está en el array de teachers
    if (hasTeachersArray && currentUserId && classItem.teachers) {
      userTeacherInfo = classItem.teachers.find(teacher => teacher.teacherId === currentUserId);
      if (userTeacherInfo) {
        isCollaboratingTeacher = true;
        userRole = userTeacherInfo.role || 'assistant';
        userPermissions = userTeacherInfo.permissions;
        console.log(`[ClassesModal] ✅ Usuario encontrado en teachers array de ${classItem.name}:`, {
          role: userRole,
          permissions: userPermissions,
          isPrimaryTeacher
        });
      }
    }
    
    // PASO 2: Determinar si es una clase compartida basándose en múltiples criterios
    if (hasTeachersArray && classItem.teachers) {
      // Es una clase compartida si hay un array de teachers configurado
      isSharedClass = classItem.teachers.length > 0;
      console.log(`[ClassesModal] 🔍 Clase ${classItem.name} tiene teachers array con ${classItem.teachers.length} miembros`);
    }
    
    // PASO 3: También considerar clases compartidas por el classType existente
    if (classItem.classType === 'shared') {
      isSharedClass = true;
      console.log(`[ClassesModal] 📋 Clase ${classItem.name} marcada como 'shared' por classType`);
    }
    
    // PASO 4: CRÍTICO - Si el usuario está en teachers pero NO es el profesor principal, 
    // definitivamente es una clase compartida CON ÉL
    if (hasTeachersArray && currentUserId && classItem.teachers && !isPrimaryTeacher) {
      const userInTeachers = classItem.teachers.find(teacher => teacher.teacherId === currentUserId);
      if (userInTeachers) {
        console.log(`[ClassesModal] 🎯 CLASE COMPARTIDA DETECTADA: ${classItem.name}`, {
          userInTeachers: true,
          isPrimaryTeacher,
          userRole: userInTeachers.role,
          classType: classItem.classType
        });
        isSharedClass = true;
        isCollaboratingTeacher = true;
        userTeacherInfo = userInTeachers;
        userRole = userInTeachers.role || 'assistant';
        userPermissions = userInTeachers.permissions;
      }
    }
    
    // PASO 5: Verificar si es clase compartida desde TeacherHome.vue
    if (classItem.isSharedWithMe === true) {
      console.log(`[ClassesModal] 📨 Clase marcada como isSharedWithMe: ${classItem.name}`);
      isSharedClass = true;
      if (!isCollaboratingTeacher && classItem.userRole) {
        isCollaboratingTeacher = true;
        userRole = classItem.userRole;
        userPermissions = classItem.teacherPermissions;
      }
    }
    
    // PASO 6: Determinar el tipo de participación del usuario de forma más robusta
    let participationType = 'none';
    
    if (isPrimaryTeacher && isSharedClass) {
      participationType = 'primary-shared';
      console.log(`[ClassesModal] 👑 ${classItem.name}: Usuario es profesor principal de clase compartida`);
    } else if (isPrimaryTeacher && !isSharedClass) {
      participationType = 'primary-solo';
      console.log(`[ClassesModal] 🎓 ${classItem.name}: Usuario es profesor principal único`);
    } else if (isCollaboratingTeacher) {
      // El usuario está en el array teachers - fue invitado a colaborar
      participationType = 'collaborator';
      console.log(`[ClassesModal] 🤝 ${classItem.name}: Usuario es colaborador (${userRole})`);
    } else if (isSharedClass && hasTeachersArray) {
      // Si es una clase compartida pero el usuario no está en el array,
      // podría ser que tenga acceso por otras razones
      participationType = 'viewer';
      console.log(`[ClassesModal] 👁️ ${classItem.name}: Usuario tiene acceso como viewer`);
    }
    
    // PASO 7: VERIFICACIÓN FINAL CRÍTICA - Asegurar que las clases compartidas se detecten
    if (hasTeachersArray && currentUserId && classItem.teachers && !isPrimaryTeacher) {
      const isInvitedCollaborator = classItem.teachers.some(teacher => teacher.teacherId === currentUserId);
      if (isInvitedCollaborator) {
        console.log(`[ClassesModal] 🚨 FORZAR INCLUSIÓN: ${classItem.name} - Usuario definitivamente está invitado`);
        participationType = 'collaborator';
        isCollaboratingTeacher = true;
        isSharedClass = true;
        
        // Si no tenemos la info del usuario, buscarla de nuevo
        if (!userTeacherInfo) {
          userTeacherInfo = classItem.teachers.find(teacher => teacher.teacherId === currentUserId);
          if (userTeacherInfo) {
            userRole = userTeacherInfo.role || 'assistant';
            userPermissions = userTeacherInfo.permissions;
          }
        }
      }
    }
    
    // PASO 8: Verificación adicional para clases marcadas desde TeacherHome
    if (classItem.classType === 'shared' && classItem.isSharedWithMe === true) {
      console.log(`[ClassesModal] 📬 CLASE COMPARTIDA CONFIRMADA desde TeacherHome: ${classItem.name}`);
      participationType = 'collaborator';
      isSharedClass = true;
      isCollaboratingTeacher = true;
    }
    
    console.log(`[ClassesModal] 📊 RESULTADO FINAL - Clase: ${classItem.name}`, {
      id: classItem.id,
      hasTeachersArray,
      teachersCount: classItem.teachers?.length || 0,
      isPrimaryTeacher,
      isCollaboratingTeacher,
      isSharedClass,
      participationType,
      userRole,
      canTakeAttendance: userPermissions?.canTakeAttendance !== false || isPrimaryTeacher,
      userPermissions,
      teachersArray: classItem.teachers,
      currentUserId,
      classType: classItem.classType,
      originalClassType: classItem.classType,
      studentCount: classItem.studentIds?.length || classItem.students || 0,
      // Información específica sobre si la clase fue compartida con el usuario
      isSharedWithMe: isCollaboratingTeacher && !isPrimaryTeacher,
      primaryTeacherId: classItem.teacherId,
      amIInvited: hasTeachersArray && classItem.teachers && classItem.teachers.some(t => t.teacherId === currentUserId),
      // Verificaciones de debug críticas
      SHOULD_BE_INCLUDED: participationType !== 'none',
      IS_ASSISTANT_CLASS: isCollaboratingTeacher && !isPrimaryTeacher,
      HAS_95_STUDENTS: (classItem.studentIds?.length || classItem.students || 0) >= 90
    });
    
    return {
      ...classItem,
      // Use the async status check results
      hasAttendance: hasAttendance === true,
      isLoadingAttendance: isLoading === true,
      attendanceStatus: hasAttendance,
      // Nuevas propiedades para manejo de clases compartidas
      isSharedClass,
      isPrimaryTeacher,
      isCollaboratingTeacher,
      participationType,
      userRole,
      userPermissions: userPermissions || classItem.teacherPermissions,
      userTeacherInfo,
      // Mantener compatibilidad con la lógica existente
      classType: isSharedClass ? 'shared' : (classItem.classType || 'regular'),
      // Propiedades adicionales para mejor control
      canTakeAttendance: userPermissions?.canTakeAttendance !== false || isPrimaryTeacher,
      hasTeachersArray,
      // Nueva propiedad para identificar clases compartidas conmigo
      isSharedWithMe: isCollaboratingTeacher && !isPrimaryTeacher,
      originalTeacherId: classItem.teacherId
    };
  }).map((classItem, index, arr) => {
    // Log del resultado final en el último elemento
    if (index === arr.length - 1) {
      console.log(`[ClassesModal] ===== RESULTADO FINAL =====`);
      console.log(`[ClassesModal] Total clases procesadas: ${arr.length}`);
      
      const sharedWithMe = arr.filter(cls => cls.isSharedWithMe);
      const myPrimaryClasses = arr.filter(cls => cls.isPrimaryTeacher);
      const mySharedClasses = arr.filter(cls => cls.isPrimaryTeacher && cls.isSharedClass);
      
      console.log(`[ClassesModal] 📊 Resumen:`);
      console.log(`[ClassesModal] - Mis clases principales: ${myPrimaryClasses.length}`);
      console.log(`[ClassesModal] - Mis clases compartidas (soy principal): ${mySharedClasses.length}`);
      console.log(`[ClassesModal] - Clases compartidas conmigo: ${sharedWithMe.length}`);
      
      if (sharedWithMe.length > 0) {
        console.log(`[ClassesModal] 📩 Clases compartidas conmigo:`);
        sharedWithMe.forEach(cls => {
          console.log(`[ClassesModal]   - ${cls.name} (by: ${cls.teacher || cls.originalTeacherId})`);
        });
      }
      
      arr.forEach(cls => {
        console.log(`[ClassesModal] - ${cls.name}: participationType=${cls.participationType}, isSharedClass=${cls.isSharedClass}, classType=${cls.classType}`);
      });
    }
    return classItem;
  });
});

// Computed property for scheduled classes (programadas)
const scheduledClasses = computed(() => {
  const filtered = classesWithAttendanceStatus.value.filter(classItem => {
    // Incluir clases si:
    // 1. Son clases programadas regulares (no son clases extra/recuperación)
    // 2. Son clases compartidas (independientemente del tipo)
    // 3. El usuario tiene algún tipo de participación en la clase (incluyendo 'viewer')
    // 4. CRÍTICO: Si es una clase donde el usuario es asistente, SIEMPRE incluir
    
    const isScheduled = classItem.isScheduledClass !== false && classItem.classType !== 'recorded';
    const isShared = classItem.isSharedClass || classItem.classType === 'shared';
    const hasParticipation = classItem.participationType !== 'none';
    
    // VERIFICACIÓN ESPECIAL: Si es una clase compartida con el usuario como asistente
    const isSharedWithMeAsAssistant = classItem.isSharedWithMe && 
                                     classItem.participationType === 'collaborator' &&
                                     !classItem.isPrimaryTeacher;
    
    // VERIFICACIÓN ADICIONAL: Si tiene 95 estudiantes y es compartida, definitivamente incluir
    const isLargeSharedClass = (classItem.studentIds?.length || classItem.students || 0) >= 90 && 
                              (isShared || classItem.isSharedWithMe);
    
    // Decidir si incluir la clase
    const shouldInclude = (isScheduled || isShared || isSharedWithMeAsAssistant || isLargeSharedClass) && hasParticipation;
    
    // Debug log para ver qué está pasando con el filtrado
    console.log(`[ClassesModal] 🔍 Filtrado de clase ${classItem.name}:`, {
      isScheduled,
      isShared,
      hasParticipation,
      isSharedWithMeAsAssistant,
      isLargeSharedClass,
      participationType: classItem.participationType,
      classType: classItem.classType,
      isSharedClass: classItem.isSharedClass,
      studentCount: classItem.studentIds?.length || classItem.students || 0,
      willBeIncluded: shouldInclude,
      reasons: {
        isScheduledOK: isScheduled,
        isSharedOK: isShared,
        hasParticipationOK: hasParticipation,
        isAssistantClassOK: isSharedWithMeAsAssistant,
        isLargeClassOK: isLargeSharedClass
      }
    });
    
    return shouldInclude;
  });
  
  console.log(`[ClassesModal] ===== CLASES PROGRAMADAS FILTRADAS =====`);
  console.log(`[ClassesModal] Total clases programadas: ${filtered.length}`);
  
  // Log detallado de cada clase
  filtered.forEach(cls => {
    const studentCount = cls.studentIds?.length || cls.students || 0;
    const isLargeClass = studentCount >= 90;
    console.log(`[ClassesModal] ✅ ${cls.name}: ${cls.participationType} (shared: ${cls.isSharedClass}, students: ${studentCount}${isLargeClass ? ' 🎯' : ''})`);
  });
  
  // Verificar específicamente clases grandes como asistente
  const largeAssistantClasses = filtered.filter(cls => {
    const studentCount = cls.studentIds?.length || cls.students || 0;
    return studentCount >= 90 && cls.participationType === 'collaborator' && cls.isSharedWithMe;
  });
  
  if (largeAssistantClasses.length > 0) {
    console.log(`[ClassesModal] 🎯🎯🎯 CLASE(S) OBJETIVO ENCONTRADA(S): ${largeAssistantClasses.length}`);
    largeAssistantClasses.forEach(cls => {
      console.log(`[ClassesModal] 📚 ${cls.name} - ${cls.studentIds?.length || cls.students || 0} estudiantes - LISTA PARA ASISTENCIA`);
    });
  } else {
    console.log(`[ClassesModal] ❌ NO se encontraron clases grandes (90+ estudiantes) donde seas asistente`);
  }
  
  return filtered;
});

// Computed property for extra/recovery classes (clases extra/recuperación)
const extraClasses = computed(() => {
  return classesWithAttendanceStatus.value.filter(classItem => 
    classItem.isScheduledClass === false || classItem.classType === 'recorded'
  );
});

// Watch for changes in props and trigger attendance checks
watch([() => props.classes, () => props.date, () => props.isOpen], async ([newClasses, newDate, isOpen]) => {
  if (!isOpen || !newClasses?.length || !newDate) return;
  
  console.log('[ClassesModal] ===== STARTING ATTENDANCE CHECK =====');
  console.log('[ClassesModal] Date:', newDate);
  console.log('[ClassesModal] Classes:');
  newClasses.forEach((c, index) => {
    console.log(`[ClassesModal] Class ${index}:`, {
      id: c.id,
      name: c.name
    });
  });
  
  try {
    // Load attendance documents if not already loaded
    if (!attendanceStore.attendanceDocuments.length) {
      console.log('[ClassesModal] Loading attendance documents...');
      await attendanceStore.fetchAttendanceDocuments();
      console.log('[ClassesModal] Loaded attendance documents:', attendanceStore.attendanceDocuments.length);
    }
    
    // Reset status
    attendanceStatus.value = {};
    attendanceStatusLoading.value = {};
    
    // Check attendance for all classes in parallel
    console.log('[ClassesModal] Starting parallel attendance checks...');
    const statusChecks = newClasses.map(async (classItem) => {
      console.log(`[ClassesModal] Checking attendance for class: ${classItem.name} (${classItem.id})`);
      await checkAttendanceStatus(classItem.id, newDate);
    });
    
    await Promise.all(statusChecks);
    console.log('[ClassesModal] ===== FINAL ATTENDANCE STATUS =====');
    console.log('[ClassesModal] Final attendance status:', attendanceStatus.value);
  } catch (error) {
    console.error('[ClassesModal] Error during attendance check:', error);
  }
}, { immediate: true });

// Format the date to display it nicely
const formattedDate = ref('');

watch(() => props.date, (newDate) => {
  if (newDate) {
    const dateObj = new Date(newDate);
    // Format: "Lunes, 24 de junio de 2024"
    formattedDate.value = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    // Capitalize first letter
    formattedDate.value = formattedDate.value.charAt(0).toUpperCase() + formattedDate.value.slice(1);
  }
}, { immediate: true });

// Format time to better display format (12h format)
const formatTime = (timeStr: string): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  
  return format(date, 'h:mm a', { locale: es });
};

// Handle class selection
const handleSelectClass = (classId: string) => {
  emit('select-class', classId);
};

// Navigate to create attendance for a specific class
const navigateToAttendance = (classId: string) => {
  emit('select-class', classId);
  emit('close');
};

// Make sure the component is exported as default
defineExpose({});
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {};
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all">
      <!-- Modal header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Clases del día {{ formattedDate }}
        </h3>
        <button 
          @click="emit('close')" 
          class="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Modal body -->
      <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
        <div v-if="classesWithAttendanceStatus.length === 0" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">No hay clases programadas para este día.</p>
        </div>
        <div v-else class="space-y-4">
          <!-- Sección de clases programadas -->
          <div v-if="scheduledClasses.length > 0">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Clases Programadas y Compartidas ({{ scheduledClasses.length }})
            </h4>
            <div class="space-y-3 mb-6">
              <div 
                v-for="classItem in scheduledClasses" 
                :key="classItem.id" 
                class="relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                @click="navigateToAttendance(classItem.id)"
              >
                <!-- Status Indicator -->
                <div class="absolute top-3 right-3 flex flex-col items-end space-y-1">
                  <!-- Indicador de clase compartida mejorada -->
                  <span 
                    v-if="classItem.isSharedClass"
                    :class="[
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      classItem.participationType === 'primary-shared' 
                        ? 'bg-indigo-500 text-white' 
                        : classItem.participationType === 'collaborator' && classItem.isSharedWithMe
                        ? 'bg-green-500 text-white'
                        : classItem.participationType === 'collaborator'
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-400 text-white'
                    ]">
                    {{ 
                      classItem.participationType === 'primary-shared' ? 'Principal' :
                      classItem.participationType === 'collaborator' && classItem.isSharedWithMe ? 'Compartida' :
                      classItem.participationType === 'collaborator' ? 'Colaborador' :
                      classItem.participationType === 'viewer' ? 'Acceso' :
                      'Compartida'
                    }}
                  </span>
                  
                  <!-- Estado de asistencia -->
                  <span 
                    v-if="classItem.isLoadingAttendance"
                    class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-300 text-gray-600 animate-pulse">
                    ...
                  </span>
                  <span 
                    v-else
                    :class="[
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      classItem.hasAttendance 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-400 text-white'
                    ]">
                    {{ classItem.hasAttendance ? 'Registrado' : 'Programada' }}
                  </span>
                </div>

                <!-- Title -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white pr-24 mb-2">{{ classItem.name }}</h4>
                
                <!-- Schedule -->
                <div v-if="classItem.schedule?.slots?.length" class="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span v-for="(slot, idx) in classItem.schedule.slots" :key="slot.id" class="text-sm">
                    {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                    <span v-if="idx < classItem.schedule.slots.length - 1" class="mx-1">|</span>
                  </span>
                </div>
                
                <!-- Student Count -->
                <div class="flex items-center text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-sm">{{ classItem.studentIds?.length || classItem.students || 0 }} alumnos</span>
                </div>
                
                <!-- Classroom (if available) -->
                <div v-if="classItem.classroom" class="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span class="text-sm">{{ classItem.classroom }}</span>
                </div>
                
                <!-- Información de clase compartida mejorada -->
                <div v-if="classItem.isSharedClass" class="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <!-- Rol del usuario -->
                  <div class="flex items-center text-purple-600 dark:text-purple-400 text-sm mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a2 2 0 01-2 2h-1.5m-1.5 0h1.5a2 2 0 002-2M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a2 2 0 01-2 2h-1.5m-1.5 0h1.5a2 2 0 002-2" />
                    </svg>
                    <span class="font-medium">
                      {{ 
                        classItem.participationType === 'primary-shared' ? 'Eres el profesor principal' :
                        classItem.participationType === 'collaborator' && classItem.isSharedWithMe ? 'Clase compartida contigo' :
                        classItem.participationType === 'collaborator' ? `Eres ${classItem.userRole || 'colaborador'}` :
                        classItem.participationType === 'viewer' ? 'Tienes acceso a esta clase' :
                        'Participas en esta clase'
                      }}
                    </span>
                  </div>
                  
                  <!-- Información del profesor principal (si la clase fue compartida conmigo) -->
                  <div v-if="classItem.isSharedWithMe && classItem.originalTeacherId" class="text-xs text-purple-600 dark:text-purple-400 mb-2 bg-purple-100 dark:bg-purple-800/30 px-2 py-1 rounded">
                    <span class="font-medium">📩 Compartida por:</span>
                    <span class="ml-1">{{ classItem.teacher || 'Profesor principal' }}</span>
                  </div>
                  
                  <!-- Información de profesores -->
                  <div v-if="classItem.hasTeachersArray" class="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    <span class="font-medium">Profesores ({{ classItem.teachers?.length || 0 }}):</span>
                    <div class="mt-1 space-y-1">
                      <div 
                        v-for="teacher in classItem.teachers" 
                        :key="teacher.teacherId"
                        :class="[
                          'flex items-center justify-between px-2 py-1 rounded',
                          teacher.teacherId === classItem.teacherId ? 'bg-indigo-100 dark:bg-indigo-800/30' : 'bg-purple-100 dark:bg-purple-800/30'
                        ]"
                      >
                        <span>
                          {{ teacher.teacherId === classItem.teacherId ? '👑' : '🤝' }}
                          {{ teacher.role || 'colaborador' }}
                          {{ teacher.teacherId === authStore.user?.uid ? ' (tú)' : '' }}
                        </span>
                        <span v-if="teacher.permissions?.canTakeAttendance === false" class="text-red-500">
                          Sin permisos
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Permisos del usuario actual -->
                  <div class="flex items-center text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span 
                      :class="[
                        'font-medium',
                        classItem.canTakeAttendance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      ]"
                    >
                      {{ classItem.canTakeAttendance ? 'Puedes gestionar la asistencia' : 'Sin permisos para tomar asistencia' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sección de clases extra/recuperación -->
          <div v-if="extraClasses.length > 0">
            <h4 class="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Clases Extra/Recuperación ({{ extraClasses.length }})
            </h4>
            <div class="space-y-3">
              <div 
                v-for="classItem in extraClasses" 
                :key="classItem.id" 
                class="relative border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-all cursor-pointer"
                @click="navigateToAttendance(classItem.id)"
              >
                <!-- Status Indicator -->
                <div class="absolute top-3 right-3">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white">
                    Registrado
                  </span>
                </div>

                <!-- Title -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white pr-24 mb-2">
                  {{ classItem.name }}
                </h4>
                
                <!-- Extra class indicator -->
                <div class="flex items-center text-orange-600 dark:text-orange-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-medium">Clase extra o de recuperación</span>
                </div>
                
                <!-- Student Count -->
                <div class="flex items-center text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-sm">{{ classItem.studentIds?.length || classItem.students || 0 }} alumnos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensaje si no hay clases extra pero sí programadas -->
          <div v-if="scheduledClasses.length > 0 && extraClasses.length === 0" class="text-center py-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No hay clases extra o de recuperación registradas para este día.
            </p>
          </div>
        </div>
      </div>

      <!-- Modal footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between">
        <!-- Debug buttons (development only) -->
        <div v-if="isDevelopment" class="flex space-x-2">
          <button 
            @click="debugAttendance"
            class="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors focus:outline-none"
          >
            Debug General
          </button>
          <button 
            @click="debugLargeClasses"
            class="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors focus:outline-none"
          >
            Debug 95+ Estudiantes
          </button>
        </div>
        <div v-else></div>
        
        <button 
          @click="emit('close')"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors focus:outline-none"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>