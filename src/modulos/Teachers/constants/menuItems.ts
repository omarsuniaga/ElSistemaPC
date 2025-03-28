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
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

// Menú para maestros: rutas que comienzan con "/teacher"
export const teacherMenuItems = [
  { 
    name: 'Inicio', 
    icon: HomeIcon, 
    to: '/teacher', 
    ariaLabel: 'Panel de control del maestro'
  },
  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/teacher/attendance', 
    ariaLabel: 'Gestionar asistencias'
  },
  { 
    name: 'Horarios', 
    icon: ClockIcon, 
    to: '/teacher/schedule', 
    ariaLabel: 'Ver horarios'
  },
  { 
    name: 'Perfil', 
    icon: UserCircleIcon, 
    to: '/teacher/profile', 
    ariaLabel: 'Mi perfil'
  }
]

// Menú para directores/administradores: rutas que comienzan con "/teachers/admin"
// (O ajusta las rutas según tu convención)
export const adminMenuItems = [
  { 
    name: 'Inicio', 
    icon: HomeIcon, 
    to: '/teachers/admin', 
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
    to: '/teachers/admin', 
    ariaLabel: 'Gestionar maestros'
  },
  { 
    name: 'Instrumentos', 
    icon: MusicalNoteIcon, 
    to: '/instruments', 
    ariaLabel: 'Gestionar instrumentos'
  },
  { 
    name: 'Analytics', 
    icon: ChartBarIcon, 
    to: '/analytics', 
    ariaLabel: 'Ver análisis'
  },
  { 
    name: 'Asistencias', 
    icon: ClipboardDocumentCheckIcon, 
    to: '/attendance', 
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
