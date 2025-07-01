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
} from "@heroicons/vue/24/outline"

// Menú para maestros: rutas que comienzan con "/teacher"
// (asegurándose de que las rutas coincidan con las definidas en el router)
export const teacherMenuItems = [
  {
    name: "Dashboard",
    icon: HomeIcon,
    to: "/teacher",
    ariaLabel: "Panel de control del maestro",
  },
  // {
  //   name: 'Notificaciones',
  //   icon: BellIcon,
  //   to: '/teacher/notifications',
  //   ariaLabel: 'Ver notificaciones'
  // },
  {
    name: "Attendance",
    icon: ClipboardDocumentCheckIcon,
    to: "/teacher/attendance",
    ariaLabel: "Gestionar asistencias",
  },
  {
    name: "Montaje",
    icon: SparklesIcon,
    to: "/montaje",
    ariaLabel: "Gestión de montaje musical",
  },
  {
    name: "Horarios",
    icon: ClockIcon,
    to: "/teacher/schedule",
    ariaLabel: "Ver horarios",
  },
  // {
  //   name: 'Alumnos',
  //   icon: UserGroupIcon,
  //   to: '/students',
  //   ariaLabel: 'Gestionar alumnos'
  // },
]

// Menú para directores/administradores: rutas que coinciden con las definidas en el router
export const adminMenuItems = [
  {
    name: "Inicio",
    icon: HomeIcon,
    to: "/",
    ariaLabel: "Panel de control",
  },
  {
    name: "Alumnos",
    icon: UserGroupIcon,
    to: "/students",
    ariaLabel: "Gestionar alumnos",
  },
  {
    name: "Maestros",
    icon: AcademicCapIcon,
    to: "/teachers",
    ariaLabel: "Gestionar maestros",
  },
  {
    name: "Instrumentos",
    icon: MusicalNoteIcon,
    to: "/instrumentos",
    ariaLabel: "Gestionar instrumentos",
  },
  {
    name: "Montaje",
    icon: SparklesIcon,
    to: "/montaje",
    ariaLabel: "Gestión de montaje musical",
  },
  {
    name: "Analytics",
    icon: ChartBarIcon,
    to: "/analytics",
    ariaLabel: "Ver análisis",
  },
  {
    name: "Attendance",
    icon: ClipboardDocumentCheckIcon,
    to: "/teacher/attendance",
    ariaLabel: "Gestionar asistencias",
  },
  {
    name: "Observaciones",
    icon: ChatBubbleLeftRightIcon,
    to: "/attendance/observations",
    ariaLabel: "Ver todas las observaciones de clase",
  },
  {
    name: "Clases",
    icon: BookOpenIcon,
    to: "/classes",
    ariaLabel: "Gestionar clases",
  },
  {
    name: "Horarios",
    icon: CalendarDaysIcon,
    to: "/schedule",
    ariaLabel: "Gestionar horarios",
  },
  {
    name: "Perfil",
    icon: UserCircleIcon,
    to: "/profile",
    ariaLabel: "Mi perfil",
  },
]
