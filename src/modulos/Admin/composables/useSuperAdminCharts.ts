import { ref, computed, watch } from 'vue';
import { useSuperAdminData } from './useSuperAdminData';

/**
 * Composable para generar y manejar todos los gráficos y analytics
 * del dashboard del Super Administrador
 */
export function useSuperAdminCharts() {
  const { students, teachers, classes, kpis } = useSuperAdminData();

  // Configuraciones de tema para los gráficos
  const chartTheme = ref({
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      gradient: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
    },
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      background: 'transparent',
    },
  });

  // Chart: Distribución de estudiantes por instrumento
  const instrumentDistributionChart = computed(() => {
    const distribution = {};
    students.value.forEach((student) => {
      if (student.instrumento) {
        distribution[student.instrumento] = (distribution[student.instrumento] || 0) + 1;
      }
    });

    const data = Object.entries(distribution)
      .map(([instrument, count]) => ({ name: instrument, value: count }))
      .sort((a, b) => b.value - a.value);

    return {
      type: 'doughnut',
      data: {
        labels: data.map((item) => item.name),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: chartTheme.value.colors.gradient,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
          },
        },
      },
    };
  });

  // Chart: Tendencia de inscripciones mensuales
  const enrollmentTrendChart = computed(() => {
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const currentMonth = new Date().getMonth();

    // TODO: Obtener datos reales de inscripciones por mes del store o API
    const enrollmentData = months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      students: 0, // Reemplazar con datos reales
      revenue: 0, // Reemplazar con datos reales
    }));

    return {
      type: 'line',
      data: {
        labels: enrollmentData.map((item) => item.month),
        datasets: [
          {
            label: 'Nuevos Estudiantes',
            data: enrollmentData.map((item) => item.students),
            borderColor: chartTheme.value.colors.primary,
            backgroundColor: `${chartTheme.value.colors.primary}20`,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: chartTheme.value.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
            },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
        },
      },
    };
  });

  // Chart: Ingresos mensuales
  const revenueChart = computed(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    // TODO: Obtener datos reales de ingresos mensuales del store o API
    const revenueData = months.map(() => 0); // Reemplazar con datos reales

    return {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ingresos ($)',
            data: revenueData,
            backgroundColor: chartTheme.value.colors.success,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
            callbacks: {
              label: (context) => `Ingresos: $${context.parsed.y.toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
              callback: (value) => `$${(value / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    };
  });

  // Chart: Asistencia por clase
  const attendanceChart = computed(() => {
    // TODO: Obtener datos reales de asistencia por clase del store o API
    const attendanceData = classes.value.slice(0, 10).map((cls) => ({
      name: cls.nombre || 'Clase sin nombre',
      attendance: 0, // Reemplazar con datos reales
    }));

    return {
      type: 'horizontalBar',
      data: {
        labels: attendanceData.map((item) => item.name),
        datasets: [
          {
            label: 'Asistencia (%)',
            data: attendanceData.map((item) => item.attendance),
            backgroundColor: attendanceData.map((item) =>
              item.attendance >= 90
                ? chartTheme.value.colors.success
                : item.attendance >= 75
                  ? chartTheme.value.colors.warning
                  : chartTheme.value.colors.danger,
            ),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
              callback: (value) => `${value}%`,
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily, size: 10 },
            },
          },
        },
      },
    };
  });

  // Chart: Distribución de edades
  const ageDistributionChart = computed(() => {
    const ageRanges = {
      '5-10': 0,
      '11-15': 0,
      '16-20': 0,
      '21-30': 0,
      '31-40': 0,
      '40+': 0,
    };

    students.value.forEach((student) => {
      const age = student.edad || student.ageCalculated || 0;
      if (age >= 5 && age <= 10) ageRanges['5-10']++;
      else if (age >= 11 && age <= 15) ageRanges['11-15']++;
      else if (age >= 16 && age <= 20) ageRanges['16-20']++;
      else if (age >= 21 && age <= 30) ageRanges['21-30']++;
      else if (age >= 31 && age <= 40) ageRanges['31-40']++;
      else if (age > 40) ageRanges['40+']++;
    });

    return {
      type: 'radar',
      data: {
        labels: Object.keys(ageRanges),
        datasets: [
          {
            label: 'Distribución de Edades',
            data: Object.values(ageRanges),
            backgroundColor: `${chartTheme.value.colors.info}30`,
            borderColor: chartTheme.value.colors.info,
            pointBackgroundColor: chartTheme.value.colors.info,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            pointLabels: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
        },
      },
    };
  });

  // Chart: Performance de maestros
  const teacherPerformanceChart = computed(() => {
    // TODO: Obtener datos reales de rendimiento de maestros del store o API
    const teacherData = teachers.value.slice(0, 8).map((teacher) => ({
      name: `${teacher.nombre} ${teacher.apellido}`,
      students: 0, // Reemplazar con datos reales
      rating: 0, // Reemplazar con datos reales
    }));

    return {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Maestros',
            data: teacherData.map((teacher, index) => ({
              x: teacher.students,
              y: parseFloat(teacher.rating),
              label: teacher.name,
            })),
            backgroundColor: chartTheme.value.colors.secondary,
            borderColor: chartTheme.value.colors.secondary,
            pointRadius: 8,
            pointHoverRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
            callbacks: {
              title: () => '',
              label: (context) => {
                const point = context.raw;
                return [point.label, `Estudiantes: ${point.x}`, `Rating: ${point.y}/5`];
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Número de Estudiantes',
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Rating (1-5)',
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
            min: 1,
            max: 5,
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#6b7280',
              font: { family: chartTheme.value.style.fontFamily },
            },
          },
        },
      },
    };
  });

  // Analytics avanzados
  const advancedAnalytics = computed(() => {
    const totalStudents = students.value.length;
    const activeStudents = students.value.filter((s) => s.status === 'Activo').length;

    return {
      conversion: {
        title: 'Tasa de Conversión',
        value: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
        suffix: '%',
        trend: 'N/A', // TODO: Obtener tendencia real
        change: 'N/A', // TODO: Obtener cambio real
      },
      retention: {
        title: 'Retención Mensual',
        value: 0, // TODO: Obtener valor real
        suffix: '%',
        trend: 'N/A', // TODO: Obtener tendencia real
        change: 'N/A', // TODO: Obtener cambio real
      },
      satisfaction: {
        title: 'Satisfacción',
        value: 0, // TODO: Obtener valor real
        suffix: '/5',
        trend: 'N/A', // TODO: Obtener tendencia real
        change: 'N/A', // TODO: Obtener cambio real
      },
      growth: {
        title: 'Crecimiento',
        value: 0, // TODO: Obtener valor real
        suffix: '%',
        trend: 'N/A', // TODO: Obtener tendencia real
        change: 'N/A', // TODO: Obtener cambio real
      },
    };
  });

  // Exportar datos de gráficos
  const exportChartData = (chartType: string) => {
    const data = {
      timestamp: new Date().toISOString(),
      chartType,
      data: getChartData(chartType),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-data-${chartType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getChartData = (chartType: string) => {
    switch (chartType) {
    case 'instruments':
      return instrumentDistributionChart.value.data;
    case 'enrollment':
      return enrollmentTrendChart.value.data;
    case 'revenue':
      return revenueChart.value.data;
    case 'attendance':
      return attendanceChart.value.data;
    case 'age':
      return ageDistributionChart.value.data;
    case 'teachers':
      return teacherPerformanceChart.value.data;
    default:
      return null;
    }
  };

  return {
    // Chart configurations
    instrumentDistributionChart,
    enrollmentTrendChart,
    revenueChart,
    attendanceChart,
    ageDistributionChart,
    teacherPerformanceChart,

    // Analytics
    advancedAnalytics,

    // Theme and customization
    chartTheme,

    // Utils
    exportChartData,
  };
}
