import type { 
  StudentPerformance, 
  AttendanceMetrics, 
  RepertoireMetrics, 
  WorkMetrics, 
  TeacherObservations,
  PerformanceWeights,
  PositiveComment,
  BehaviorRating
} from '../types/performance';
import { DEFAULT_WEIGHTS, PERFORMANCE_THRESHOLDS, POSITIVE_COMMENT_CATEGORIES } from '../types/performance';

export class PerformanceAnalysisService {
  
  /**
   * Calcula las métricas de asistencia de un estudiante
   */
  static calculateAttendanceMetrics(attendanceRecords: any[]): AttendanceMetrics {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        totalClasses: 0,
        attendedClasses: 0,
        punctuality: 0,
        attendanceRate: 0,
        consistencyScore: 0
      };
    }

    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter(record => 
      record.status === 'presente' || record.status === 'tardanza'
    ).length;
    
    const punctualClasses = attendanceRecords.filter(record => 
      record.status === 'presente'
    ).length;
    
    const attendanceRate = (attendedClasses / totalClasses) * 100;
    const punctuality = totalClasses > 0 ? (punctualClasses / totalClasses) * 100 : 0;
    
    // Calcular consistencia (penalizar ausencias consecutivas)
    let consistencyScore = 100;
    let consecutiveAbsences = 0;
    
    for (const record of attendanceRecords) {
      if (record.status === 'ausente') {
        consecutiveAbsences++;
        if (consecutiveAbsences > 2) {
          consistencyScore -= 5; // Penalizar ausencias consecutivas
        }
      } else {
        consecutiveAbsences = 0;
      }
    }
    
    return {
      totalClasses,
      attendedClasses,
      punctuality: Math.round(punctuality),
      attendanceRate: Math.round(attendanceRate),
      consistencyScore: Math.max(0, Math.round(consistencyScore))
    };
  }

  /**
   * Calcula las métricas de repertorio/montajes
   */
  static calculateRepertoireMetrics(montajes: any[]): RepertoireMetrics {
    if (!montajes || montajes.length === 0) {
      return {
        totalMontajes: 0,
        completedMontajes: 0,
        averageScore: 0,
        technicalProficiency: 0,
        musicalExpression: 0,
        stagePresence: 0
      };
    }

    const totalMontajes = montajes.length;
    const completedMontajes = montajes.filter(m => m.status === 'completado').length;
    
    const scores = montajes
      .filter(m => m.evaluacion && typeof m.evaluacion.total === 'number')
      .map(m => m.evaluacion.total);
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Calcular métricas específicas si están disponibles
    const technicalScores = montajes
      .filter(m => m.evaluacion?.tecnica)
      .map(m => m.evaluacion.tecnica);
    
    const expressionScores = montajes
      .filter(m => m.evaluacion?.expresion)
      .map(m => m.evaluacion.expresion);
    
    const presenceScores = montajes
      .filter(m => m.evaluacion?.presencia)
      .map(m => m.evaluacion.presencia);

    return {
      totalMontajes,
      completedMontajes,
      averageScore: Math.round(averageScore),
      technicalProficiency: technicalScores.length > 0 
        ? Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length)
        : 0,
      musicalExpression: expressionScores.length > 0
        ? Math.round(expressionScores.reduce((a, b) => a + b, 0) / expressionScores.length)
        : 0,
      stagePresence: presenceScores.length > 0
        ? Math.round(presenceScores.reduce((a, b) => a + b, 0) / presenceScores.length)
        : 0
    };
  }

  /**
   * Analiza las observaciones positivas de los maestros
   */
  static analyzeTeacherObservations(observations: any[]): TeacherObservations {
    const positiveComments: PositiveComment[] = [];
    const behaviorRatings: BehaviorRating[] = [];
    
    // Procesar observaciones y extraer comentarios positivos
    observations.forEach(obs => {
      if (obs.comentarios && this.isPositiveComment(obs.comentarios)) {
        positiveComments.push({
          id: obs.id || Date.now().toString(),
          teacherId: obs.teacherId || '',
          teacherName: obs.teacherName || 'Maestro',
          classId: obs.classId || '',
          className: obs.className || '',
          date: obs.fecha || new Date().toISOString(),
          category: this.categorizeComment(obs.comentarios),
          comment: obs.comentarios,
          impact: this.assessCommentImpact(obs.comentarios),
          tags: this.extractTags(obs.comentarios)
        });
      }
      
      // Extraer calificaciones de comportamiento si están disponibles
      if (obs.calificaciones) {
        behaviorRatings.push({
          date: obs.fecha || new Date().toISOString(),
          teacherId: obs.teacherId || '',
          classId: obs.classId || '',
          attitude: obs.calificaciones.actitud || 5,
          participation: obs.calificaciones.participacion || 5,
          respect: obs.calificaciones.respeto || 5,
          responsibility: obs.calificaciones.responsabilidad || 5
        });
      }
    });

    return {
      positiveComments,
      behaviorRatings,
      skillDevelopment: [], // Se puede implementar más tarde
      monthlyProgress: [] // Se puede implementar más tarde
    };
  }

  /**
   * Determina si un comentario es positivo
   */
  private static isPositiveComment(comment: string): boolean {
    const positiveKeywords = [
      'excelente', 'sobresaliente', 'destacado', 'brillante', 'excepcional',
      'mejoró', 'progreso', 'avance', 'superó', 'logró',
      'talentoso', 'hábil', 'técnica impresionante', 'expresivo',
      'liderazgo', 'colaborativo', 'responsable', 'puntual',
      'creativo', 'innovador', 'inspirador'
    ];
    
    const lowerComment = comment.toLowerCase();
    return positiveKeywords.some(keyword => lowerComment.includes(keyword));
  }

  /**
   * Categoriza un comentario positivo
   */
  private static categorizeComment(comment: string): 'técnica' | 'expresión' | 'comportamiento' | 'progreso' | 'liderazgo' | 'creatividad' {
    const lowerComment = comment.toLowerCase();
    
    if (lowerComment.includes('técnica') || lowerComment.includes('habilidad') || lowerComment.includes('destreza')) {
      return 'técnica';
    }
    if (lowerComment.includes('expresión') || lowerComment.includes('emotivo') || lowerComment.includes('interpretación')) {
      return 'expresión';
    }
    if (lowerComment.includes('líder') || lowerComment.includes('liderazgo') || lowerComment.includes('guía')) {
      return 'liderazgo';
    }
    if (lowerComment.includes('creativ') || lowerComment.includes('innovador') || lowerComment.includes('original')) {
      return 'creatividad';
    }
    if (lowerComment.includes('progreso') || lowerComment.includes('mejoró') || lowerComment.includes('avance')) {
      return 'progreso';
    }
    
    return 'comportamiento';
  }

  /**
   * Evalúa el impacto de un comentario
   */
  private static assessCommentImpact(comment: string): 'bajo' | 'medio' | 'alto' {
    const highImpactWords = ['excepcional', 'extraordinario', 'brillante', 'sobresaliente'];
    const mediumImpactWords = ['bueno', 'mejoró', 'progreso', 'destacado'];
    
    const lowerComment = comment.toLowerCase();
    
    if (highImpactWords.some(word => lowerComment.includes(word))) {
      return 'alto';
    }
    if (mediumImpactWords.some(word => lowerComment.includes(word))) {
      return 'medio';
    }
    
    return 'bajo';
  }

  /**
   * Extrae etiquetas relevantes del comentario
   */
  private static extractTags(comment: string): string[] {
    const tags: string[] = [];
    const lowerComment = comment.toLowerCase();
    
    const tagMap = {
      'técnica': ['técnica', 'habilidad', 'destreza'],
      'expresión': ['expresión', 'emotivo', 'interpretación'],
      'liderazgo': ['líder', 'liderazgo', 'guía'],
      'creatividad': ['creativ', 'innovador', 'original'],
      'progreso': ['progreso', 'mejoró', 'avance'],
      'colaboración': ['colabor', 'equipo', 'grupo'],
      'responsabilidad': ['responsable', 'puntual', 'compromiso']
    };
    
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => lowerComment.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  /**
   * Calcula las métricas de trabajo individual y colectivo
   */
  static calculateWorkMetrics(studentData: any): WorkMetrics {
    return {
      individualWork: {
        practiceHours: studentData.practiceHours || 0,
        selfAssessment: studentData.selfAssessment || 5,
        improvementRate: this.calculateImprovementRate(studentData),
        consistentPractice: this.isConsistentPractice(studentData)
      },
      collectiveWork: {
        teamworkScore: studentData.teamworkScore || 5,
        collaborationRating: studentData.collaborationRating || 5,
        leadershipQualities: this.assessLeadership(studentData),
        ensembleSkills: studentData.ensembleSkills || 5
      }
    };
  }

  /**
   * Calcula la tasa de mejora basada en datos históricos
   */
  private static calculateImprovementRate(studentData: any): number {
    // Implementar lógica para calcular mejora basada en evaluaciones pasadas
    return 5; // Placeholder
  }

  /**
   * Determina si el estudiante practica consistentemente
   */
  private static isConsistentPractice(studentData: any): boolean {
    // Implementar lógica basada en registros de práctica
    return true; // Placeholder
  }

  /**
   * Evalúa las cualidades de liderazgo
   */
  private static assessLeadership(studentData: any): number {
    // Implementar lógica basada en observaciones de maestros
    return 5; // Placeholder
  }

  /**
   * Calcula la puntuación final de rendimiento
   */
  static calculateOverallPerformance(
    attendance: AttendanceMetrics,
    repertoire: RepertoireMetrics,
    work: WorkMetrics,
    observations: TeacherObservations,
    weights: PerformanceWeights = DEFAULT_WEIGHTS
  ): StudentPerformance['scores'] {
    
    // Calcular puntuación de asistencia
    const attendanceScore = (
      attendance.attendanceRate * 0.6 +
      attendance.punctuality * 0.3 +
      attendance.consistencyScore * 0.1
    );

    // Calcular puntuación de repertorio
    const repertoireScore = (
      repertoire.averageScore * 0.4 +
      repertoire.technicalProficiency * 0.3 +
      repertoire.musicalExpression * 0.2 +
      repertoire.stagePresence * 0.1
    );

    // Calcular puntuación de trabajo
    const individualScore = (
      work.individualWork.selfAssessment * 2 +
      work.individualWork.improvementRate * 2 +
      (work.individualWork.consistentPractice ? 10 : 0)
    ) * 5; // Convertir a escala 0-100

    const collectiveScore = (
      work.collectiveWork.teamworkScore * 2.5 +
      work.collectiveWork.collaborationRating * 2.5 +
      work.collectiveWork.leadershipQualities * 2.5 +
      work.collectiveWork.ensembleSkills * 2.5
    ); // Ya en escala 0-100

    const workScore = (individualScore + collectiveScore) / 2;

    // Calcular puntuación de observaciones
    const positiveCommentsScore = this.calculatePositiveCommentsScore(observations.positiveComments);
    const behaviorScore = this.calculateBehaviorScore(observations.behaviorRatings);
    const observationsScore = (positiveCommentsScore + behaviorScore) / 2;

    // Calcular puntuación general
    const overallScore = 
      attendanceScore * weights.attendance +
      repertoireScore * weights.repertoire +
      workScore * (weights.individualWork + weights.collectiveWork) +
      observationsScore * weights.teacherObservations;

    return {
      attendanceScore: Math.round(attendanceScore),
      repertoireScore: Math.round(repertoireScore),
      workScore: Math.round(workScore),
      behaviorScore: Math.round(behaviorScore),
      progressScore: Math.round(positiveCommentsScore),
      overallScore: Math.round(Math.min(100, Math.max(0, overallScore)))
    };
  }

  /**
   * Calcula puntuación basada en comentarios positivos
   */
  private static calculatePositiveCommentsScore(comments: PositiveComment[]): number {
    if (comments.length === 0) return 50; // Puntuación neutral

    let totalScore = 0;
    let weightedCount = 0;

    comments.forEach(comment => {
      const categoryWeight = POSITIVE_COMMENT_CATEGORIES.find(c => c.value === comment.category)?.weight || 1;
      const impactMultiplier = comment.impact === 'alto' ? 1.5 : comment.impact === 'medio' ? 1.2 : 1;
      
      const commentScore = 70 + (10 * categoryWeight * impactMultiplier);
      totalScore += commentScore;
      weightedCount += categoryWeight;
    });

    const averageScore = totalScore / Math.max(1, weightedCount);
    return Math.min(100, averageScore);
  }

  /**
   * Calcula puntuación de comportamiento
   */
  private static calculateBehaviorScore(ratings: BehaviorRating[]): number {
    if (ratings.length === 0) return 70; // Puntuación neutral

    const totalRatings = ratings.reduce((sum, rating) => {
      return sum + rating.attitude + rating.participation + rating.respect + rating.responsibility;
    }, 0);

    const averageRating = totalRatings / (ratings.length * 4); // 4 categorías
    return Math.round((averageRating / 10) * 100); // Convertir de escala 1-10 a 0-100
  }

  /**
   * Determina la clasificación del estudiante
   */
  static getPerformanceClassification(overallScore: number): 'excepcional' | 'sobresaliente' | 'bueno' | 'regular' | 'necesita_mejora' {
    if (overallScore >= PERFORMANCE_THRESHOLDS.excepcional) return 'excepcional';
    if (overallScore >= PERFORMANCE_THRESHOLDS.sobresaliente) return 'sobresaliente';
    if (overallScore >= PERFORMANCE_THRESHOLDS.bueno) return 'bueno';
    if (overallScore >= PERFORMANCE_THRESHOLDS.regular) return 'regular';
    return 'necesita_mejora';
  }

  /**
   * Calcula tendencias de rendimiento
   */
  static calculateTrends(currentScore: number, previousScores: number[]): {
    direction: 'mejorando' | 'estable' | 'decayendo';
    changeRate: number;
    consistency: number;
  } {
    if (previousScores.length === 0) {
      return { direction: 'estable', changeRate: 0, consistency: 100 };
    }

    const recentAverage = previousScores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, previousScores.length);
    const changeRate = ((currentScore - recentAverage) / recentAverage) * 100;
    
    let direction: 'mejorando' | 'estable' | 'decayendo' = 'estable';
    if (changeRate > 5) direction = 'mejorando';
    else if (changeRate < -5) direction = 'decayendo';

    // Calcular consistencia (menor varianza = mayor consistencia)
    const variance = this.calculateVariance([...previousScores, currentScore]);
    const consistency = Math.max(0, 100 - variance);

    return {
      direction,
      changeRate: Math.round(changeRate),
      consistency: Math.round(consistency)
    };
  }

  /**
   * Calcula la varianza de un conjunto de números
   */
  private static calculateVariance(numbers: number[]): number {
    if (numbers.length <= 1) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    
    return Math.sqrt(variance);
  }
}
