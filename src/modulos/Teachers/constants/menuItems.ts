// /src/modulos/Teachers/constants/menuItems.ts
import {
  HomeIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserCircleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  BellIcon,
} from '@heroicons/vue/24/outline';

// Menú para maestros: rutas que comienzan con "/teacher"
// (asegurándose de que las rutas coincidan con las definidas en el router)
export const teacherMenuItems = [
  {
    name: 'Dashboard',
    icon: HomeIcon,
    to: '/teacher',
    ariaLabel: 'Panel de control del maestro',
  },
  // {
  //   name: 'Notificaciones',
  //   icon: BellIcon,
  //   to: '/teacher/notifications',
  //   ariaLabel: 'Ver notificaciones'
  // },
  {
    name: 'Attendance',
    icon: ClipboardDocumentCheckIcon,
    to: '/calendar',
    ariaLabel: 'Gestionar asistencias',
    // Acceso abierto para todos los roles de maestro
  },
  {
    name: 'Montaje',
    icon: SparklesIcon,
    to: '/maestro/montaje/obras', // Actualizada la ruta
    ariaLabel: 'Gestión de montaje musical',
  },
  {
    name: 'Horarios',
    icon: ClockIcon,
    to: '/teacher/schedule',
    ariaLabel: 'Ver horarios',
  },
  // {
  //   name: 'Alumnos',
  //   icon: UserGroupIcon,
  //   to: '/students',
  //   ariaLabel: 'Gestionar alumnos'
  // },
];

// Menú para directores/administradores: rutas que coinciden con las definidas en el router
export const adminMenuItems = [
  {
    name: 'Inicio',
    icon: HomeIcon,
    to: '/admin',
    ariaLabel: 'Panel de control administrativo',
  },
  {
    name: 'Alumnos',
    icon: UserGroupIcon,
    to: '/admin/students',
    ariaLabel: 'Gestionar alumnos',
  },
  {
    name: 'Maestros',
    icon: AcademicCapIcon,
    to: '/admin/teachers',
    ariaLabel: 'Gestionar maestros',
  },
  {
    name: 'Instrumentos',
    icon: MusicalNoteIcon,
    to: '/admin/instruments',
    ariaLabel: 'Gestionar instrumentos',
  },
  {
    name: 'Montaje',
    icon: SparklesIcon,
    to: '/montaje',
    ariaLabel: 'Gestión de montaje musical',
  },
  {
    name: 'Analytics',
    icon: ChartBarIcon,
    to: '/admin/analytics',
    ariaLabel: 'Ver análisis',
  },
  {
    name: 'Attendance',
    icon: ClipboardDocumentCheckIcon,
    to: '/admin/reporteAsistenciaDiaria',
    ariaLabel: 'Gestionar asistencias',
  },
  {
    name: 'Observaciones',
    icon: ChatBubbleLeftRightIcon,
    to: '/attendance/observations',
    ariaLabel: 'Ver todas las observaciones de clase',
  },
  {
    name: 'Clases',
    icon: BookOpenIcon,
    to: '/admin/classes',
    ariaLabel: 'Gestionar clases',
  },
  {
    name: 'Horarios',
    icon: CalendarDaysIcon,
    to: '/admin/schedules',
    ariaLabel: 'Gestionar horarios',
  },
  {
    name: 'Perfil',
    icon: UserCircleIcon,
    to: '/profile',
    ariaLabel: 'Mi perfil',
  },
];
