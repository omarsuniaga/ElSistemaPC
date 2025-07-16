import { ref, computed } from 'vue';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline';

export function usePDFReportTypes() {
  // Report Types Configuration
  const reportTypes = ref([
    {
      id: 'by_class',
      title: 'Por Clase',
      description: 'Estudiantes agrupados por clase',
      icon: AcademicCapIcon,
      color: 'blue',
    },
    {
      id: 'by_teacher',
      title: 'Por Maestro',
      description: 'Estudiantes agrupados por maestro',
      icon: UserGroupIcon,
      color: 'green',
    },
    {
      id: 'by_day',
      title: 'Por Día',
      description: 'Estudiantes que tienen clases en un día específico',
      icon: CalendarDaysIcon,
      color: 'purple',
    },
    {
      id: 'all_students',
      title: 'Todos los Alumnos',
      description: 'Lista completa de estudiantes inscritos',
      icon: UsersIcon,
      color: 'orange',
    },
    {
      id: 'schedule_matrix',
      title: 'Matriz de Horarios',
      description: 'Horarios de todos los estudiantes en formato matriz',
      icon: TableCellsIcon,
      color: 'red',
    },
    // Nuevos tipos de reportes de horarios
    {
      id: 'schedule_by_teacher',
      title: 'Horarios por Maestro',
      description: 'Horario de clases organizadas por maestro',
      icon: UserGroupIcon,
      color: 'indigo',
    },
    {
      id: 'schedule_by_student',
      title: 'Horarios por Alumno',
      description: 'Horario personal de cada estudiante',
      icon: UsersIcon,
      color: 'pink',
    },
    {
      id: 'schedule_by_day',
      title: 'Horarios por Día',
      description: 'Programación diaria con todas las clases',
      icon: CalendarDaysIcon,
      color: 'emerald',
    },
    {
      id: 'schedule_by_class',
      title: 'Horarios por Clase',
      description: 'Información completa de horarios por clase',
      icon: AcademicCapIcon,
      color: 'amber',
    },
  ]);

  // Available Fields for PDF
  const availableFields = ref([
    { id: 'contador', label: 'N°' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'apellido', label: 'Apellido' },
    { id: 'edad', label: 'Edad' },
    { id: 'fechaNacimiento', label: 'Fecha de Nacimiento' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'email', label: 'Email' },
    { id: 'direccion', label: 'Dirección' },
    { id: 'madre', label: 'Madre' },
    { id: 'padre', label: 'Padre' },
    { id: 'tutor', label: 'Tutor' },
    { id: 'clase', label: 'Clase' },
    { id: 'instrumento', label: 'Instrumento' },
    { id: 'maestro', label: 'Maestro' },
    { id: 'horario', label: 'Horario' },
    { id: 'fecInscripcion', label: 'Fecha de Inscripción' },
    { id: 'activo', label: 'Estado' },
  ]);

  // Helper function to get icon colors
  const getIconColor = (color: string) => {
    const colorMap = {
      blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
      green: 'bg-gradient-to-r from-green-500 to-green-600',
      purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
      orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
      red: 'bg-gradient-to-r from-red-500 to-red-600',
      indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      pink: 'bg-gradient-to-r from-pink-500 to-pink-600',
      emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      amber: 'bg-gradient-to-r from-amber-500 to-amber-600',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const iconColors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-100',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      hover: 'hover:bg-orange-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hover: 'hover:bg-indigo-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      hover: 'hover:bg-red-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      hover: 'hover:bg-yellow-100',
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100',
    },
  };

  const fieldLabels = {
    name: 'Nombre',
    age: 'Edad',
    instrument: 'Instrumento',
    teacher: 'Maestro',
    class: 'Clase',
    schedule: 'Horario',
    enrollmentDate: 'Fecha de Inscripción',
    status: 'Estado',
    phone: 'Teléfono',
    email: 'Email',
    students: 'Estudiantes',
    capacity: 'Capacidad',
    classes: 'Clases',
    date: 'Fecha',
    observations: 'Observaciones',
    evaluation: 'Evaluación',
    score: 'Puntuación',
    comments: 'Comentarios',
  };

  const fieldTypes = {
    name: 'text',
    age: 'number',
    instrument: 'text',
    teacher: 'text',
    class: 'text',
    schedule: 'text',
    enrollmentDate: 'date',
    status: 'select',
    phone: 'text',
    email: 'email',
    students: 'number',
    capacity: 'number',
    classes: 'number',
    date: 'date',
    observations: 'textarea',
    evaluation: 'text',
    score: 'number',
    comments: 'textarea',
  };

  const getReportTypeById = (id: string) => {
    return reportTypes.value.find((type) => type.id === id);
  };

  const getFieldLabel = (field: string) => {
    return fieldLabels[field as keyof typeof fieldLabels] || field;
  };

  const getFieldType = (field: string) => {
    return fieldTypes[field as keyof typeof fieldTypes] || 'text';
  };

  return {
    reportTypes,
    availableFields,
    getIconColor,
    iconColors,
    fieldLabels,
    fieldTypes,
    getReportTypeById,
    getFieldLabel,
    getFieldType,
  };
}
