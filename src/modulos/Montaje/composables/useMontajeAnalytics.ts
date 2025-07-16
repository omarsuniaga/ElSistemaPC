import type { EvaluacionContinua, Obra, PlanAccion } from '../types';

/**
 * Composable para analytics y métricas del módulo Montaje
 * Proporciona funcionalidades de análisis de rendimiento y KPIs
 */
export function useMontajeAnalytics() {
  // Métricas de tiempo
  const calculateTimeMetrics = (obras: Obra[], planes: PlanAccion[]) => {
    const now = new Date();

    // Obras por período
    const obrasThisMonth = obras.filter((obra) => {
      const obraDate = new Date(obra.fechaCreacion.toDate());
      return obraDate.getMonth() === now.getMonth() && obraDate.getFullYear() === now.getFullYear();
    });

    const obrasThisWeek = obras.filter((obra) => {
      const obraDate = new Date(obra.fechaCreacion.toDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return obraDate >= weekStart;
    });

    // Planes por período
    const planesActivos = planes.filter((plan) => {
      const fechaFin = new Date(plan.fechaFinPlaneada.toDate());
      return fechaFin > now;
    });

    const planesCompletados = obras.filter((obra) => obra.metadatos.progresoPorcentaje === 100);

    // Tiempo promedio de finalización
    const obrasCompletadas = obras.filter((obra) => obra.metadatos.progresoPorcentaje === 100);
    const averageCompletionTime =
      obrasCompletadas.length > 0
        ? obrasCompletadas.reduce((sum, obra) => {
          const start = new Date(obra.fechaCreacion.toDate());
          const end = obra.fechaFinMontaje ? new Date(obra.fechaFinMontaje.toDate()) : new Date();
          return sum + (end.getTime() - start.getTime());
        }, 0) /
          obrasCompletadas.length /
          (1000 * 60 * 60 * 24) // días
        : 0;

    return {
      obrasThisMonth: obrasThisMonth.length,
      obrasThisWeek: obrasThisWeek.length,
      planesActivos: planesActivos.length,
      planesCompletados: planesCompletados.length,
      totalObras: obras.length,
      obrasCompletadas: obrasCompletadas.length,
      averageCompletionDays: Math.round(averageCompletionTime),
    };
  };
  // Métricas de evaluación
  const calculateEvaluationMetrics = (evaluaciones: EvaluacionContinua[]) => {
    if (evaluaciones.length === 0) {
      return {
        averageScore: 0,
        totalEvaluaciones: 0,
        scoreDistribution: {},
        recentTrend: 'neutral' as 'up' | 'down' | 'neutral',
      };
    }

    const averageScore =
      evaluaciones.reduce((sum, evaluacion) => sum + evaluacion.metadatos.puntuacionTotal, 0) /
      evaluaciones.length;

    // Distribución de puntuaciones
    const scoreDistribution = evaluaciones.reduce(
      (acc, evaluacion) => {
        const scoreRange = Math.floor(evaluacion.metadatos.puntuacionTotal / 20) * 20; // 0-19, 20-39, etc.
        const key = `${scoreRange}-${scoreRange + 19}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Tendencia reciente (últimas 10 evaluaciones vs anteriores)
    const sortedEvaluaciones = [...evaluaciones].sort(
      (a, b) => new Date(b.fecha.toDate()).getTime() - new Date(a.fecha.toDate()).getTime(),
    );

    const recent = sortedEvaluaciones.slice(0, Math.min(10, sortedEvaluaciones.length));
    const previous = sortedEvaluaciones.slice(10, Math.min(20, sortedEvaluaciones.length));

    let recentTrend: 'up' | 'down' | 'neutral' = 'neutral';
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg =
        recent.reduce((sum, evaluation) => sum + evaluation.metadatos.puntuacionTotal, 0) /
        recent.length;
      const previousAvg =
        previous.reduce((sum, evaluation) => sum + evaluation.metadatos.puntuacionTotal, 0) /
        previous.length;

      if (recentAvg > previousAvg + 5) recentTrend = 'up';
      else if (recentAvg < previousAvg - 5) recentTrend = 'down';
    }

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      totalEvaluaciones: evaluaciones.length,
      scoreDistribution,
      recentTrend,
    };
  };

  // Métricas de progreso
  const calculateProgressMetrics = (obras: Obra[]) => {
    const progressDistribution = obras.reduce(
      (acc, obra) => {
        const progressRange = Math.floor(obra.metadatos.progresoPorcentaje / 25) * 25; // 0-24, 25-49, etc.
        const key = `${progressRange}-${progressRange + 24}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Obras en progreso vs completadas
    const inProgress = obras.filter(
      (obra) => obra.metadatos.progresoPorcentaje > 0 && obra.metadatos.progresoPorcentaje < 100,
    ).length;

    const completed = obras.filter((obra) => obra.metadatos.progresoPorcentaje === 100).length;

    const notStarted = obras.filter((obra) => obra.metadatos.progresoPorcentaje === 0).length;

    return {
      progressDistribution,
      inProgress,
      completed,
      notStarted,
      averageProgress:
        obras.length > 0
          ? obras.reduce((sum, obra) => sum + obra.metadatos.progresoPorcentaje, 0) / obras.length
          : 0,
    };
  };

  // KPIs institucionales
  const calculateInstitutionalKPIs = (
    obras: Obra[],
    planes: PlanAccion[],
    evaluaciones: EvaluacionContinua[],
  ) => {
    const timeMetrics = calculateTimeMetrics(obras, planes);
    const evaluationMetrics = calculateEvaluationMetrics(evaluaciones);
    const progressMetrics = calculateProgressMetrics(obras);

    // Eficiencia de completación
    const completionEfficiency =
      timeMetrics.totalObras > 0 ? (timeMetrics.obrasCompletadas / timeMetrics.totalObras) * 100 : 0;

    // Calidad promedio
    const qualityScore = evaluationMetrics.averageScore;

    // Productividad (obras por semana)
    const productivity = timeMetrics.obrasThisWeek;

    // Progreso general
    const overallProgress = progressMetrics.averageProgress;

    return {
      completionEfficiency: Math.round(completionEfficiency),
      qualityScore: Math.round(qualityScore * 10) / 10,
      productivity,
      overallProgress: Math.round(overallProgress),
      averageCompletionDays: timeMetrics.averageCompletionDays,
      evaluationTrend: evaluationMetrics.recentTrend,
      planesActivos: timeMetrics.planesActivos,
      totalEvaluaciones: evaluationMetrics.totalEvaluaciones,
    };
  };

  // Comparación temporal
  const calculatePeriodComparison = (
    obras: Obra[],
    evaluaciones: EvaluacionContinua[],
    period: 'week' | 'month' | 'quarter',
  ) => {
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (period) {
    case 'week':
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - now.getDay());
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      break;
    case 'month':
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
      break;
    }

    // Obras del período actual
    const currentObras = obras.filter((obra) => {
      const obraDate = new Date(obra.fechaCreacion.toDate());
      return obraDate >= currentStart;
    });

    // Obras del período anterior
    const previousObras = obras.filter((obra) => {
      const obraDate = new Date(obra.fechaCreacion.toDate());
      return obraDate >= previousStart && obraDate < previousEnd;
    });

    // Evaluaciones del período actual
    const currentEvaluaciones = evaluaciones.filter((evaluacion) => {
      const evalDate = new Date(evaluacion.fecha.toDate());
      return evalDate >= currentStart;
    });

    // Evaluaciones del período anterior
    const previousEvaluaciones = evaluaciones.filter((evaluacion) => {
      const evalDate = new Date(evaluacion.fecha.toDate());
      return evalDate >= previousStart && evalDate < previousEnd;
    });

    const currentAvgScore =
      currentEvaluaciones.length > 0
        ? currentEvaluaciones.reduce(
          (sum, evaluation) => sum + evaluation.metadatos.puntuacionTotal,
          0,
        ) / currentEvaluaciones.length
        : 0;

    const previousAvgScore =
      previousEvaluaciones.length > 0
        ? previousEvaluaciones.reduce(
          (sum, evaluation) => sum + evaluation.metadatos.puntuacionTotal,
          0,
        ) / previousEvaluaciones.length
        : 0;

    return {
      period,
      current: {
        obras: currentObras.length,
        evaluaciones: currentEvaluaciones.length,
        averageScore: Math.round(currentAvgScore * 10) / 10,
      },
      previous: {
        obras: previousObras.length,
        evaluaciones: previousEvaluaciones.length,
        averageScore: Math.round(previousAvgScore * 10) / 10,
      },
      changes: {
        obras: currentObras.length - previousObras.length,
        evaluaciones: currentEvaluaciones.length - previousEvaluaciones.length,
        averageScore: Math.round((currentAvgScore - previousAvgScore) * 10) / 10,
      },
    };
  };

  // Datos para gráficos
  const generateChartData = (
    obras: Obra[],
    evaluaciones: EvaluacionContinua[],
    chartType: 'timeline' | 'distribution' | 'comparison',
  ) => {
    switch (chartType) {
    case 'timeline':
      return generateTimelineChart(obras, evaluaciones);
    case 'distribution':
      return generateDistributionChart(evaluaciones);
    case 'comparison':
      return generateComparisonChart(obras);
    default:
      return null;
    }
  };

  const generateTimelineChart = (obras: Obra[], evaluaciones: EvaluacionContinua[]) => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month: date.toLocaleString('es', { month: 'short', year: 'numeric' }),
        obras: 0,
        evaluaciones: 0,
        averageScore: 0,
      };
    });

    obras.forEach((obra) => {
      const obraDate = new Date(obra.fechaCreacion.toDate());
      const monthIndex = last12Months.findIndex((month) => {
        const [monthName, year] = month.month.split(' ');
        const monthDate = new Date(`${monthName} 1, ${year}`);
        return (
          monthDate.getMonth() === obraDate.getMonth() &&
          monthDate.getFullYear() === obraDate.getFullYear()
        );
      });
      if (monthIndex !== -1) {
        last12Months[monthIndex].obras++;
      }
    });

    evaluaciones.forEach((evaluacion) => {
      const evalDate = new Date(evaluacion.fecha.toDate());
      const monthIndex = last12Months.findIndex((month) => {
        const [monthName, year] = month.month.split(' ');
        const monthDate = new Date(`${monthName} 1, ${year}`);
        return (
          monthDate.getMonth() === evalDate.getMonth() &&
          monthDate.getFullYear() === evalDate.getFullYear()
        );
      });
      if (monthIndex !== -1) {
        last12Months[monthIndex].evaluaciones++;
        last12Months[monthIndex].averageScore =
          (last12Months[monthIndex].averageScore + evaluacion.metadatos.puntuacionTotal) / 2;
      }
    });

    return last12Months;
  };

  const generateDistributionChart = (evaluaciones: EvaluacionContinua[]) => {
    const scoreRanges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    return scoreRanges.map((range) => {
      const [min, max] = range.split('-').map(Number);
      const count = evaluaciones.filter(
        (evaluacion) =>
          evaluacion.metadatos.puntuacionTotal >= min && evaluacion.metadatos.puntuacionTotal <= max,
      ).length;

      return {
        range,
        count,
        percentage: evaluaciones.length > 0 ? (count / evaluaciones.length) * 100 : 0,
      };
    });
  };

  const generateComparisonChart = (obras: Obra[]) => {
    const progressRanges = {
      'Sin iniciar': obras.filter((obra) => obra.metadatos.progresoPorcentaje === 0).length,
      'En progreso': obras.filter(
        (obra) => obra.metadatos.progresoPorcentaje > 0 && obra.metadatos.progresoPorcentaje < 100,
      ).length,
      Completadas: obras.filter((obra) => obra.metadatos.progresoPorcentaje === 100).length,
    };

    return Object.entries(progressRanges).map(([status, count]) => ({
      status,
      count,
      percentage: obras.length > 0 ? (count / obras.length) * 100 : 0,
    }));
  };

  return {
    calculateTimeMetrics,
    calculateEvaluationMetrics,
    calculateProgressMetrics,
    calculateInstitutionalKPIs,
    calculatePeriodComparison,
    generateChartData,
    generateTimelineChart,
    generateDistributionChart,
    generateComparisonChart,
  };
}
