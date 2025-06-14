<script setup lang="ts">
import { PencilIcon, UserGroupIcon, ClockIcon, MapPinIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import type { Class } from '@/modulos/Classes/models/Class'; // Asegúrate de que la ruta y el tipo sean correctos

// Definir las props que recibirá el componente
const props = defineProps<{
  upcomingClasses: (Class & { nextSessionDate: Date })[]; // Clases con la fecha de la próxima sesión añadida
  formatDateTime: (date: Date) => string; // Función para formatear fechas
  getNextSession: (classItem: Class) => Date; // Función para obtener la próxima sesión
}>();

// Funciones para emitir eventos al componente padre
const handleEditClass = (classId: string) => emit('edit-class', classId);
const handleManageStudents = (classId: string) => emit('manage-students', classId);
const handleViewClass = (classId: string) => emit('view-class', classId);

// Función para determinar el color de la tarjeta según la proximidad de la clase
const getCardColor = (date: Date): string => {
  const now = new Date();
  const hoursDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff <= 1) return 'border-red-500 dark:border-red-400'; // Menos de 1 hora
  if (hoursDiff <= 3) return 'border-orange-500 dark:border-orange-400'; // Menos de 3 horas
  if (hoursDiff <= 6) return 'border-yellow-500 dark:border-yellow-400'; // Menos de 6 horas
  return 'border-blue-500 dark:border-blue-400'; // Más de 6 horas
};

// Función para formatear la hora en formato 12h
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Función para obtener el tiempo restante hasta la clase
const getTimeRemaining = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'En curso';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours === 0) {
    return `En ${diffMinutes} min`;
  }
  
  return `En ${diffHours}h ${diffMinutes}m`;
};
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex justify-between items-center">
      <span>Próximas Clases (24h)</span>
      <span class="text-sm font-normal bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded-full">
        {{ upcomingClasses.length }} clase(s)
      </span>
    </h2>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="space-y-4">
        <template v-if="upcomingClasses.length > 0">
          <div 
            v-for="classItem in upcomingClasses" 
            :key="classItem.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 border-l-4 transition-all hover:shadow-md"
            :class="getCardColor(classItem.nextSessionDate)"
            @click="handleViewClass(classItem.id)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <h3 class="font-medium text-lg text-gray-900 dark:text-white">{{ classItem.name }}</h3>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon class="h-4 w-4 mr-1" />
                    {{ formatDateTime(classItem.nextSessionDate) }}
                  </span>
                  <span class="inline-flex items-center text-sm font-medium">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    {{ formatTime(classItem.nextSessionDate) }}
                  </span>
                </div>
                
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{{ classItem.classroom || 'Sin asignar' }}</span>
                  </div>
                  
                  <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <UserGroupIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{{ classItem.studentIds?.length || 0 }} estudiante(s)</span>
                  </div>
                </div>
                
                <div class="mt-2">
                  <span 
                    class="inline-block px-2 py-1 text-xs font-medium rounded-full" 
                    :class="{
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200': getTimeRemaining(classItem.nextSessionDate) === 'En curso',
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200': getTimeRemaining(classItem.nextSessionDate).includes('min'),
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200': getTimeRemaining(classItem.nextSessionDate).includes('h')
                    }"
                  >
                    {{ getTimeRemaining(classItem.nextSessionDate) }}
                  </span>
                </div>
              </div>
              
              <div class="flex space-x-2 ml-2">
                <button 
                  @click.stop="handleEditClass(classItem.id)" 
                  class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
                  title="Editar clase"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>
                <button 
                  @click.stop="handleManageStudents(classItem.id)" 
                  class="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md"
                  title="Gestionar estudiantes"
                >
                  <UserGroupIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
          <CalendarIcon class="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
          <p class="text-lg">No tienes clases programadas para las próximas 24 horas.</p>
          <p class="text-sm mt-2">Disfruta de tu tiempo libre o aprovecha para preparar tus próximas clases.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animación sutil para las tarjetas */
.border-l-4 {
  transition: all 0.2s ease-in-out;
}

.border-l-4:hover {
  transform: translateY(-2px);
}
</style>