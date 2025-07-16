<template>
  <div class="escalation-tester">
    <div class="tester-header">
      <h2>🎯 Probador Sistema de Escalación de Inasistencias</h2>
      <p>
        Herramienta para probar los 4 niveles de escalación según cantidad de inasistencias
        semanales
      </p>
    </div>

    <div class="test-controls">
      <div class="student-selector">
        <h3>👨‍🎓 Seleccionar Estudiante de Prueba</h3>
        <div class="form-group">
          <label>Estudiante:</label>
          <select v-model="selectedStudent">
            <option value="">Seleccionar estudiante...</option>
            <option v-for="student in mockStudents" :key="student.id" :value="student">
              {{ student.nombre }} {{ student.apellido }}
            </option>
          </select>
        </div>
      </div>

      <div class="escalation-levels">
        <h3>📊 Probar Niveles de Escalación</h3>
        <div class="level-buttons">
          <button
            v-for="level in escalationLevels"
            :key="level.number"
            :class="['level-btn', `level-${level.number}`]"
            :disabled="!selectedStudent || testing"
            @click="testEscalationLevel(level.number)"
          >
            <component :is="level.iconComponent" class="w-6 h-6" />
            <div class="level-info">
              <span class="level-title">{{ level.title }}</span>
              <span class="level-desc">{{ level.description }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedStudent" class="simulation-section">
      <h3>🎭 Simulación de Inasistencias Semanales</h3>
      <div class="simulation-controls">
        <div class="week-selector">
          <label>Semana de prueba:</label>
          <input v-model="testWeek" type="week" @change="updateWeekDates" />
          <span class="week-info">{{ weekInfo }}</span>
        </div>

        <div class="absence-creator">
          <h4>Crear Ausencias de Prueba</h4>
          <div class="absence-controls">
            <div v-for="day in weekDays" :key="day.date" class="day-control">
              <label class="day-label">
                <input v-model="day.absent" type="checkbox" @change="updateAbsenceCount" />
                <span>{{ day.name }} ({{ day.date }})</span>
                <span v-if="day.absent" class="absence-mark">❌</span>
              </label>
            </div>
          </div>

          <div class="absence-summary">
            <strong>Total inasistencias esta semana: {{ currentAbsenceCount }}</strong>
            <span
              :class="['escalation-preview', `level-${getEscalationLevel(currentAbsenceCount)}`]"
            >
              Nivel de escalación: {{ getEscalationLevel(currentAbsenceCount) }}
            </span>
          </div>

          <button
            :disabled="currentAbsenceCount === 0 || creating"
            class="btn-create-absences"
            @click="createSimulatedAbsences"
          >
            <component
              :is="creating ? 'div' : PlusIcon"
              class="w-5 h-5"
              :class="creating ? 'animate-spin' : ''"
            />
            {{ creating ? "Creando..." : "Crear Ausencias Simuladas" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="previewMessage" class="message-preview">
      <h3>📱 Vista Previa del Mensaje</h3>
      <div class="message-card">
        <div class="message-header">
          <span class="recipient"
            >Para: {{ selectedStudent?.tlf_madre || selectedStudent?.tlf_padre }}</span
          >
          <span :class="['escalation-badge', `level-${currentEscalationLevel}`]">
            Nivel {{ currentEscalationLevel }}
          </span>
        </div>
        <div class="message-content">
          {{ previewMessage }}
        </div>
        <div class="message-actions">
          <button :disabled="sending" class="btn-send" @click="sendTestMessage">
            <component
              :is="sending ? 'div' : PaperAirplaneIcon"
              class="w-5 h-5"
              :class="sending ? 'animate-spin' : ''"
            />
            {{ sending ? "Enviando..." : "Enviar Mensaje de Prueba" }}
          </button>
          <button class="btn-clear" @click="clearPreview">
            <XMarkIcon class="w-5 h-5" />
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <div class="test-results">
      <h3>📝 Historial de Pruebas</h3>
      <div class="results-container">
        <div v-if="testResults.length === 0" class="no-results">No hay pruebas realizadas</div>
        <div v-else class="results-list">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            :class="['result-item', result.success ? 'success' : 'error']"
          >
            <div class="result-header">
              <span class="result-time">{{ formatTime(result.timestamp) }}</span>
              <span :class="['result-level', `level-${result.level}`]">
                Nivel {{ result.level }}
              </span>
            </div>
            <div class="result-details">
              <strong>{{ result.studentName }}</strong> - {{ result.absenceCount }} inasistencias
            </div>
            <div class="result-message">{{ result.message.substring(0, 100) }}...</div>
            <div class="result-status">
              <component :is="result.success ? CheckIcon : XMarkIcon" class="w-4 h-4" />
              {{ result.success ? "Enviado exitosamente" : result.error }}
            </div>
          </div>
        </div>
      </div>

      <button v-if="testResults.length > 0" class="btn-clear-results" @click="clearResults">
        <TrashIcon class="w-5 h-5" />
        Limpiar Historial
      </button>
    </div>

    <div class="documentation">
      <h3>📚 Documentación de Niveles</h3>
      <div class="level-docs">
        <div v-for="level in escalationLevels" :key="level.number" class="level-doc">
          <div :class="['doc-header', `level-${level.number}`]">
            <component :is="level.iconComponent" class="w-5 h-5" />
            <span>Nivel {{ level.number }}: {{ level.title }}</span>
          </div>
          <div class="doc-content">
            <p><strong>Trigger:</strong> {{ level.trigger }}</p>
            <p><strong>Tono:</strong> {{ level.tone }}</p>
            <p><strong>Objetivo:</strong> {{ level.objective }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ExclamationCircleIcon,
  PlusIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
// import { notifyUnexcusedAbsences, countWeeklyAbsences } from '../../../services/attendanceNotifications.ts'

interface MockStudent {
  id: string
  nombre: string
  apellido: string
  tlf_madre?: string
  tlf_padre?: string
}

interface EscalationLevel {
  number: number
  title: string
  description: string
  trigger: string
  tone: string
  objective: string
  icon: string
  iconComponent: any
}

interface WeekDay {
  name: string
  date: string
  absent: boolean
}

interface TestResult {
  timestamp: Date
  studentName: string
  level: number
  absenceCount: number
  message: string
  success: boolean
  error?: string
}

export default defineComponent({
  name: 'EscalationTester',
  components: {
    InformationCircleIcon,
    ExclamationTriangleIcon,
    PhoneIcon,
    ExclamationCircleIcon,
    PlusIcon,
    PaperAirplaneIcon,
    XMarkIcon,
    CheckIcon,
    TrashIcon,
  },
  setup() {
    const selectedStudent = ref<MockStudent | null>(null);
    const testWeek = ref('');
    const weekDays = ref<WeekDay[]>([]);
    const currentAbsenceCount = ref(0);
    const currentEscalationLevel = ref(1);
    const previewMessage = ref('');
    const testing = ref(false);
    const creating = ref(false);
    const sending = ref(false);
    const testResults = ref<TestResult[]>([]);

    // Estudiantes de prueba
    const mockStudents: MockStudent[] = [
      {
        id: 'test_student_1',
        nombre: 'Ana',
        apellido: 'García',
        tlf_madre: '+1234567890',
        tlf_padre: '+0987654321',
      },
      {
        id: 'test_student_2',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        tlf_madre: '+1122334455',
        tlf_padre: '+5544332211',
      },
      {
        id: 'test_student_3',
        nombre: 'María',
        apellido: 'López',
        tlf_madre: '+9988776655',
        tlf_padre: '+6677889900',
      },
    ];

    // Niveles de escalación
    const escalationLevels: EscalationLevel[] = [
      {
        number: 1,
        title: 'Tono Suave',
        description: '1 inasistencia',
        trigger: 'Primera ausencia injustificada en la semana',
        tone: 'Amable y comprensivo',
        objective: 'Recordatorio suave sobre la importancia de asistir',
        icon: 'info',
        iconComponent: InformationCircleIcon,
      },
      {
        number: 2,
        title: 'Tono Reclamativo',
        description: '2 inasistencias',
        trigger: 'Segunda ausencia injustificada en la semana',
        tone: 'Firme recordando disciplina y responsabilidad',
        objective: 'Enfatizar la importancia de la disciplina musical',
        icon: 'alert-triangle',
        iconComponent: ExclamationTriangleIcon,
      },
      {
        number: 3,
        title: 'Solicitud de Explicación',
        description: '3 inasistencias',
        trigger: 'Tercera ausencia injustificada en la semana',
        tone: 'Formal solicitando contacto obligatorio',
        objective: 'Requerir explicación del representante en 24h',
        icon: 'phone',
        iconComponent: PhoneIcon,
      },
      {
        number: 4,
        title: 'Caso Extremo',
        description: '4+ inasistencias',
        trigger: 'Cuatro o más ausencias en la semana',
        tone: 'Urgente con citación obligatoria',
        objective: 'Citación presencial y evaluación de continuidad',
        icon: 'alert-octagon',
        iconComponent: ExclamationCircleIcon,
      },
    ];

    // Información de la semana
    const weekInfo = computed(() => {
      if (!testWeek.value) return '';
      const [year, week] = testWeek.value.split('-W');
      return `Semana ${week} del ${year}`;
    });

    /**
     * Obtiene el nivel de escalación según el número de ausencias
     */
    const getEscalationLevel = (absences: number): number => {
      if (absences === 1) return 1;
      if (absences === 2) return 2;
      if (absences === 3) return 3;
      if (absences >= 4) return 4;
      return 1;
    };

    /**
     * Actualiza las fechas de la semana cuando se selecciona una semana
     */
    const updateWeekDates = () => {
      if (!testWeek.value) return;

      const [year, week] = testWeek.value.split('-W');
      const startDate = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
      const day = startDate.getDay();
      const monday = new Date(startDate.getTime() - (day - 1) * 24 * 60 * 60 * 1000);

      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      weekDays.value = days.map((name, index) => {
        const date = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
        return {
          name,
          date: date.toISOString().split('T')[0],
          absent: false,
        };
      });

      updateAbsenceCount();
    };

    /**
     * Actualiza el conteo de ausencias
     */
    const updateAbsenceCount = () => {
      currentAbsenceCount.value = weekDays.value.filter((day) => day.absent).length;
      currentEscalationLevel.value = getEscalationLevel(currentAbsenceCount.value);
    };

    /**
     * Crea ausencias simuladas en Firebase
     */
    const createSimulatedAbsences = async () => {
      if (!selectedStudent.value || currentAbsenceCount.value === 0) return;

      try {
        creating.value = true;

        // Crear documentos de ausencia para cada día marcado
        for (const day of weekDays.value) {
          if (day.absent) {
            const attendanceDoc = {
              teacherId: 'test_teacher',
              classId: 'test_class',
              fecha: day.date,
              data: {
                presentes: ['other_student_1', 'other_student_2'],
                ausentes: [selectedStudent.value.id],
                tarde: [],
                justificacion: [],
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'ASISTENCIAS'), attendanceDoc);
            console.log(`✅ Ausencia creada para ${day.name} (${day.date})`);
          }
        }

        alert(
          `✅ Se crearon ${currentAbsenceCount.value} ausencias simuladas para ${selectedStudent.value.nombre}`,
        );
      } catch (error) {
        console.error('Error creando ausencias simuladas:', error);
        alert('❌ Error creando ausencias simuladas');
      } finally {
        creating.value = false;
      }
    };

    /**
     * Prueba un nivel específico de escalación
     */
    const testEscalationLevel = async (level: number) => {
      if (!selectedStudent.value) return;

      try {
        testing.value = true;

        // Simular el conteo de ausencias
        const mockAbsenceCount = level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 3 : 4;

        // Obtener el mensaje según el nivel
        const templates = {
          1: `Estimado representante, notamos la ausencia del estudiante ${selectedStudent.value.nombre} ${selectedStudent.value.apellido} a su clase de hoy. Si hay alguna eventualidad, por favor comuníquela a la administración. Su participación es importante para su desarrollo musical. ¡Le esperamos en su próxima clase! 🎵`,

          2: `Estimado representante, hemos registrado la SEGUNDA ausencia injustificada del estudiante ${selectedStudent.value.nombre} ${selectedStudent.value.apellido} esta semana. Le recordamos que la asistencia regular y la disciplina son fundamentales para el progreso musical y el aprovechamiento de las clases. Es importante que se comunique con la administración para informar sobre cualquier situación. La constancia es clave en el aprendizaje musical. 📚🎵`,

          3: `IMPORTANTE: El estudiante ${selectedStudent.value.nombre} ${selectedStudent.value.apellido} ha registrado su TERCERA ausencia injustificada esta semana. Esta situación es preocupante y afecta significativamente su progreso académico. SOLICITAMOS que el representante se comunique con la dirección de la academia EN LAS PRÓXIMAS 24 HORAS para proporcionar una explicación sobre las razones de estas inasistencias. Es necesario evaluar la continuidad en el programa. ⚠️📞`,

          4: `🚨 CASO EXTREMO - CITACIÓN OBLIGATORIA 🚨\n\nEl estudiante ${selectedStudent.value.nombre} ${selectedStudent.value.apellido} ha registrado CUATRO O MÁS ausencias injustificadas esta semana. Esta es una situación CRÍTICA que requiere atención INMEDIATA.\n\nSE REQUIERE la presencia OBLIGATORIA del representante en las oficinas de la sede para una reunión con la dirección académica.\n\nTemas a tratar:\n• Explicación detallada de las ausencias\n• Evaluación de continuidad en el programa\n• Posibles medidas disciplinarias\n• Plan de recuperación académica\n\nPor favor, contactar URGENTEMENTE para agendar cita. La situación académica del estudiante está en riesgo.`,
        };

        previewMessage.value = templates[level as keyof typeof templates] || templates[1];
        currentEscalationLevel.value = level;
        currentAbsenceCount.value = mockAbsenceCount;
      } catch (error) {
        console.error('Error probando escalación:', error);
      } finally {
        testing.value = false;
      }
    };

    /**
     * Envía mensaje de prueba
     */
    const sendTestMessage = async () => {
      if (!selectedStudent.value || !previewMessage.value) return;

      try {
        sending.value = true;

        // Simular envío (aquí se integraría con WhatsApp real)
        // const result = await notifyUnexcusedAbsences([selectedStudent.value.id])
        const result = { success: 1, failed: 0 }; // Mock result

        const testResult: TestResult = {
          timestamp: new Date(),
          studentName: `${selectedStudent.value.nombre} ${selectedStudent.value.apellido}`,
          level: currentEscalationLevel.value,
          absenceCount: currentAbsenceCount.value,
          message: previewMessage.value,
          success: result.success > 0,
          error: result.success === 0 ? 'Error en envío' : undefined,
        };

        testResults.value.unshift(testResult);

        if (testResult.success) {
          alert('✅ Mensaje enviado exitosamente');
        } else {
          alert('❌ Error enviando mensaje');
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        alert('❌ Error enviando mensaje de prueba');
      } finally {
        sending.value = false;
      }
    };

    /**
     * Limpia la vista previa
     */
    const clearPreview = () => {
      previewMessage.value = '';
      currentEscalationLevel.value = 1;
      currentAbsenceCount.value = 0;
    };

    /**
     * Limpia los resultados
     */
    const clearResults = () => {
      testResults.value = [];
    };

    /**
     * Formatea la hora
     */
    const formatTime = (date: Date): string => {
      return date.toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    };

    // Inicialización
    onMounted(() => {
      // Establecer semana actual por defecto
      const now = new Date();
      const year = now.getFullYear();
      const week = Math.ceil(
        ((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
          new Date(year, 0, 1).getDay() +
          1) /
          7,
      );
      testWeek.value = `${year}-W${week.toString().padStart(2, '0')}`;
      updateWeekDates();
    });

    return {
      selectedStudent,
      testWeek,
      weekDays,
      currentAbsenceCount,
      currentEscalationLevel,
      previewMessage,
      testing,
      creating,
      sending,
      testResults,
      mockStudents,
      escalationLevels,
      weekInfo,
      getEscalationLevel,
      updateWeekDates,
      updateAbsenceCount,
      createSimulatedAbsences,
      testEscalationLevel,
      sendTestMessage,
      clearPreview,
      clearResults,
      formatTime,
    };
  },
});
</script>

<style scoped>
.escalation-tester {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.tester-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tester-header h2 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 2rem;
}

.tester-header p {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
}

.test-controls {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.student-selector,
.escalation-levels {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.level-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.level-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.level-btn.level-1 {
  background: #dbeafe;
  color: #1e40af;
  border: 2px solid #3b82f6;
}

.level-btn.level-2 {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.level-btn.level-3 {
  background: #fed7d7;
  color: #c53030;
  border: 2px solid #e53e3e;
}

.level-btn.level-4 {
  background: #fecaca;
  color: #991b1b;
  border: 2px solid #dc2626;
}

.level-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.level-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-info {
  display: flex;
  flex-direction: column;
}

.level-title {
  font-weight: 600;
  font-size: 1rem;
}

.level-desc {
  font-size: 0.875rem;
  opacity: 0.8;
}

.simulation-section {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.simulation-controls {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.week-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.week-selector label {
  font-weight: 600;
  color: #374151;
}

.week-selector input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
}

.week-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.absence-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.day-control {
  display: flex;
  align-items: center;
}

.day-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.day-label:hover {
  background: #f3f4f6;
}

.absence-mark {
  margin-left: auto;
}

.absence-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.escalation-preview {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.escalation-preview.level-1 {
  background: #dbeafe;
  color: #1e40af;
}
.escalation-preview.level-2 {
  background: #fef3c7;
  color: #92400e;
}
.escalation-preview.level-3 {
  background: #fed7d7;
  color: #c53030;
}
.escalation-preview.level-4 {
  background: #fecaca;
  color: #991b1b;
}

.btn-create-absences {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-create-absences:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-create-absences:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.message-preview {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.message-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.escalation-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.escalation-badge.level-1 {
  background: #dbeafe;
  color: #1e40af;
}
.escalation-badge.level-2 {
  background: #fef3c7;
  color: #92400e;
}
.escalation-badge.level-3 {
  background: #fed7d7;
  color: #c53030;
}
.escalation-badge.level-4 {
  background: #fecaca;
  color: #991b1b;
}

.message-content {
  padding: 1.5rem;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
}

.message-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-send,
.btn-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-send {
  background: #10b981;
  color: white;
}

.btn-send:hover:not(:disabled) {
  background: #059669;
}

.btn-clear {
  background: #ef4444;
  color: white;
}

.btn-clear:hover {
  background: #dc2626;
}

.test-results {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.results-container {
  max-height: 400px;
  overflow-y: auto;
}

.no-results {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  font-style: italic;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.result-item.success {
  border-color: #10b981;
  background: #f0fdf4;
}

.result-item.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-level {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.result-level.level-1 {
  background: #dbeafe;
  color: #1e40af;
}
.result-level.level-2 {
  background: #fef3c7;
  color: #92400e;
}
.result-level.level-3 {
  background: #fed7d7;
  color: #c53030;
}
.result-level.level-4 {
  background: #fecaca;
  color: #991b1b;
}

.result-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-clear-results {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
}

.documentation {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.level-docs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.level-doc {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  font-weight: 600;
}

.doc-header.level-1 {
  background: #dbeafe;
  color: #1e40af;
}
.doc-header.level-2 {
  background: #fef3c7;
  color: #92400e;
}
.doc-header.level-3 {
  background: #fed7d7;
  color: #c53030;
}
.doc-header.level-4 {
  background: #fecaca;
  color: #991b1b;
}

.doc-content {
  padding: 1rem;
}

.doc-content p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .escalation-tester {
    padding: 1rem;
  }

  .test-controls,
  .simulation-controls {
    grid-template-columns: 1fr;
  }

  .level-buttons {
    grid-template-columns: 1fr;
  }

  .absence-controls {
    grid-template-columns: 1fr;
  }

  .level-docs {
    grid-template-columns: 1fr;
  }
}
</style>
