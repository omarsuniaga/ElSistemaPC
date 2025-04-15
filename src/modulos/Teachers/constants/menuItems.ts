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
  DocumentTextIcon,
  DocumentChartBarIcon
} from '@heroicons/vue/24/outline'

// Menú para maestros: rutas que comienzan con "/teacher" 
// (asegurándose de que las rutas coincidan con las definidas en el router)
export const teacherMenuItems = [
  { 
    name: 'Dashboard', 
    icon: HomeIcon, 
    to: '/teacher', 
    ariaLabel: 'Panel de control del maestro'
  },  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/teacher/attendance/calendar', 
    ariaLabel: 'Gestionar asistencias'
  },
  { 
    name: 'Horarios', 
    icon: ClockIcon, 
    to: '/teacher/schedule', 
    ariaLabel: 'Ver horarios'
  },
  { 
    name: 'Alumnos', 
    icon: UserGroupIcon, 
    to: '/students', 
    ariaLabel: 'Gestionar alumnos'
  },
]

// Menú para directores/administradores: rutas que coinciden con las definidas en el router
export const adminMenuItems = [
  { 
    name: 'Inicio', 
    icon: HomeIcon, 
    to: '/', 
    ariaLabel: 'Panel de control'
  },
  { 
    name: 'Alumnos', 
    icon: UserGroupIcon, 
    to: '/students', 
    ariaLabel: 'Gestionar alumnos'
  },
  { 
    name: 'Maestros', 
    icon: AcademicCapIcon, 
    to: '/teachers', 
    ariaLabel: 'Gestionar maestros'
  },
  { 
    name: 'Instrumentos', 
    icon: MusicalNoteIcon, 
    to: '/instrumentos', 
    ariaLabel: 'Gestionar instrumentos' 
  },
  { 
    name: 'Analytics', 
    icon: ChartBarIcon, 
    to: '/analytics', 
    ariaLabel: 'Ver análisis'
  },  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/attendance/calendar',
    ariaLabel: 'Gestionar asistencias'
  },
  { 
    name: 'Clases', 
    icon: BookOpenIcon, 
    to: '/classes', 
    ariaLabel: 'Gestionar clases'
  },
  { 
    name: 'Horarios', 
    icon: CalendarDaysIcon, 
    to: '/schedule', 
    ariaLabel: 'Gestionar horarios'
  },
  { 
    name: 'Perfil', 
    icon: UserCircleIcon, 
    to: '/profile', 
    ariaLabel: 'Mi perfil'
  }
]
