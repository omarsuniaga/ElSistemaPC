import { ref } from 'vue';
import { useRouter } from 'vue-router';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'student' | 'teacher' | 'class' | 'report' | 'setting';
  path: string;
  metadata?: Record<string, any>;
}

interface SearchCategory {
  type: string;
  label: string;
  results: SearchResult[];
}

export function useGlobalSearch() {
  const router = useRouter();
  const isSearching = ref(false);
  const searchResults = ref<SearchCategory[]>([]);
  const recentSearches = ref<string[]>([]);

  // Mock search data - replace with real API calls
  const searchableItems: SearchResult[] = [
    // Students
    {
      id: 'student-1',
      title: 'Juan Pérez',
      description: 'Estudiante de Piano - Nivel Intermedio',
      type: 'student',
      path: '/admin/students/1'
    },
    {
      id: 'student-2',
      title: 'María García',
      description: 'Estudiante de Violín - Nivel Básico',
      type: 'student',
      path: '/admin/students/2'
    },
    // Teachers
    {
      id: 'teacher-1',
      title: 'Prof. Carlos Martínez',
      description: 'Profesor de Piano y Teoría Musical',
      type: 'teacher',
      path: '/admin/teachers/1'
    },
    {
      id: 'teacher-2',
      title: 'Prof. Ana López',
      description: 'Profesora de Violín y Canto',
      type: 'teacher',
      path: '/admin/teachers/2'
    },
    // Classes
    {
      id: 'class-1',
      title: 'Piano Básico - Grupo A',
      description: 'Martes y Jueves 16:00 - 17:00',
      type: 'class',
      path: '/admin/classes/1'
    },
    {
      id: 'class-2',
      title: 'Violín Intermedio',
      description: 'Lunes y Miércoles 14:00 - 15:00',
      type: 'class',
      path: '/admin/classes/2'
    },
    // Reports
    {
      id: 'report-1',
      title: 'Reporte de Asistencias',
      description: 'Visualizar asistencias por período',
      type: 'report',
      path: '/admin/reports/attendance'
    },
    {
      id: 'report-2',
      title: 'Reporte Académico',
      description: 'Progreso académico de estudiantes',
      type: 'report',
      path: '/admin/reports/academic'
    },
    // Settings
    {
      id: 'setting-1',
      title: 'Configuración General',
      description: 'Ajustes generales del sistema',
      type: 'setting',
      path: '/admin/settings'
    },
    {
      id: 'setting-2',
      title: 'Mi Perfil',
      description: 'Editar información personal',
      type: 'setting',
      path: '/admin/profile'
    }
  ];

  const performGlobalSearch = async (query: string) => {
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;

    try {
      // Add to recent searches
      if (!recentSearches.value.includes(query)) {
        recentSearches.value.unshift(query);
        if (recentSearches.value.length > 5) {
          recentSearches.value.pop();
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filter items based on query
      const filteredResults = searchableItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

      // Group results by type
      const categorizedResults: SearchCategory[] = [];
      
      const categoryLabels = {
        student: 'Estudiantes',
        teacher: 'Profesores',
        class: 'Clases',
        report: 'Reportes',
        setting: 'Configuración'
      };

      Object.entries(categoryLabels).forEach(([type, label]) => {
        const results = filteredResults.filter(item => item.type === type);
        if (results.length > 0) {
          categorizedResults.push({
            type,
            label,
            results
          });
        }
      });

      searchResults.value = categorizedResults;
    } catch (error) {
      console.error('Error performing global search:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const navigateToResult = (result: SearchResult) => {
    router.push(result.path);
    clearSearchResults();
  };

  const clearSearchResults = () => {
    searchResults.value = [];
  };

  const clearRecentSearches = () => {
    recentSearches.value = [];
  };

  const getSearchResultIcon = (type: string) => {
    const icons = {
      student: 'UserIcon',
      teacher: 'AcademicCapIcon',
      class: 'BookOpenIcon',
      report: 'ChartBarIcon',
      setting: 'CogIcon'
    };
    return icons[type as keyof typeof icons] || 'DocumentIcon';
  };

  const getQuickActions = () => {
    return [
      {
        id: 'create-student',
        title: 'Crear Estudiante',
        description: 'Agregar nuevo estudiante',
        path: '/admin/students/create',
        icon: 'PlusIcon'
      },
      {
        id: 'create-class',
        title: 'Crear Clase',
        description: 'Programar nueva clase',
        path: '/admin/classes/create',
        icon: 'PlusIcon'
      },
      {
        id: 'attendance-report',
        title: 'Reporte Asistencias',
        description: 'Ver asistencias del día',
        path: '/admin/reports/attendance',
        icon: 'ClipboardDocumentCheckIcon'
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Ir al panel principal',
        path: '/admin',
        icon: 'HomeIcon'
      }
    ];
  };

  return {
    isSearching,
    searchResults,
    recentSearches,
    performGlobalSearch,
    navigateToResult,
    clearSearchResults,
    clearRecentSearches,
    getSearchResultIcon,
    getQuickActions
  };
}