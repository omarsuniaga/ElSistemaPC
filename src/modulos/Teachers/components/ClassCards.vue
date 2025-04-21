<script setup lang="ts">
import { computed } from 'vue';
import { useClassesStore } from '../../../modulos/Classes/store/classes';
import { useAuthStore } from '../../../stores/auth';

// Stores
const classesStore = useClassesStore();
const authStore = useAuthStore();

// Obtener el ID del profesor actual
const currentTeacherId = computed(() => authStore.user?.uid);

// Filtrar las clases del profesor actual
const teacherClasses = computed(() => {
  return classesStore.classes.filter(classItem => classItem.teacherId === currentTeacherId.value);
});

// Ordenar las clases por día de la semana (empezando por lunes)
const sortedClasses = computed(() => {
  if (!teacherClasses.value.length) return [];
  
  return [...teacherClasses.value].sort((a, b) => {
    // Si no hay horario, colocar al final
    if (!a.schedule?.slots?.length) return 1;
    if (!b.schedule?.slots?.length) return -1;
    
    // Obtener el primer día de cada clase
    const aDayIndex = getDayIndex(a.schedule.slots[0].day);
    const bDayIndex = getDayIndex(b.schedule.slots[0].day);
    
    // Ordenar por día (lunes primero)
    return aDayIndex - bDayIndex;
  });
});

// Función para convertir el día a un índice (lunes = 1, domingo = 7)
function getDayIndex(day) {
  // Si day es un número entre 0-6, convertirlo a formato 1-7 con lunes=1
  if (typeof day === 'number' && day >= 0 && day <= 6) {
    // Convertir de formato domingo=0 a formato lunes=1
    return day === 0 ? 7 : day;
  }
  
  // Si day es una cadena, mapearla a un índice
  const dayMapping = {
    'domingo': 7, 'dom': 7, 'sunday': 7, 'sun': 7, '0': 7,
    'lunes': 1, 'lun': 1, 'monday': 1, 'mon': 1, '1': 1,
    'martes': 2, 'mar': 2, 'tuesday': 2, 'tue': 2, '2': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'wednesday': 3, 'wed': 3, '3': 3,
    'jueves': 4, 'jue': 4, 'thursday': 4, 'thu': 4, '4': 4,
    'viernes': 5, 'vie': 5, 'friday': 5, 'fri': 5, '5': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6, 'saturday': 6, 'sat': 6, '6': 6
  };
  
  if (typeof day === 'string') {
    const normalizedDay = day.toLowerCase().trim();
    return dayMapping[normalizedDay] || 7; // Por defecto domingo si no se reconoce
  }
  
  return 7; // Por defecto domingo
}

// Función para formatear el horario de la clase
function formatSchedule(classItem) {
  if (!classItem.schedule || !classItem.schedule.slots || classItem.schedule.slots.length === 0) {
    return 'Sin horario asignado';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  return classItem.schedule.slots.map(slot => {
    const dayIndex = getDayIndex(slot.day);
    // Ajustar para que coincida con el array dayNames (0-7)
    const adjustedIndex = dayIndex === 7 ? 0 : dayIndex;
    return `${dayNames[adjustedIndex]} ${slot.startTime || '00:00'}-${slot.endTime || '00:00'}`;
  }).join(', ');
}

// Definir props para compatibilidad con componentes que puedan pasar clases directamente
defineProps({
  classes: {
    type: Array,
    default: () => []
  }
});
</script>

<template>
  <div class="class-cards-container">
    <div v-if="sortedClasses.length === 0" class="no-classes">
      <p>No tienes clases asignadas actualmente.</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="classItem in sortedClasses" 
        :key="classItem.id" 
        class="class-card bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ classItem.name }}</h3>
        <div class="mt-2 space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Horario:</span> {{ formatSchedule(classItem) }}
          </p>
          <p v-if="classItem.classroom" class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Aula:</span> {{ classItem.classroom }}
          </p>
          <p v-if="classItem.instrument" class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Instrumento:</span> {{ classItem.instrument }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Estudiantes:</span> {{ classItem.studentIds?.length || 0 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.class-cards-container {
  padding: 1rem;
}

.no-classes {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.class-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>