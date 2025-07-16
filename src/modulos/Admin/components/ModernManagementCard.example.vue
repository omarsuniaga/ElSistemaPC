<!-- Ejemplo de uso del nuevo ModernManagementCard -->

<!-- En lugar de usar ManagementSuperCard con clases dinámicas: -->
<ManagementSuperCard
  title="Estudiantes"
  description="Gestión de estudiantes activos"
  icon="UsersIcon"
  :count="319"
  :recent="12"
  color="blue"
  route="/admin/students"
  @action="handleAction"
/>

<!-- Ahora puedes usar ModernManagementCard: -->
<ModernManagementCard
  title="Estudiantes"
  description="Gestión de estudiantes activos y seguimiento de progreso académico"
  icon="UsersIcon"
  :count="319"
  :recent="12"
  color="blue"
  route="/admin/students"
  status="active"
  :progress="85"
  trend="up"
  :actions="[
    {id: 'create', label: 'Nuevo', icon: 'PlusIcon', variant: 'success'},
    {id: 'import', label: 'Importar', icon: 'DocumentArrowUpIcon', variant: 'secondary'},
    {id: 'export', label: 'Exportar', icon: 'DocumentArrowDownIcon', variant: 'secondary'},
  ]"
  @action="handleStudentAction"
>
  <template #extra-actions>
    <div class="flex items-center justify-between text-xs">
      <span class="text-gray-500">Última actualización:</span>
      <span class="text-gray-700 dark:text-gray-300">Hace 5 minutos</span>
    </div>
  </template>
</ModernManagementCard>

<!-- Para maestros: -->
<ModernManagementCard
  title="Maestros"
  description="Personal docente y asignación de clases"
  icon="AcademicCapIcon"
  :count="24"
  :recent="2"
  color="green"
  route="/admin/teachers"
  status="active"
  :progress="92"
  trend="up"
  :actions="[
    {id: 'create', label: 'Contratar', icon: 'UserPlusIcon', variant: 'success'},
    {id: 'schedule', label: 'Horarios', icon: 'CalendarIcon', variant: 'primary'},
    {id: 'export', label: 'Exportar', icon: 'DocumentArrowDownIcon', variant: 'secondary'},
  ]"
  @action="handleTeacherAction"
/>

<!-- Para clases: -->
<ModernManagementCard
  title="Clases"
  description="Programación y gestión de clases activas"
  icon="BookOpenIcon"
  :count="45"
  :recent="3"
  color="purple"
  route="/admin/classes"
  status="active"
  :progress="78"
  trend="neutral"
  :actions="[
    {id: 'create', label: 'Nueva Clase', icon: 'PlusIcon', variant: 'success'},
    {id: 'schedule', label: 'Programar', icon: 'ClockIcon', variant: 'primary'},
  ]"
  @action="handleClassAction"
/>

<script setup lang="ts">
// Métodos para manejar acciones
const handleStudentAction = (actionId: string) => {
  switch (actionId) {
  case 'create':
    // Abrir modal de creación de estudiante
    break;
  case 'import':
    // Abrir importador de estudiantes
    break;
  case 'export':
    // Exportar datos de estudiantes
    break;
  }
};

const handleTeacherAction = (actionId: string) => {
  // Lógica para acciones de maestros
};

const handleClassAction = (actionId: string) => {
  // Lógica para acciones de clases
};
</script>
