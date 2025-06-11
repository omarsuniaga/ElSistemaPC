// src/modulos/Superusuario/constants/menuItems.ts

import { 
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon
} from '@heroicons/vue/24/outline';

export const superusuarioMenuItems = [
  {
    name: 'Dashboard',
    icon: ChartBarIcon,
    to: '/superusuario/dashboard',
    ariaLabel: 'Panel de Superusuario'
  },
  {
    name: 'Usuarios',
    icon: UserGroupIcon,
    to: '/superusuario/users',
    ariaLabel: 'Gestión de Usuarios'
  },
  {
    name: 'Roles',
    icon: ShieldCheckIcon,
    to: '/superusuario/roles',
    ariaLabel: 'Configuración de Roles'
  },
  {
    name: 'Permisos',
    icon: Cog6ToothIcon,
    to: '/superusuario/permissions',
    ariaLabel: 'Gestión de Permisos'
  },
  {
    name: 'Sistema',
    icon: ComputerDesktopIcon,
    to: '/superusuario/system',
    ariaLabel: 'Configuración del Sistema'
  },
  {
    name: 'Auditoría',
    icon: ClipboardDocumentListIcon,
    to: '/superusuario/audit',
    ariaLabel: 'Auditoría del Sistema'
  },
  {
    name: 'Respaldo',
    icon: CloudArrowUpIcon,
    to: '/superusuario/backup',
    ariaLabel: 'Respaldo y Restauración'
  }
];

export default superusuarioMenuItems;
