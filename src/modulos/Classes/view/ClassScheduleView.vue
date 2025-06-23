<template>
  <div class="class-schedule">
    <!-- Import the new WeeklyScheduleView component -->
    <WeeklyScheduleView :classes="classes" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClassesStore } from '../store/classes';
import WeeklyScheduleView from '../components/WeeklyScheduleView.vue';

const classesStore = useClassesStore();

// Computed properties
const classes = computed(() => classesStore.classes);

// Lifecycle
onMounted(async () => {
  try {
    await classesStore.loadClasses();
  } catch (error) {
    console.error('Error loading classes:', error);
  }
});
</script>
        first-interval="7"
        interval-count="13"
        interval-minutes="60"
        :event-height="40"
      ></v-calendar>
    </v-card>

    <v-card v-else>
      <v-list>
        <v-list-item
          v-for="(classItem, index) in filteredClasses"
          :key="index"
          :class="{ 'highlighted-class': isClassSelected(classItem.id) }"
          @click="selectClass(classItem)"
          class="class-list-item"
        >
          <v-list-item-content>
            <v-list-item-title>{{ classItem.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ classItem.level }} - {{ classItem.instrument }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              <v-icon small class="mr-1">mdi-account</v-icon>
              {{ getTeacherName(classItem.teacherId) }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              <v-icon small class="mr-1">mdi-account-group</v-icon>
              {{ classItem.studentIds?.length || 0 }} estudiantes
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              <v-icon small class="mr-1">mdi-clock-time-four-outline</v-icon>
              {{ formatSchedule(classItem.schedule) }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn
              icon
              @click.stop="editClass(classItem)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Diálogo de detalles del evento -->
    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card v-if="selectedEvent">
        <v-card-title class="headline">
          {{ selectedEvent.name }}
        </v-card-title>
        <v-card-text>
          <p><strong>Profesor:</strong> {{ selectedEvent.teacherName }}</p>
          <p><strong>Horario:</strong> {{ formatTime(selectedEvent.start) }} - {{ formatTime(selectedEvent.end) }}</p>
          <p><strong>Duración:</strong> {{ getEventDuration(selectedEvent) }} minutos</p>
          <p><strong>Estudiantes:</strong> {{ selectedEvent.studentsCount || 0 }}</p>
          <p v-if="selectedEvent.description">
            <strong>Descripción:</strong> {{ selectedEvent.description }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showEventDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClassesStore } from '../store/classes';
import { useTeachersStore } from '../../Teachers/store/teachers';
import type { ClassData } from '../types/class';

const props = defineProps<{
  selectedClassId?: string;
}>();

const emit = defineEmits<{
  (e: 'edit', classItem: ClassData): void;
  (e: 'select', classId: string): void;
}>();

const classesStore = useClassesStore();
const teachersStore = useTeachersStore();

// Estado del componente
const viewMode = ref('week');
const search = ref('');
const calendarDate = ref(new Date().toISOString().substr(0, 10));
const selectedEvent = ref<any>(null);
const showEventDialog = ref(false);

// Cargar datos iniciales
onMounted(async () => {
  await Promise.all([
    classesStore.fetchClasses(),
    teachersStore.fetchTeachers()
  ]);
});

// Computed properties
const filteredClasses = computed(() => {
  if (!search.value) return classesStore.classes;
  
  const searchLower = search.value.toLowerCase();
  return classesStore.classes.filter(c => 
    c.name.toLowerCase().includes(searchLower) ||
    c.level.toLowerCase().includes(searchLower) ||
    c.instrument.toLowerCase().includes(searchLower) ||
    getTeacherName(c.teacherId).toLowerCase().includes(searchLower)
  );
});

const calendarEvents = computed(() => {
  return classesStore.classes.flatMap(cls => {
    if (!cls.schedule) return [];
    
    const schedules = Array.isArray(cls.schedule) ? cls.schedule : [cls.schedule];
    
    return schedules.map(schedule => {
      if (!schedule || !schedule.day || !schedule.startTime) return null;
      
      const dayIndex = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        .findIndex(d => d.toLowerCase() === schedule.day.toLowerCase());
      
      if (dayIndex === -1) return null;
      
      const startDate = new Date(calendarDate.value);
      // Ajustar al día de la semana correcto
      startDate.setDate(startDate.getDate() + (dayIndex - startDate.getDay() + 7) % 7);
      
      const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
      const [endHours, endMinutes] = (schedule.endTime || '00:00').split(':').map(Number);
      
      const start = new Date(startDate);
      start.setHours(startHours, startMinutes, 0, 0);
      
      const end = new Date(startDate);
      end.setHours(endHours, endMinutes, 0, 0);
      
      return {
        id: cls.id,
        name: cls.name,
        start: start.toISOString(),
        end: end.toISOString(),
        color: getRandomColor(),
        classItem: cls,
        teacherName: getTeacherName(cls.teacherId),
        studentsCount: cls.studentIds?.length || 0,
        description: cls.description
      };
    }).filter(Boolean);
  });
});

const filteredEvents = computed(() => {
  const selectedDate = new Date(calendarDate.value);
  const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()];
  
  return calendarEvents.value.filter(event => {
    const schedule = event.classItem.schedule;
    if (!schedule) return false;
    
    const checkScheduleItem = (s: any): boolean => {
      if (!s || typeof s !== 'object') return false;
      
      if ('day' in s && typeof s.day === 'string') {
        return s.day.toLowerCase() === dayOfWeek.toLowerCase();
      }
      
      if ('slots' in s && Array.isArray(s.slots)) {
        return s.slots.some((slot: any) => 
          slot && typeof slot === 'object' && 
          'day' in slot && 
          typeof slot.day === 'string' &&
          slot.day.toLowerCase() === dayOfWeek.toLowerCase()
        );
      }
      
      return false;
    };
    
    if (Array.isArray(schedule)) {
      return schedule.some(checkScheduleItem);
    }
    
    return checkScheduleItem(schedule);
  });
});

// Métodos
function getTeacherName(teacherId?: string): string {
  if (!teacherId) return 'Sin asignar';
  const teacher = teachersStore.teachers.find(t => t.id === teacherId);
  return teacher?.name || 'Profesor no encontrado';
}

function formatSchedule(schedule: any): string {
  if (!schedule) return 'Sin horario';
  
  if (Array.isArray(schedule)) {
    return schedule
      .filter((s: any) => s && typeof s === 'object' && 'day' in s && 'startTime' in s && 'endTime' in s)
      .map((s: any) => `${s.day}: ${s.startTime} - ${s.endTime}`)
      .join(', ');
  }
  
  if (typeof schedule === 'object' && schedule !== null) {
    if ('slots' in schedule && Array.isArray(schedule.slots)) {
      return schedule.slots
        .filter((s: any) => s && typeof s === 'object' && 'day' in s && 'startTime' in s && 'endTime' in s)
        .map((s: any) => `${s.day}: ${s.startTime} - ${s.endTime}`)
        .join(', ');
    }
    
    if ('day' in schedule && 'startTime' in schedule && 'endTime' in schedule) {
      return `${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`;
    }
  }
  
  return 'Horario no válido';
}

function formatTime(dateTime: string | Date): string {
  const date = new Date(dateTime);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getEventColor(event: any): string {
  return event.color || getRandomColor();
}

function getRandomColor(): string {
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getEventDuration(event: any): number {
  try {
    if (!event || !event.start || !event.end) return 0;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Fechas inválidas en el evento:', event);
      return 0;
    }
    
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / (1000 * 60)); // en minutos
  } catch (error) {
    console.error('Error al calcular la duración del evento:', error);
    return 0;
  }
}

function showEvent({ event }: { event: any }) {
  selectedEvent.value = event;
  showEventDialog.value = true;
}

function addEvent(date: string) {
  // Implementar lógica para añadir nuevo evento
  console.log('Añadir nuevo evento en:', date);
}

function editClass(classItem: ClassData) {
  emit('edit', classItem);
}

function selectClass(classItem: ClassData) {
  emit('select', classItem.id);
}

function isClassSelected(classId: string): boolean {
  return props.selectedClassId === classId;
}
</script>

<style scoped>
.class-schedule {
  padding: 16px;
}

.event-item {
  font-size: 0.8em;
  padding: 4px;
  white-space: normal;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  font-weight: bold;
  font-size: 0.9em;
}

.event-title {
  font-weight: 500;
  margin: 2px 0;
}

.event-teacher {
  font-size: 0.8em;
  opacity: 0.8;
}

.highlighted-class {
  background-color: #e3f2fd;
  border-left: 4px solid #2196F3;
}

.class-list-item {
  transition: background-color 0.3s;
  cursor: pointer;
}

.class-list-item:hover {
  background-color: #f5f5f5;
}
</style>
