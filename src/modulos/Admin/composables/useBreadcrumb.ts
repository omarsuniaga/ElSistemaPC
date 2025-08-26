import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface BreadcrumbItem {
  name: string;
  path?: string;
  disabled?: boolean;
}

export function useBreadcrumb() {
  const route = useRoute();

  const breadcrumbItems = computed((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        name: 'Dashboard',
        path: '/admin'
      }
    ];

    const pathSegments = route.path.split('/').filter(segment => segment);
    
    // Remove 'admin' from segments as it's already in the home item
    const adminIndex = pathSegments.indexOf('admin');
    if (adminIndex !== -1) {
      pathSegments.splice(adminIndex, 1);
    }

    let currentPath = '/admin';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Generate breadcrumb name based on segment
      let name = '';
      
      switch (segment) {
        case 'students':
          name = 'Estudiantes';
          break;
        case 'classes':
          name = 'Clases';
          break;
        case 'teachers':
          name = 'Profesores';
          break;
        case 'attendance':
          name = 'Asistencias';
          break;
        case 'reports':
          name = 'Reportes';
          break;
        case 'settings':
          name = 'Configuración';
          break;
        case 'profile':
          name = 'Mi Perfil';
          break;
        case 'notifications':
          name = 'Notificaciones';
          break;
        case 'create':
          name = 'Crear';
          break;
        case 'edit':
          name = 'Editar';
          break;
        case 'view':
          name = 'Ver';
          break;
        case 'weekly':
          name = 'Semanal';
          break;
        default:
          // If it's an ID (numbers), use generic name
          if (/^\d+$/.test(segment)) {
            name = 'Detalle';
          } else {
            // Capitalize first letter and replace hyphens/underscores with spaces
            name = segment
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
          }
      }

      // For the last item, make it disabled (current page)
      const isLastItem = index === pathSegments.length - 1;
      
      items.push({
        name,
        path: isLastItem ? undefined : currentPath,
        disabled: isLastItem
      });
    });

    return items;
  });

  // Helper function to update breadcrumb with custom items
  const setBreadcrumb = (customItems: BreadcrumbItem[]) => {
    return customItems;
  };

  return {
    breadcrumbItems,
    setBreadcrumb
  };
}