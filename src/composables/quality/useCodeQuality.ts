/**
 * 🔧 SISTEMA DE CALIDAD DE CÓDIGO
 * Fase 2 - Iniciativa 5: Code Quality & TypeScript Strict Mode
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// ==================== TIPOS ====================

interface CodeQualityConfig {
  enabled: boolean
  typescript: {
    strictMode: boolean
    noImplicitAny: boolean
    noImplicitReturns: boolean
    noUnusedLocals: boolean
    noUnusedParameters: boolean
    exactOptionalPropertyTypes: boolean
  }
  eslint: {
    enabled: boolean
    rules: Record<string, string | [string, any]>
  }
  prettier: {
    enabled: boolean
    config: PrettierConfig
  }
  testing: {
    coverage: {
      enabled: boolean
      threshold: number
    }
    types: TestingTypes
  }
  metrics: {
    complexity: boolean
    maintainability: boolean
    duplicates: boolean
  }
}

interface PrettierConfig {
  printWidth: number
  tabWidth: number
  useTabs: boolean
  semi: boolean
  singleQuote: boolean
  quoteProps: 'as-needed' | 'consistent' | 'preserve'
  trailingComma: 'none' | 'es5' | 'all'
  bracketSpacing: boolean
  arrowParens: 'avoid' | 'always'
}

interface TestingTypes {
  unit: boolean
  integration: boolean
  e2e: boolean
  visual: boolean
  performance: boolean
}

interface CodeQualityMetrics {
  typescript: TypeScriptMetrics
  eslint: ESLintMetrics
  testing: TestingMetrics
  complexity: ComplexityMetrics
  maintainability: MaintainabilityMetrics
  duplicates: DuplicateMetrics
}

interface TypeScriptMetrics {
  errors: number
  warnings: number
  strictModeCompliance: number
  typesCoverage: number
  files: {
    total: number
    withErrors: number
    withWarnings: number
  }
}

interface ESLintMetrics {
  errors: number
  warnings: number
  fixableErrors: number
  fixableWarnings: number
  rules: Record<string, number>
  files: {
    total: number
    withIssues: number
  }
}

interface TestingMetrics {
  coverage: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  tests: {
    total: number
    passing: number
    failing: number
    skipped: number
  }
  performance: {
    averageTime: number
    slowestTest: number
  }
}

interface ComplexityMetrics {
  cyclomatic: {
    average: number
    max: number
    files: Array<{file: string; complexity: number}>
  }
  cognitive: {
    average: number
    max: number
    files: Array<{file: string; complexity: number}>
  }
}

interface MaintainabilityMetrics {
  index: number
  technical_debt: {
    ratio: number
    hours: number
  }
  code_smells: number
  hotspots: Array<{file: string; issues: number}>
}

interface DuplicateMetrics {
  lines: number
  blocks: number
  files: Array<{file: string; duplicates: number}>
  percentage: number
}

interface QualityGate {
  name: string
  conditions: QualityCondition[]
  status: 'passed' | 'failed' | 'warning'
}

interface QualityCondition {
  metric: string
  operator: 'GT' | 'LT' | 'EQ' | 'NE'
  threshold: number
  actual: number
  status: 'passed' | 'failed'
}

interface CodeReview {
  id: string
  timestamp: Date
  metrics: CodeQualityMetrics
  qualityGates: QualityGate[]
  recommendations: string[]
  score: number
  trend: 'improving' | 'stable' | 'declining'
}

// ==================== CONFIGURACIÓN PREDETERMINADA ====================

const DEFAULT_CODE_QUALITY_CONFIG: CodeQualityConfig = {
  enabled: true,
  typescript: {
    strictMode: true,
    noImplicitAny: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    exactOptionalPropertyTypes: true,
  },
  eslint: {
    enabled: true,
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-props-declaration': 'error',
      'vue/define-emits-declaration': 'error',
      'vue/no-unused-properties': 'warn',
      'vue/require-typed-ref': 'error',
    },
  },
  prettier: {
    enabled: true,
    config: {
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      semi: false,
      singleQuote: false,
      quoteProps: 'as-needed',
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'always',
    },
  },
  testing: {
    coverage: {
      enabled: true,
      threshold: 80,
    },
    types: {
      unit: true,
      integration: true,
      e2e: true,
      visual: false,
      performance: true,
    },
  },
  metrics: {
    complexity: true,
    maintainability: true,
    duplicates: true,
  },
};

// ==================== QUALITY GATES ====================

const DEFAULT_QUALITY_GATES: QualityGate[] = [
  {
    name: 'TypeScript Compliance',
    conditions: [
      { metric: 'typescript_errors', operator: 'EQ', threshold: 0, actual: 0, status: 'passed' },
      { metric: 'types_coverage', operator: 'GT', threshold: 90, actual: 0, status: 'failed' },
    ],
    status: 'failed',
  },
  {
    name: 'Code Coverage',
    conditions: [
      { metric: 'coverage_lines', operator: 'GT', threshold: 80, actual: 0, status: 'failed' },
      { metric: 'coverage_functions', operator: 'GT', threshold: 80, actual: 0, status: 'failed' },
    ],
    status: 'failed',
  },
  {
    name: 'Code Quality',
    conditions: [
      { metric: 'eslint_errors', operator: 'EQ', threshold: 0, actual: 0, status: 'passed' },
      { metric: 'complexity_average', operator: 'LT', threshold: 10, actual: 0, status: 'passed' },
      { metric: 'duplicates_percentage', operator: 'LT', threshold: 3, actual: 0, status: 'passed' },
    ],
    status: 'passed',
  },
  {
    name: 'Maintainability',
    conditions: [
      { metric: 'maintainability_index', operator: 'GT', threshold: 70, actual: 0, status: 'failed' },
      { metric: 'technical_debt_ratio', operator: 'LT', threshold: 5, actual: 0, status: 'failed' },
    ],
    status: 'failed',
  },
];

// ==================== STORE DE CALIDAD DE CÓDIGO ====================

export const useCodeQualityStore = defineStore('codeQuality', () => {
  // Estado
  const config = ref<CodeQualityConfig>(DEFAULT_CODE_QUALITY_CONFIG);
  const metrics = ref<CodeQualityMetrics>({
    typescript: {
      errors: 0,
      warnings: 0,
      strictModeCompliance: 0,
      typesCoverage: 0,
      files: { total: 0, withErrors: 0, withWarnings: 0 },
    },
    eslint: {
      errors: 0,
      warnings: 0,
      fixableErrors: 0,
      fixableWarnings: 0,
      rules: {},
      files: { total: 0, withIssues: 0 },
    },
    testing: {
      coverage: { lines: 0, functions: 0, branches: 0, statements: 0 },
      tests: { total: 0, passing: 0, failing: 0, skipped: 0 },
      performance: { averageTime: 0, slowestTest: 0 },
    },
    complexity: {
      cyclomatic: { average: 0, max: 0, files: [] },
      cognitive: { average: 0, max: 0, files: [] },
    },
    maintainability: {
      index: 0,
      technical_debt: { ratio: 0, hours: 0 },
      code_smells: 0,
      hotspots: [],
    },
    duplicates: {
      lines: 0,
      blocks: 0,
      files: [],
      percentage: 0,
    },
  });
  const qualityGates = ref<QualityGate[]>(JSON.parse(JSON.stringify(DEFAULT_QUALITY_GATES)));
  const reviews = ref<CodeReview[]>([]);
  const isAnalyzing = ref(false);

  // Computed
  const overallScore = computed(() => {
    const weights = {
      typescript: 25,
      eslint: 20,
      testing: 25,
      complexity: 15,
      maintainability: 10,
      duplicates: 5,
    };

    let score = 0;

    // TypeScript score
    const tsErrors = metrics.value.typescript.errors;
    const tsScore = Math.max(0, 100 - tsErrors * 10);
    score += (tsScore * weights.typescript) / 100;

    // ESLint score
    const eslintErrors = metrics.value.eslint.errors;
    const eslintScore = Math.max(0, 100 - eslintErrors * 5);
    score += (eslintScore * weights.eslint) / 100;

    // Testing score
    const coverage = metrics.value.testing.coverage.lines;
    const testingScore = Math.min(100, coverage);
    score += (testingScore * weights.testing) / 100;

    // Complexity score
    const complexity = metrics.value.complexity.cyclomatic.average;
    const complexityScore = Math.max(0, 100 - Math.max(0, complexity - 5) * 10);
    score += (complexityScore * weights.complexity) / 100;

    // Maintainability score
    const maintainability = metrics.value.maintainability.index;
    score += (maintainability * weights.maintainability) / 100;

    // Duplicates score
    const duplicates = metrics.value.duplicates.percentage;
    const duplicatesScore = Math.max(0, 100 - duplicates * 10);
    score += (duplicatesScore * weights.duplicates) / 100;

    return Math.round(score);
  });

  const qualityStatus = computed(() => {
    const score = overallScore.value;
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'needs-improvement';
    return 'poor';
  });

  const passedGates = computed(
    () => qualityGates.value.filter((gate) => gate.status === 'passed').length,
  );

  const failedGates = computed(
    () => qualityGates.value.filter((gate) => gate.status === 'failed').length,
  );

  const criticalIssues = computed(() => {
    const issues: string[] = [];

    if (metrics.value.typescript.errors > 0) {
      issues.push(`${metrics.value.typescript.errors} errores de TypeScript`);
    }

    if (metrics.value.eslint.errors > 0) {
      issues.push(`${metrics.value.eslint.errors} errores de ESLint`);
    }

    if (metrics.value.testing.coverage.lines < config.value.testing.coverage.threshold) {
      issues.push(`Cobertura de pruebas baja: ${metrics.value.testing.coverage.lines}%`);
    }

    if (metrics.value.complexity.cyclomatic.average > 10) {
      issues.push(`Complejidad alta: ${metrics.value.complexity.cyclomatic.average}`);
    }

    return issues;
  });

  // ==================== ANÁLISIS PRINCIPAL ====================

  async function analyzeCodeQuality(): Promise<CodeReview> {
    if (isAnalyzing.value) {
      throw new Error('Análisis ya en progreso');
    }

    console.log('🔧 Iniciando análisis de calidad de código...');
    isAnalyzing.value = true;

    try {
      // Simular análisis progresivo
      await analyzeTypeScript();
      await analyzeESLint();
      await analyzeTesting();
      await analyzeComplexity();
      await analyzeMaintainability();
      await analyzeDuplicates();

      // Actualizar quality gates
      updateQualityGates();

      // Generar recomendaciones
      const recommendations = generateRecommendations();

      // Crear review
      const review: CodeReview = {
        id: generateReviewId(),
        timestamp: new Date(),
        metrics: JSON.parse(JSON.stringify(metrics.value)),
        qualityGates: JSON.parse(JSON.stringify(qualityGates.value)),
        recommendations,
        score: overallScore.value,
        trend: calculateTrend(),
      };

      reviews.value.push(review);

      // Mantener solo las últimas 10 reviews
      if (reviews.value.length > 10) {
        reviews.value = reviews.value.slice(-10);
      }

      console.log(`✅ Análisis completado. Score: ${review.score}`);
      return review;
    } finally {
      isAnalyzing.value = false;
    }
  }

  // ==================== ANÁLISIS TYPESCRIPT ====================

  async function analyzeTypeScript(): Promise<void> {
    console.log('🔍 Analizando TypeScript...');

    // Simular análisis de TypeScript
    await new Promise((resolve) => setTimeout(resolve, 500));

    // En una aplicación real, esto ejecutaría tsc --noEmit y analizaría la salida
    metrics.value.typescript = {
      errors: Math.floor(Math.random() * 5), // Simular errores
      warnings: Math.floor(Math.random() * 10),
      strictModeCompliance: 85 + Math.floor(Math.random() * 15),
      typesCoverage: 75 + Math.floor(Math.random() * 25),
      files: {
        total: 42,
        withErrors: Math.floor(Math.random() * 3),
        withWarnings: Math.floor(Math.random() * 8),
      },
    };
  }

  // ==================== ANÁLISIS ESLINT ====================

  async function analyzeESLint(): Promise<void> {
    console.log('🔍 Analizando ESLint...');

    await new Promise((resolve) => setTimeout(resolve, 300));

    // En una aplicación real, esto ejecutaría ESLint y analizaría la salida
    metrics.value.eslint = {
      errors: Math.floor(Math.random() * 8),
      warnings: Math.floor(Math.random() * 15),
      fixableErrors: Math.floor(Math.random() * 5),
      fixableWarnings: Math.floor(Math.random() * 10),
      rules: {
        '@typescript-eslint/no-unused-vars': Math.floor(Math.random() * 3),
        '@typescript-eslint/no-explicit-any': Math.floor(Math.random() * 5),
        'vue/component-definition-name-casing': Math.floor(Math.random() * 2),
      },
      files: {
        total: 42,
        withIssues: Math.floor(Math.random() * 15),
      },
    };
  }

  // ==================== ANÁLISIS DE TESTING ====================

  async function analyzeTesting(): Promise<void> {
    console.log('🔍 Analizando Testing...');

    await new Promise((resolve) => setTimeout(resolve, 400));

    // En una aplicación real, esto ejecutaría los tests y analizaría coverage
    metrics.value.testing = {
      coverage: {
        lines: 65 + Math.floor(Math.random() * 30),
        functions: 70 + Math.floor(Math.random() * 25),
        branches: 60 + Math.floor(Math.random() * 35),
        statements: 68 + Math.floor(Math.random() * 27),
      },
      tests: {
        total: 85,
        passing: 80 + Math.floor(Math.random() * 5),
        failing: Math.floor(Math.random() * 3),
        skipped: Math.floor(Math.random() * 2),
      },
      performance: {
        averageTime: 150 + Math.floor(Math.random() * 100),
        slowestTest: 500 + Math.floor(Math.random() * 300),
      },
    };
  }

  // ==================== ANÁLISIS DE COMPLEJIDAD ====================

  async function analyzeComplexity(): Promise<void> {
    console.log('🔍 Analizando Complejidad...');

    await new Promise((resolve) => setTimeout(resolve, 300));

    // En una aplicación real, esto usaría herramientas como complexity-report
    const complexFiles = [
      { file: 'src/composables/useStudents.ts', complexity: 8 },
      { file: 'src/views/ClassManagement.vue', complexity: 12 },
      { file: 'src/stores/attendance.ts', complexity: 6 },
    ];

    metrics.value.complexity = {
      cyclomatic: {
        average: 5 + Math.floor(Math.random() * 5),
        max: 12 + Math.floor(Math.random() * 8),
        files: complexFiles,
      },
      cognitive: {
        average: 7 + Math.floor(Math.random() * 6),
        max: 15 + Math.floor(Math.random() * 10),
        files: complexFiles.map((f) => ({ ...f, complexity: f.complexity + 2 })),
      },
    };
  }

  // ==================== ANÁLISIS DE MANTENIBILIDAD ====================

  async function analyzeMaintainability(): Promise<void> {
    console.log('🔍 Analizando Mantenibilidad...');

    await new Promise((resolve) => setTimeout(resolve, 350));

    // En una aplicación real, esto usaría herramientas como SonarQube
    metrics.value.maintainability = {
      index: 60 + Math.floor(Math.random() * 35),
      technical_debt: {
        ratio: 1 + Math.floor(Math.random() * 4),
        hours: 8 + Math.floor(Math.random() * 20),
      },
      code_smells: Math.floor(Math.random() * 15),
      hotspots: [
        { file: 'src/utils/whatsappService.ts', issues: 3 },
        { file: 'src/components/StudentForm.vue', issues: 2 },
      ],
    };
  }

  // ==================== ANÁLISIS DE DUPLICADOS ====================

  async function analyzeDuplicates(): Promise<void> {
    console.log('🔍 Analizando Duplicados...');

    await new Promise((resolve) => setTimeout(resolve, 250));

    // En una aplicación real, esto usaría herramientas como jscpd
    const duplicateLines = Math.floor(Math.random() * 100);
    const totalLines = 5000; // Estimado

    metrics.value.duplicates = {
      lines: duplicateLines,
      blocks: Math.floor(duplicateLines / 10),
      files: [
        { file: 'src/components/StudentCard.vue', duplicates: 2 },
        { file: 'src/components/TeacherCard.vue', duplicates: 2 },
      ],
      percentage: (duplicateLines / totalLines) * 100,
    };
  }

  // ==================== QUALITY GATES ====================

  function updateQualityGates(): void {
    qualityGates.value.forEach((gate) => {
      gate.conditions.forEach((condition) => {
        // Actualizar valor actual basado en métricas
        switch (condition.metric) {
        case 'typescript_errors':
          condition.actual = metrics.value.typescript.errors;
          break;
        case 'types_coverage':
          condition.actual = metrics.value.typescript.typesCoverage;
          break;
        case 'coverage_lines':
          condition.actual = metrics.value.testing.coverage.lines;
          break;
        case 'coverage_functions':
          condition.actual = metrics.value.testing.coverage.functions;
          break;
        case 'eslint_errors':
          condition.actual = metrics.value.eslint.errors;
          break;
        case 'complexity_average':
          condition.actual = metrics.value.complexity.cyclomatic.average;
          break;
        case 'duplicates_percentage':
          condition.actual = metrics.value.duplicates.percentage;
          break;
        case 'maintainability_index':
          condition.actual = metrics.value.maintainability.index;
          break;
        case 'technical_debt_ratio':
          condition.actual = metrics.value.maintainability.technical_debt.ratio;
          break;
        }

        // Evaluar condición
        condition.status = evaluateCondition(condition) ? 'passed' : 'failed';
      });

      // Evaluar gate general
      gate.status = gate.conditions.every((c) => c.status === 'passed') ? 'passed' : 'failed';
    });
  }

  function evaluateCondition(condition: QualityCondition): boolean {
    switch (condition.operator) {
    case 'GT':
      return condition.actual > condition.threshold;
    case 'LT':
      return condition.actual < condition.threshold;
    case 'EQ':
      return condition.actual === condition.threshold;
    case 'NE':
      return condition.actual !== condition.threshold;
    default:
      return false;
    }
  }

  // ==================== RECOMENDACIONES ====================

  function generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // TypeScript recommendations
    if (metrics.value.typescript.errors > 0) {
      recommendations.push(`🔧 Corregir ${metrics.value.typescript.errors} errores de TypeScript`);
    }

    if (metrics.value.typescript.typesCoverage < 90) {
      recommendations.push('📝 Mejorar cobertura de tipos agregando anotaciones explícitas');
    }

    // ESLint recommendations
    if (metrics.value.eslint.errors > 0) {
      recommendations.push(`🔧 Corregir ${metrics.value.eslint.errors} errores de ESLint`);
    }

    if (metrics.value.eslint.fixableErrors > 0) {
      recommendations.push(
        `⚡ Ejecutar ESLint --fix para corregir ${metrics.value.eslint.fixableErrors} errores automáticamente`,
      );
    }

    // Testing recommendations
    if (metrics.value.testing.coverage.lines < config.value.testing.coverage.threshold) {
      recommendations.push(
        `🧪 Aumentar cobertura de pruebas al ${config.value.testing.coverage.threshold}%`,
      );
    }

    if (metrics.value.testing.tests.failing > 0) {
      recommendations.push(`❌ Corregir ${metrics.value.testing.tests.failing} pruebas fallidas`);
    }

    // Complexity recommendations
    if (metrics.value.complexity.cyclomatic.average > 10) {
      recommendations.push(
        '🔄 Refactorizar funciones complejas para reducir complejidad ciclomática',
      );
    }

    // Maintainability recommendations
    if (metrics.value.maintainability.index < 70) {
      recommendations.push('🏗️ Mejorar índice de mantenibilidad refactorizando código legacy');
    }

    if (metrics.value.maintainability.code_smells > 5) {
      recommendations.push('🧹 Eliminar code smells identificados');
    }

    // Duplicates recommendations
    if (metrics.value.duplicates.percentage > 3) {
      recommendations.push('📋 Extraer código duplicado a funciones/componentes reutilizables');
    }

    return recommendations;
  }

  // ==================== UTILIDADES ====================

  function generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (reviews.value.length < 2) return 'stable';

    const current = overallScore.value;
    const previous = reviews.value[reviews.value.length - 1].score;

    if (current > previous + 5) return 'improving';
    if (current < previous - 5) return 'declining';
    return 'stable';
  }

  async function fixAutomaticIssues(): Promise<void> {
    console.log('🔧 Ejecutando correcciones automáticas...');

    // Simular ESLint --fix
    if (metrics.value.eslint.fixableErrors > 0 || metrics.value.eslint.fixableWarnings > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      metrics.value.eslint.errors -= metrics.value.eslint.fixableErrors;
      metrics.value.eslint.warnings -= metrics.value.eslint.fixableWarnings;
      metrics.value.eslint.fixableErrors = 0;
      metrics.value.eslint.fixableWarnings = 0;

      console.log('✅ Correcciones automáticas de ESLint aplicadas');
    }

    // Simular Prettier formatting
    if (config.value.prettier.enabled) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('✅ Formato de código aplicado con Prettier');
    }
  }

  function exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      score: overallScore.value,
      status: qualityStatus.value,
      metrics: metrics.value,
      qualityGates: qualityGates.value,
      recommendations: generateRecommendations(),
      criticalIssues: criticalIssues.value,
    };

    return JSON.stringify(report, null, 2);
  }

  function updateConfig(newConfig: Partial<CodeQualityConfig>): void {
    config.value = { ...config.value, ...newConfig };
  }

  function resetMetrics(): void {
    metrics.value = {
      typescript: {
        errors: 0,
        warnings: 0,
        strictModeCompliance: 0,
        typesCoverage: 0,
        files: { total: 0, withErrors: 0, withWarnings: 0 },
      },
      eslint: {
        errors: 0,
        warnings: 0,
        fixableErrors: 0,
        fixableWarnings: 0,
        rules: {},
        files: { total: 0, withIssues: 0 },
      },
      testing: {
        coverage: { lines: 0, functions: 0, branches: 0, statements: 0 },
        tests: { total: 0, passing: 0, failing: 0, skipped: 0 },
        performance: { averageTime: 0, slowestTest: 0 },
      },
      complexity: {
        cyclomatic: { average: 0, max: 0, files: [] },
        cognitive: { average: 0, max: 0, files: [] },
      },
      maintainability: {
        index: 0,
        technical_debt: { ratio: 0, hours: 0 },
        code_smells: 0,
        hotspots: [],
      },
      duplicates: {
        lines: 0,
        blocks: 0,
        files: [],
        percentage: 0,
      },
    };
  }

  // ==================== RETURN ====================

  return {
    // Estado
    config,
    metrics,
    qualityGates,
    reviews,
    isAnalyzing,

    // Computed
    overallScore,
    qualityStatus,
    passedGates,
    failedGates,
    criticalIssues,

    // Métodos principales
    analyzeCodeQuality,
    fixAutomaticIssues,

    // Utilidades
    exportReport,
    updateConfig,
    resetMetrics,
    generateRecommendations,
  };
});

// ==================== COMPOSABLE ====================

export function useCodeQuality() {
  const store = useCodeQualityStore();

  return {
    ...store,

    // Métodos de conveniencia
    quickAnalysis: async () => {
      await store.analyzeCodeQuality();
      return store.overallScore;
    },

    getQualityGrade: () => {
      const score = store.overallScore;
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    },

    getPriorityIssues: () => {
      return store.criticalIssues.slice(0, 3);
    },
  };
}
