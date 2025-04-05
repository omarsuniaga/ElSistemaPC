<template>
  <div class="teacher-weekly-schedule">
    <div class="sm;space-y-1">
      <template v-for="day in weekDays" :key="day">
        <div v-if="classesStore.getClassByDaysAndTeacher(props.teacherId, day).length > 0" class="day-section">
          <div class="day-header">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ day }}</h3>
          </div>
          
          <div class="class-list">
            <div 
              v-for="class_ in classesStore.getClassByDaysAndTeacher(props.teacherId, day)" 
              :key="class_.id"
              class="class-item"
              @click="selectClass(class_)"
            >
              <div class="class-item-content">
                <div class="class-name">{{ class_.name }}</div>
                
                <div class="class-details">
                  <div class="class-time">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    <span>{{ formatScheduleTime(getScheduleForDay(class_, day)) }}</span>
                  </div>
                  
                  <div v-if="class_.classroom" class="class-location">
                    <MapPinIcon class="h-4 w-4 mr-1" />
                    <span>{{ class_.classroom }}</span>
                  </div>
                  
                  <div v-if="class_.instrument" class="class-instrument">
                    <MusicalNoteIcon class="h-4 w-4 mr-1" />
                    <span>{{ class_.instrument }}</span>
                  </div>
                  
                  <div class="class-students">
                    <UserGroupIcon class="h-4 w-4 mr-1" />
                    <span>{{ class_.studentIds?.length || 0 }} estudiantes</span>
                  </div>
                  <!-- Duracion -->
                  
                  <div v-if="class_.schedule?.slots?.[0]" class="class-students">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    <span>{{ formatClassDuration(class_.schedule.slots[0].startTime, class_.schedule.slots[0].endTime) }}</span>
                  </div>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>    
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClassesStore } from '../../Classes/store/classes'
import { format } from 'date-fns'
import { 
  XMarkIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon,
  MusicalNoteIcon 
} from '@heroicons/vue/24/outline'

interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  level?: string;
  instrument?: string;
  teacherId?: string;
  studentIds?: string[];
  schedule?: {
    slots: ScheduleSlot[];
  };
  classroom?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const classesStore = useClassesStore()

const props = defineProps<{
  teacherId: string;
}>()

const selectedClass = ref<ClassData | null>(null)
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const selectClass = (class_: ClassData) => {
  if (class_.teacherId) { // Verify teacherId exists
    selectedClass.value = class_
  }
}

const getCurrentDate = () => {
  return format(new Date(), 'yyyyMMdd')
}

const getScheduleForDay = (class_: ClassData, day: string): ScheduleSlot | undefined => {
  if (class_.teacherId) { // Verify teacherId exists
    return class_.schedule?.slots.find(slot => slot.day === day)
  }
  return undefined
}

const formatScheduleTime = (scheduleSlot: ScheduleSlot | undefined): string => {
  if (!scheduleSlot) return 'Horario no disponible'
  return `${scheduleSlot.startTime} - ${scheduleSlot.endTime}`
}

const formatClassSchedule = (class_: ClassData): string => {
  if (!class_.schedule?.slots?.length) return 'Sin horario asignado'
  return class_.schedule.slots.map(slot => 
    `${slot.day} ${slot.startTime} - ${slot.endTime}`
  ).join(', ')
}

const formatClassDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'Duración no disponible';
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  if (totalMinutes <= 0) return 'Duración inválida';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${minutes}min`;
}
</script>

<style scoped>
.teacher-weekly-schedule {
  max-width: 100%;
  margin: 0 auto;
}

.day-header {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.class-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.class-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.class-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.class-name {
  font-weight: 600;
  font-size: 0.8rem;
}

.class-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.class-time, .class-location, .class-instrument, .class-students {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.selected-class-detail {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-class-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.selected-class-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 500;
}

.attendance-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.attendance-button:hover {
  background-color: #2563eb;
}

.empty-day {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  text-align: center;
  color: #6b7280;
}

@media (prefers-color-scheme: dark) {
  .class-item {
    background-color: #1f2937;
  }
  
  .class-details {
    color: #9ca3af;
    background-color: #111827;
  }
  
  .selected-class-detail {
    background-color: #1f2937;
  }
  
  .close-button:hover {
    background-color: #374151;
  }
  
  .info-item {
    background-color: #111827;
  }
  
  .empty-day {
    background-color: #111827;
    color: #9ca3af;
  }
}
</style>
