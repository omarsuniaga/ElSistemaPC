// Scripts para analizar inasistencias
import { printAbsenceAnalysis } from '../src/utils/attendanceAnalyzer';

// Ejecutar el análisis e imprimir resultados
printAbsenceAnalysis()
  .then(() => {
    console.log('\n✅ Análisis de inasistencias completado.');
  })
  .catch(error => {
    console.error('❌ Error al ejecutar el análisis de inasistencias:', error);
  });
