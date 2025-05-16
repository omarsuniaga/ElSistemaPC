<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
} from '@heroicons/vue/24/outline';
import type { AttendanceStatus } from '../types/attendance';
import type { Student } from '../../Students/types/student';
import StudentAvatar from './StudentAvatar.vue';

const props = defineProps<{
  student: Student;
  attendanceStatus: AttendanceStatus | undefined;
  isDisabled: boolean;
  isPending: boolean;
  pendingChanges?: Set<string>; // Añadimos prop de pendingChanges para mejor tracking
}>();

const emit = defineEmits<{
  (e: 'update-status', studentId: string, status: AttendanceStatus): void;
  (e: 'open-justification', student: Student): void;
}>();

// Añadir un console.log para debug de cambios de estado
console.log(`[AttendanceTableRow] Dibujando estado ${props.attendanceStatus || 'sin definir'} para ${props.student.nombre}`);

// Use the imported StudentAvatar component
const studentName = computed(() => `${props.student.nombre} ${props.student.apellido}`);

// Use a simple media query check with window.matchMedia instead of $q
const isMobile = ref(false);

// Function to update isMobile based on screen width
const checkMobileScreen = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.matchMedia('(max-width: 640px)').matches;
  }
};

// Function to handle ripple effect
const createRipple = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLElement;
  const ripple = button.querySelector('.ripple') as HTMLElement;
  
  if (!ripple) return;
  
  // Remove any existing animation
  ripple.style.animation = 'none';
  
  // Force reflow to ensure animation restarts
  void ripple.offsetWidth;
  
  // Restart animation
  ripple.style.animation = 'ripple-out 0.6s ease-out';
};

// Método para manejar la justificación
const handleJustification = () => {
  console.log('[Justificación] Iniciando proceso de justificación para estudiante:', props.student.id);
  
  // Primero marcamos como Justificado para un cambio inmediato
  emit('update-status', props.student.id, 'Justificado');
  console.log('[Justificación] Emitido evento update-status con estado Justificado');
  
  // Luego abrimos el modal de justificación de inmediato
  // El retraso puede estar causando problemas
  console.log('[Justificación] Emitiendo evento open-justification con estudiante:', props.student);
  emit('open-justification', props.student);
};

// Initialize on component mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    // Set initial value
    checkMobileScreen();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobileScreen);
  }
  
  // Add click event listeners to all buttons
  const buttons = document.querySelectorAll('.attendance-btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', createRipple);
  });
});

// Clean up the event listener when component is unmounted
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobileScreen);
  }
  
  // Clean up event listeners
  const buttons = document.querySelectorAll('.attendance-btn');
  buttons.forEach(button => {
    button.removeEventListener('mousedown', createRipple);
  });
});
</script>

<template>
  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
    <td class="px-1 sm:px-2 py-2 sm:py-3">
      <div class="flex items-center">
        <div class="flex-shrink-0 h-7 w-7 sm:h-10 sm:w-10">
          <StudentAvatar 
            :firstName="student.nombre"
            :lastName="student.apellido"
            :size="isMobile ? 'sm' : 'md'"
          />
        </div>
        <div class="ml-2 sm:ml-4">
          <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {{ studentName }}
          </div>
        </div>
      </div>
    </td>
    
    <td class="px-1 sm:px-4 py-2 sm:py-3">
      <div class="flex gap-2 sm:mx-2 sm:gap-3 justify-end items-center">
        <div v-if="isPending" class="flex items-center" title="Cambio pendiente">
          <span class="w-2 h-2 bg-amber-500 rounded-full animate-ping-slow"></span>
        </div>
        
        <!-- Present Button -->
        <button 
          @click="emit('update-status', student.id, 'Presente')"
          :class="[
            'attendance-btn',
            attendanceStatus === 'Presente' ? 'active-present' : 'btn-present'
          ]"
          :disabled="isDisabled"
        >
          <span class="tooltip">Presente</span>
          <div class="btn-content">
            <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="ripple"></span>
          </div>
        </button>
        
        <!-- Absent Button -->
        <button 
          @click="emit('update-status', student.id, 'Ausente')"
          :class="[
            'attendance-btn',
            attendanceStatus === 'Ausente' ? 'active-absent' : 'btn-absent'
          ]"
          :disabled="isDisabled"
        >
          <span class="tooltip">Ausente</span>
          <div class="btn-content">
            <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="ripple"></span>
          </div>
        </button>
        
        <!-- Late Button -->
        <button 
          @click="emit('update-status', student.id, 'Tardanza')"
          :class="[
            'attendance-btn',
            attendanceStatus === 'Tardanza' ? 'active-late' : 'btn-late'
          ]"
          :disabled="isDisabled"
        >
          <span class="tooltip">Tardanza</span>
          <div class="btn-content">
            <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="ripple"></span>
          </div>
        </button>
        
        <!-- Justification Button -->
        <button 
          @click="handleJustification()"
          :class="[
            'attendance-btn',
            attendanceStatus === 'Justificado' ? 'active-justified' : 'btn-justified'
          ]"
          :disabled="isDisabled"
          title="Registrar ausencia justificada"
        >
          <span class="tooltip">{{ attendanceStatus === 'Justificado' ? 'Justificado' : 'Justificar' }}</span>
          <div class="btn-content">
            <DocumentCheckIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span v-if="attendanceStatus === 'Justificado'" class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            <span class="ripple"></span>
          </div>
        </button>
      </div>
    </td>
  </tr>
</template>

<style scoped>
/* Button base styles */
.attendance-btn {
  @apply relative flex items-center justify-center cursor-pointer;
  @apply p-1.5 sm:p-2;
  @apply transition-all duration-200;
  @apply focus:outline-none;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply overflow-hidden; /* For ripple effect */
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 50%; /* Make buttons circular */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Present button styles */
.btn-present {
  @apply bg-green-50 text-green-600 border border-green-200;
  opacity: 0.8;
}
.btn-present:hover {
  @apply bg-green-100;
  opacity: 0.9;
  transform: scale(1.05);
}
.active-present {
  @apply bg-green-600 text-white border-0;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 
              0 0 20px rgba(34, 197, 94, 0.3), 
              inset 0 0 8px rgba(255, 255, 255, 0.4);
  opacity: 1;
  transform: scale(1.1);
  animation: pulsate-green 2s infinite;
}

/* Absent button styles */
.btn-absent {
  @apply bg-red-50 text-red-600 border border-red-200;
  opacity: 0.8;
}
.btn-absent:hover {
  @apply bg-red-100;
  opacity: 0.9;
  transform: scale(1.05);
}
.active-absent {
  @apply bg-red-600 text-white border-0;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), 
              0 0 20px rgba(239, 68, 68, 0.3), 
              inset 0 0 8px rgba(255, 255, 255, 0.4);
  opacity: 1;
  transform: scale(1.1);
  animation: pulsate-red 2s infinite;
}

/* Late button styles */
.btn-late {
  @apply bg-yellow-50 text-yellow-600 border border-yellow-200;
  opacity: 0.8;
}
.btn-late:hover {
  @apply bg-yellow-100;
  opacity: 0.9;
  transform: scale(1.05);
}
.active-late {
  @apply bg-yellow-600 text-white border-0;
  box-shadow: 0 0 10px rgba(253, 186, 116, 0.6), 
              0 0 20px rgba(253, 186, 116, 0.4), 
              inset 0 0 8px rgba(255, 255, 255, 0.4);
  opacity: 1;
  transform: scale(1.1);
  animation: pulsate-yellow 2s infinite;
}

/* Justified button styles */
.btn-justified {
  @apply bg-blue-50 text-blue-600 border border-blue-200;
  opacity: 0.8;
}
.btn-justified:hover {
  @apply bg-blue-100;
  opacity: 0.9;
  transform: scale(1.05);
}
.active-justified {
  @apply bg-blue-600 text-white border-0;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 
              0 0 20px rgba(59, 130, 246, 0.3), 
              inset 0 0 8px rgba(255, 255, 255, 0.4);
  opacity: 1;
  transform: scale(1.1);
  animation: pulsate-blue 2s infinite;
}

/* Button content wrapper */
.btn-content {
  @apply relative flex items-center justify-center;
  @apply w-full h-full;
}

/* Tooltip styles */
.tooltip {
  @apply absolute invisible opacity-0 bg-gray-800 text-white text-xs rounded-md py-1 px-2;
  @apply -top-8 left-1/2 transform -translate-x-1/2;
  @apply transition-opacity duration-200;
  @apply whitespace-nowrap;
  @apply z-10;
}

/* Show tooltip on hover */
.attendance-btn:hover .tooltip {
  @apply visible opacity-100;
}

/* Ripple effect */
.ripple {
  @apply absolute rounded-full bg-white bg-opacity-30;
  @apply scale-0 opacity-0;
  transform-origin: center;
  animation: ripple-out 0.6s ease-out;
}

@keyframes ripple-out {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

/* Color-specific pulsating glow animations */
@keyframes pulsate-green {
  0% {
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4);
  }
  100% {
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3);
  }
}

@keyframes pulsate-red {
  0% {
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4);
  }
  100% {
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3);
  }
}

@keyframes pulsate-yellow {
  0% {
    box-shadow: 0 0 10px rgba(253, 186, 116, 0.5), 0 0 20px rgba(253, 186, 116, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(253, 186, 116, 0.6), 0 0 30px rgba(253, 186, 116, 0.4);
  }
  100% {
    box-shadow: 0 0 10px rgba(253, 186, 116, 0.5), 0 0 20px rgba(253, 186, 116, 0.3);
  }
}

@keyframes pulsate-blue {
  0% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
  }
  100% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
  }
}

/* Slow ping animation */
@keyframes ping-slow {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

.animate-ping-slow {
  animation: ping-slow 1.5s ease-in-out infinite;
}
</style>
