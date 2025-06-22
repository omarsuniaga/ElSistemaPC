<template>
  <div class="class-list">
    <v-text-field
      v-model="search"
      :prepend-inner-icon="'mdi-magnify'"
      label="Buscar clases"
      variant="outlined"
      density="compact"
      hide-details
      class="mb-4"
    ></v-text-field>

    <v-data-table
      :headers="headers"
      :items="filteredClasses"
      :search="search"
      :loading="loading"
      loading-text="Cargando clases..."
      no-data-text="No hay clases disponibles"
      class="elevation-1"
    >
      <template #item.teacher="{ item }">
        {{ getTeacherName(item.teacherId) }}
      </template>

      <template #item.students="{ item }">
        {{ item.studentIds?.length || 0 }} estudiantes
      </template>

      <template #item.schedule="{ item }">
        {{ formatSchedule(item.schedule) }}
      </template>

      <template #item.actions="{ item }">
        <v-tooltip text="Editar clase" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              variant="text"
              density="comfortable"
              :icon="'mdi-pencil'"
              size="small"
              class="me-2"
              @click="$emit('edit', item)"
            ></v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Ver horario" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              variant="text"
              density="comfortable"
              :icon="'mdi-calendar-clock'"
              size="small"
              class="me-2"
              @click="$emit('view-schedule', item)"
            ></v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Eliminar clase" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              variant="text"
              density="comfortable"
              :icon="'mdi-delete'"
              size="small"
              color="error"
              @click="$emit('delete', item)"
            ></v-btn>
          </template>
        </v-tooltip>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import type { ClassData } from '../types/class';

const props = defineProps<{
  classes: ClassData[];
  loading?: boolean;
}>();

defineEmits<{
  (e: 'edit', classItem: ClassData): void;
  (e: 'delete', classItem: ClassData): void;
  (e: 'view-schedule', classItem: ClassData): void;
}>();

const search = ref('');
const teachersStore = useTeachersStore();

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Nivel', key: 'level' },
  { title: 'Instrumento', key: 'instrument' },
  { title: 'Profesor', key: 'teacher' },
  { title: 'Estudiantes', key: 'students' },
  { title: 'Horario', key: 'schedule' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

const filteredClasses = computed(() => {
  return props.classes.map(cls => ({
    ...cls,
    teacherName: getTeacherName(cls.teacherId)
  }));
});

function getTeacherName(teacherId?: string): string {
  if (!teacherId) return 'Sin asignar';
  const teacher = teachersStore.teachers.find(t => t.id === teacherId);
  return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Profesor no encontrado';
}

function formatSchedule(schedule: any): string {
  if (!schedule) return 'Sin horario';
  
  if (Array.isArray(schedule)) {
    return schedule.map(s => `${s.day}: ${s.startTime} - ${s.endTime}`).join(', ');
  }
  
  if (schedule.day && schedule.startTime && schedule.endTime) {
    return `${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`;
  }
  
  return 'Horario no válido';
}
</script>

<style scoped>
.class-list {
  padding: 16px;
}
</style>
