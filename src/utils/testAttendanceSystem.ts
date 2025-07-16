// Archivo de testing manual para el sistema de asistencia
// Este archivo se puede usar para probar la funcionalidad mejorada

import * as attendanceService from '../service/attendance';

/**
 * Script de testing para verificar que el sistema de asistencia funciona correctamente
 */
export async function testAttendanceSystem() {
  console.log('=== INICIANDO TESTS DEL SISTEMA DE ASISTENCIA ===');

  const testDate = '2025-05-24';
  const testClassId = 'test-class-id';
  const testTeacherId = 'test-teacher-id';

  try {
    // Test 1: Crear un documento de asistencia de prueba
    console.log('\n1. Testing document creation...');
    const testDoc = {
      id: 'test-doc',
      fecha: testDate,
      classId: testClassId,
      teacherId: testTeacherId,
      uid: testTeacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        presentes: ['student1', 'student2'],
        ausentes: ['student3'],
        tarde: ['student4'],
        justificacion: [
          {
            id: 'student5',
            studentId: 'student5',
            classId: testClassId,
            fecha: testDate,
            reason: 'Razón de prueba',
            documentUrl: '',
            approvalStatus: 'pending' as const,
            createdAt: new Date(),
            timeLimit: new Date(),
          },
        ],
        observación: 'Observación de prueba',
      },
    };

    const savedDocId = await attendanceService.saveAttendanceDocument(testDoc);
    console.log('✅ Documento guardado con ID:', savedDocId);

    // Test 2: Recuperar el documento usando la función mejorada
    console.log('\n2. Testing document retrieval...');
    const retrievedDoc = await attendanceService.getAttendanceDocument(
      testDate,
      testClassId,
      testTeacherId,
    );

    if (retrievedDoc) {
      console.log('✅ Documento recuperado correctamente');
      console.log('   - ID:', retrievedDoc.id);
      console.log('   - TeacherId:', retrievedDoc.teacherId);
      console.log('   - Presentes:', retrievedDoc.data.presentes?.length || 0);
      console.log('   - Ausentes:', retrievedDoc.data.ausentes?.length || 0);
      console.log('   - Tarde:', retrievedDoc.data.tarde?.length || 0);
      console.log('   - Justificados:', retrievedDoc.data.justificacion?.length || 0);
    } else {
      console.error('❌ No se pudo recuperar el documento');
    }

    // Test 3: Buscar documentos con filtros
    console.log('\n3. Testing filtered search...');
    const foundDocs = await attendanceService.findAttendanceDocuments({
      fecha: testDate,
      teacherId: testTeacherId,
    });

    console.log(`✅ Encontrados ${foundDocs.length} documentos con filtros`);

    // Test 4: Actualizar observaciones
    console.log('\n4. Testing observations update...');
    const updatedObsId = await attendanceService.updateObservations(
      testDate,
      testClassId,
      'Nueva observación de prueba',
      testTeacherId,
    );
    console.log('✅ Observaciones actualizadas en documento:', updatedObsId);

    // Test 5: Verificar la actualización
    console.log('\n5. Testing updated document retrieval...');
    const updatedDoc = await attendanceService.getAttendanceDocument(
      testDate,
      testClassId,
      testTeacherId,
    );

    if (updatedDoc && updatedDoc.data.observación === 'Nueva observación de prueba') {
      console.log('✅ Observaciones actualizadas correctamente');
    } else {
      console.error('❌ Las observaciones no se actualizaron correctamente');
    }

    console.log('\n=== TESTS COMPLETADOS ===');
    return true;
  } catch (error) {
    console.error('❌ Error durante el testing:', error);
    return false;
  }
}

/**
 * Test específico para verificar el filtrado por teacherId
 */
export async function testTeacherFiltering(teacherId: string, date: string) {
  console.log('=== TEST DE FILTRADO POR PROFESOR ===');
  console.log('TeacherId:', teacherId);
  console.log('Fecha:', date);

  try {
    // Obtener todos los documentos de la fecha sin filtrar
    const allDocs = await attendanceService.getAttendanceDocumentsByDate(date);
    console.log(`Documentos totales para la fecha: ${allDocs.length}`);

    allDocs.forEach((doc, index) => {
      console.log(`  Documento ${index + 1}:`, {
        id: doc.id,
        classId: doc.classId,
        teacherId: doc.teacherId,
        isCurrentTeacher: doc.teacherId === teacherId,
      });
    });

    // Obtener documentos filtrados por profesor
    const teacherDocs = await attendanceService.getAttendanceDocumentsByDate(date, teacherId);
    console.log(`Documentos del profesor: ${teacherDocs.length}`);

    teacherDocs.forEach((doc, index) => {
      console.log(`  Documento ${index + 1}:`, {
        id: doc.id,
        classId: doc.classId,
        teacherId: doc.teacherId,
      });
    });

    return { allDocs, teacherDocs };
  } catch (error) {
    console.error('Error en test de filtrado:', error);
    throw error;
  }
}

/**
 * Test de debugging del store
 */
export async function testStoreDebugging(attendanceStore: any, date: string, classId: string) {
  console.log('=== TEST DE DEBUGGING DEL STORE ===');

  try {
    const result = await attendanceStore.debugAttendanceSystem(date, classId);

    console.log('Resultado del debugging:');
    console.log('  - Original result:', result.originalResult ? 'FOUND' : 'NOT FOUND');
    console.log('  - Date documents:', result.dateDocuments?.length || 0);
    console.log('  - Teacher documents:', result.teacherDocuments?.length || 0);
    console.log('  - Target document:', result.targetDocument ? 'FOUND' : 'NOT FOUND');

    return result;
  } catch (error) {
    console.error('Error en test de debugging del store:', error);
    throw error;
  }
}

/**
 * Test específico para el sistema de observaciones
 */
export async function testObservationSystem() {
  console.log('=== TEST DEL SISTEMA DE OBSERVACIONES ===');

  const testDate = '2025-05-24';
  const testClassId = 'test-class-id';
  const testTeacherId = 'test-teacher-id';

  try {
    // Test 1: Crear observación estructurada
    console.log('\n1. Testing structured observation creation...');
    const structuredObs = {
      id: 'obs-' + Date.now(),
      content: 'Observación de prueba estructurada',
      author: testTeacherId,
      timestamp: new Date(),
      type: 'general' as const,
      tags: ['importante', 'contenido'],
      imageUrls: [],
      formattedText: 'Observación de prueba **estructurada**',
    };

    const obsDocId = await attendanceService.addStructuredObservation(
      testDate,
      testClassId,
      structuredObs,
      testTeacherId,
    );
    console.log('✅ Observación estructurada creada en documento:', obsDocId);

    // Test 2: Obtener observaciones estructuradas
    console.log('\n2. Testing structured observations retrieval...');
    const retrievedObs = await attendanceService.getStructuredObservations(
      testDate,
      testClassId,
      testTeacherId,
    );

    console.log(`✅ Observaciones recuperadas: ${retrievedObs.length}`);
    retrievedObs.forEach((obs, index) => {
      console.log(`   Observación ${index + 1}:`, {
        id: obs.id,
        content: obs.content?.substring(0, 50) + '...',
        author: obs.author,
        type: obs.type,
        tags: obs.tags,
      });
    });

    return { obsDocId, retrievedObs };
  } catch (error) {
    console.error('❌ Error en test de observaciones:', error);
    throw error;
  }
}

/**
 * Test específico para debugging del modal de observaciones
 */
export async function testObservationModal() {
  console.log('=== TEST DE DEBUGGING DEL MODAL DE OBSERVACIONES ===');

  try {
    // Simular el flujo de eventos que debería ocurrir
    console.log('\n1. Simulando evento de apertura del modal...');

    // Verificar si el elemento del modal existe
    const modalElement =
      document.querySelector('[data-testid="attendance-observation-modal"]') ||
      document.querySelector('.attendance-observation-modal') ||
      document.querySelector('#attendanceObservationModal');

    console.log('Modal element found:', modalElement ? 'YES' : 'NO');

    if (modalElement) {
      console.log('Modal element details:', {
        tagName: modalElement.tagName,
        className: modalElement.className,
        id: modalElement.id,
        display: window.getComputedStyle(modalElement).display,
        visibility: window.getComputedStyle(modalElement).visibility,
        opacity: window.getComputedStyle(modalElement).opacity,
      });
    }

    // Verificar el estado de Vue components
    console.log('\n2. Verificando estado de componentes Vue...');

    // Buscar instancias de Vue en el DOM
    const vueElements = document.querySelectorAll('[data-v-]');
    console.log('Vue elements found:', vueElements.length);

    // Verificar si hay variables reactivas relacionadas con el modal
    if ((window as any).Vue || (window as any).__VUE__) {
      console.log('Vue instance found in window');
    }

    return {
      modalFound: !!modalElement,
      modalDetails: modalElement
        ? {
          display: window.getComputedStyle(modalElement).display,
          visibility: window.getComputedStyle(modalElement).visibility,
        }
        : null,
    };
  } catch (error) {
    console.error('❌ Error en test de modal:', error);
    throw error;
  }
}

/**
 * Test específico para diagnosticar el flujo completo del modal de observaciones
 */
export async function debugObservationFlow() {
  console.log('=== DEBUG DEL FLUJO DE OBSERVACIONES ===');

  try {
    // 1. Verificar el estado inicial
    console.log('\n1. Estado inicial del DOM...');

    // Buscar el botón de observaciones
    const observationButtons = document.querySelectorAll(
      '[data-testid*="observation"], button[title*="Observacion"], button[aria-label*="Observacion"]',
    );
    console.log('Botones de observación encontrados:', observationButtons.length);

    observationButtons.forEach((btn, index) => {
      console.log(`  Botón ${index + 1}:`, {
        text: btn.textContent?.trim(),
        classes: btn.className,
        id: btn.id,
        testId: btn.getAttribute('data-testid'),
        title: btn.getAttribute('title'),
        ariaLabel: btn.getAttribute('aria-label'),
      });
    });

    // 2. Verificar modales existentes
    console.log('\n2. Modales de observaciones en el DOM...');
    const observationModals = document.querySelectorAll(
      '[data-testid*="observation"], .attendance-observation, #attendanceObservation',
    );
    console.log('Modales de observación encontrados:', observationModals.length);

    observationModals.forEach((modal, index) => {
      const styles = window.getComputedStyle(modal);
      console.log(`  Modal ${index + 1}:`, {
        classes: modal.className,
        id: modal.id,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
      });
    });

    // 3. Verificar variables reactivas de Vue
    console.log('\n3. Variables reactivas relacionadas...');

    // Buscar elementos con datos de Vue
    const vueDataElements = document.querySelectorAll('[data-v-]');
    console.log('Elementos con datos de Vue:', vueDataElements.length);

    // 4. Simular click en el botón si existe
    if (observationButtons.length > 0) {
      console.log('\n4. Simulando click en el primer botón de observaciones...');
      const firstButton = observationButtons[0] as HTMLElement;

      // Verificar si el botón está habilitado
      const isDisabled =
        firstButton.hasAttribute('disabled') || firstButton.getAttribute('aria-disabled') === 'true';
      console.log('Botón habilitado:', !isDisabled);

      if (!isDisabled) {
        // Simular el evento de click
        firstButton.click();

        // Esperar un momento para que Vue procese el cambio
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verificar si algún modal apareció
        console.log('\n5. Estado después del click...');
        const modalsAfterClick = document.querySelectorAll(
          '[data-testid*="observation"], .attendance-observation, #attendanceObservation',
        );

        modalsAfterClick.forEach((modal, index) => {
          const styles = window.getComputedStyle(modal);
          console.log(`  Modal ${index + 1} después del click:`, {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
          });
        });
      }
    }

    return {
      buttonsFound: observationButtons.length,
      modalsFound: observationModals.length,
      vueElementsFound: vueDataElements.length,
    };
  } catch (error) {
    console.error('❌ Error en debug del flujo:', error);
    throw error;
  }
}

/**
 * Test específico para verificar el historial de observaciones
 */
export async function testObservationHistory() {
  console.log('=== TEST DEL HISTORIAL DE OBSERVACIONES ===');

  try {
    // 1. Verificar que el componente ObservationsHistory existe
    console.log('\n1. Verificando componente ObservationsHistory...');
    const historyComponents = document.querySelectorAll(
      '.observations-history, [class*="ObservationsHistory"]',
    );
    console.log('Componentes de historial encontrados:', historyComponents.length);

    if (historyComponents.length === 0) {
      console.warn('⚠️ No se encontró el componente ObservationsHistory en el DOM');
    }

    // 2. Verificar si hay observaciones cargadas
    console.log('\n2. Verificando contenido del historial...');
    const observationItems = document.querySelectorAll('.observation-text, [class*="observation"]');
    console.log('Items de observaciones encontrados:', observationItems.length);

    observationItems.forEach((item, index) => {
      console.log(`   Observación ${index + 1}:`, {
        text: item.textContent?.trim().substring(0, 100) + '...',
        className: item.className,
      });
    });
    // 3. Verificar estado de carga
    console.log('\n3. Verificando estados de carga...');
    const loadingIndicators = document.querySelectorAll('.animate-spin, [class*="loading"]');
    const errorMessages = document.querySelectorAll(
      '.text-red-700, .text-red-500, [class*="error"]',
    );
    const emptyStates = document.querySelectorAll('[class*="empty"], [class*="no-observations"]');

    console.log('Indicadores de carga:', loadingIndicators.length);
    console.log('Mensajes de error:', errorMessages.length);
    console.log('Estados vacíos:', emptyStates.length);

    // 4. Verificar estructura de datos
    console.log('\n4. Verificando estructura de datos de observaciones...');

    // Simular una función que verificaría las observaciones en el store
    if ((window as any).Vue && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('Vue DevTools detectado - las observaciones pueden revisarse allí');
    }

    // 5. Test específico del historial
    console.log('\n5. Verificando funcionalidad del historial...');

    // Buscar botones de edición o acciones en las observaciones
    const actionButtons = document.querySelectorAll(
      'button[title*="Editar"], button[aria-label*="edit"], .edit-observation',
    );
    console.log('Botones de acción encontrados:', actionButtons.length);

    // Buscar imágenes en las observaciones
    const observationImages = document.querySelectorAll('.observation img, .image-gallery img');
    console.log('Imágenes en observaciones:', observationImages.length);

    return {
      historyComponentsFound: historyComponents.length,
      observationItemsFound: observationItems.length,
      isLoading: loadingIndicators.length > 0,
      hasErrors: errorMessages.length > 0,
      isEmpty: emptyStates.length > 0,
      hasActionButtons: actionButtons.length > 0,
      hasImages: observationImages.length > 0,
    };
  } catch (error) {
    console.error('❌ Error en test del historial:', error);
    throw error;
  }
}

/**
 * Test para verificar la comunicación entre el modal y el historial
 */
export async function testObservationModalHistoryIntegration() {
  console.log('=== TEST DE INTEGRACIÓN MODAL-HISTORIAL ===');

  try {
    // 1. Verificar que ambos componentes estén presentes
    console.log('\n1. Verificando presencia de componentes...');

    const modal = document.querySelector(
      '[class*="AttendanceObservation"], .attendance-observation-modal',
    );
    const history = document.querySelector('.observations-history, [class*="ObservationsHistory"]');

    console.log('Modal presente:', !!modal);
    console.log('Historial presente:', !!history);

    if (modal && history) {
      console.log('✅ Ambos componentes están presentes');
      // 2. Verificar tabs o navegación entre secciones
      console.log('\n2. Verificando navegación entre secciones...');
      const tabs = document.querySelectorAll('button[role="tab"], .tab-button, [class*="tab"]');
      console.log('Tabs encontrados:', tabs.length);

      tabs.forEach((tab, index) => {
        console.log(`   Tab ${index + 1}:`, {
          text: tab.textContent?.trim(),
          isActive:
            tab.classList.contains('active') || tab.getAttribute('aria-selected') === 'true',
          className: tab.className,
        });
      });

      // 3. Simular navegación si hay tabs
      if (tabs.length >= 2) {
        console.log('\n3. Simulando navegación a historial...');
        const historyTab = Array.from(tabs).find(
          (tab) =>
            tab.textContent?.toLowerCase().includes('historial') ||
            tab.textContent?.toLowerCase().includes('history'),
        );

        if (historyTab) {
          console.log('Tab de historial encontrado, simulando click...')
          ;(historyTab as HTMLElement).click();

          // Esperar un momento para que se procese
          await new Promise((resolve) => setTimeout(resolve, 200));
          console.log('Click simulado en tab de historial');
        }
      }

      return {
        modalPresent: !!modal,
        historyPresent: !!history,
        tabsFound: tabs.length,
        integration: !!(modal && history),
      };
    } else {
      console.warn('⚠️ Uno o ambos componentes no están presentes');
      return {
        modalPresent: !!modal,
        historyPresent: !!history,
        tabsFound: 0,
        integration: false,
      };
    }
  } catch (error) {
    console.error('❌ Error en test de integración:', error);
    throw error;
  }
}

/**
 * Función para crear el debugging global en el navegador
 */
export function createBrowserDebugFunction() {
  // Función de debugging completa disponible en window
  ;(window as any).debugObservationIssue = async () => {
    console.log('🔍 === DIAGNÓSTICO COMPLETO DEL SISTEMA DE OBSERVACIONES ===');

    try {
      // 1. Test del modal
      console.log('\n📋 1. Testing Modal de Observaciones...');
      const modalResult = await testObservationModal();

      // 2. Test del flujo completo
      console.log('\n🔄 2. Testing Flujo Completo...');
      const flowResult = await debugObservationFlow();

      // 3. Test del historial
      console.log('\n📚 3. Testing Historial de Observaciones...');
      const historyResult = await testObservationHistory();

      // 4. Test de integración
      console.log('\n🔗 4. Testing Integración Modal-Historial...');
      const integrationResult = await testObservationModalHistoryIntegration();

      // 5. Resumen final
      console.log('\n📊 === RESUMEN DEL DIAGNÓSTICO ===');
      console.log('Modal encontrado:', modalResult.modalFound);
      console.log('Botones encontrados:', flowResult.buttonsFound);
      console.log('Componentes de historial:', historyResult.historyComponentsFound);
      console.log('Integración funcionando:', integrationResult.integration);

      // 6. Recomendaciones
      console.log('\n💡 === RECOMENDACIONES ===');
      if (!modalResult.modalFound) {
        console.log(
          '⚠️ Modal no encontrado - verificar que el componente AttendanceObservation esté montado',
        );
      }
      if (flowResult.buttonsFound === 0) {
        console.log(
          '⚠️ Botones de observación no encontrados - verificar el componente AttendanceList',
        );
      }
      if (historyResult.historyComponentsFound === 0) {
        console.log('⚠️ Componente de historial no encontrado - verificar ObservationsHistory');
      }
      if (!integrationResult.integration) {
        console.log('⚠️ Integración modal-historial no funciona correctamente');
      }

      return {
        modal: modalResult,
        flow: flowResult,
        history: historyResult,
        integration: integrationResult,
      };
    } catch (error) {
      console.error('❌ Error durante el diagnóstico:', error);
      return { error: error.message };
    }
  }

  // Función adicional para testing rápido del sistema de observaciones
  ;(window as any).testObservations = async () => {
    console.log('🧪 Testing rápido del sistema de observaciones...');
    try {
      const result = await testObservationSystem();
      console.log('✅ Test completado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en test:', error);
      return { error: error.message };
    }
  };

  console.log('🔧 Funciones de debugging creadas:');
  console.log('   - window.debugObservationIssue() - Diagnóstico completo');
  console.log('   - window.testObservations() - Test rápido del sistema');
}

/**
 * Función específica para debugging en tiempo real del modal de observaciones
 */
export function createObservationModalDebugger() {
  // Crear función de debugging específica para el modal
  ;(window as any).debugModalObservationsIssue = () => {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO DEL MODAL DE OBSERVACIONES ===');

    // 1. Verificar si el botón de observaciones existe
    console.log('\n📍 1. VERIFICANDO BOTÓN DE OBSERVACIONES');
    const observationButton = document.querySelector(
      '[title*="Observacion"], button[aria-label*="Observacion"], button:contains("Observación")',
    );
    console.log('Botón de observaciones encontrado:', !!observationButton);

    if (observationButton) {
      console.log('Detalles del botón:', {
        text: observationButton.textContent?.trim(),
        disabled: observationButton.hasAttribute('disabled'),
        className: observationButton.className,
        onclick: observationButton.getAttribute('onclick'),
        clickHandlers: observationButton.onclick,
      });
    }

    // 2. Verificar si el modal existe en el DOM
    console.log('\n📍 2. VERIFICANDO MODAL EN EL DOM');
    const modalSelectors = [
      '[v-if="modelValue"]',
      '.attendance-observation',
      '[class*="AttendanceObservation"]',
      'div[class*="fixed inset-0"][class*="z-50"]',
    ];

    modalSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      console.log(`Elementos con selector "${selector}":`, elements.length);

      elements.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        console.log(`  Elemento ${index + 1}:`, {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          className: el.className,
        });
      });
    });

    // 3. Verificar variables reactivas de Vue
    console.log('\n📍 3. VERIFICANDO ESTADO DE VUE');

    // Buscar componentes Vue montados
    const vueComponents = document.querySelectorAll('[data-v-]');
    console.log('Componentes Vue encontrados:', vueComponents.length);

    // Buscar específicamente el componente AttendanceObservation
    const attendanceObservationComponents = document.querySelectorAll(
      '[class*="AttendanceObservation"], [data-testid*="attendance-observation"]',
    );
    console.log('Componentes AttendanceObservation:', attendanceObservationComponents.length);

    // 4. Verificar el estado del store de attendance
    console.log('\n📍 4. VERIFICANDO STORE DE ATTENDANCE');

    try {
      // Intentar acceder al store si está disponible globalmente
      if ((window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('Vue DevTools disponible - verificar store allí');
      }

      // Verificar si hay variables reactivas en el window
      const potentialStoreVars = Object.keys(window).filter(
        (key) => key.includes('store') || key.includes('attendance') || key.includes('modal'),
      );
      console.log('Variables potenciales del store en window:', potentialStoreVars);
    } catch (error) {
      console.log('No se pudo acceder al store directamente');
    }

    // 5. Simular click y verificar eventos
    console.log('\n📍 5. SIMULANDO INTERACCIÓN');

    if (observationButton) {
      console.log('Simulando click en botón de observaciones...');

      // Agregar listener temporal para eventos
      const eventListener = (e: Event) => {
        console.log('Evento capturado:', e.type, e);
      };

      observationButton.addEventListener('click', eventListener)

      // Simular el click
      ;(observationButton as HTMLElement).click();

      // Esperar un momento y verificar cambios
      setTimeout(() => {
        console.log('\n📍 6. ESTADO DESPUÉS DEL CLICK');

        // Verificar de nuevo si el modal apareció
        const modalAfterClick = document.querySelectorAll(
          'div[class*="fixed inset-0"][class*="z-50"]',
        );
        console.log('Modales después del click:', modalAfterClick.length);

        modalAfterClick.forEach((modal, index) => {
          const styles = window.getComputedStyle(modal);
          console.log(`Modal ${index + 1} después del click:`, {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            content: modal.textContent?.substring(0, 100) + '...',
          });
        });

        // Remover listener
        observationButton.removeEventListener('click', eventListener);

        // 7. Recomendaciones
        console.log('\n📍 7. RECOMENDACIONES');

        if (modalAfterClick.length === 0) {
          console.log('❌ El modal no apareció después del click');
          console.log('🔧 Posibles causas:');
          console.log('   - La variable reactiva showObservationsModal no se está actualizando');
          console.log('   - El evento click no se está propagando correctamente');
          console.log('   - Hay un error JavaScript que impide la apertura');
          console.log('   - El componente modal no está montado en el DOM');
        } else {
          console.log('✅ Modal encontrado - verificar estilos CSS');
        }
      }, 500);
    } else {
      console.log('❌ No se encontró botón de observaciones para simular click');
    }

    return {
      buttonFound: !!observationButton,
      modalElements: modalSelectors.map((sel) => document.querySelectorAll(sel).length),
      vueComponents: vueComponents.length,
    };
  }

  // Función para inspeccionar el estado específico de un componente
  ;(window as any).inspectAttendanceView = () => {
    console.log('🔍 === INSPECCIONANDO ATTENDANCEVIEW ===');

    // Buscar el elemento raíz de AttendanceView
    const attendanceViewElements = document.querySelectorAll(
      '[class*="AttendanceView"], [data-testid*="attendance-view"]',
    );
    console.log('Elementos AttendanceView encontrados:', attendanceViewElements.length);

    // Buscar elementos relacionados con observaciones
    const observationElements = document.querySelectorAll(
      '[data-testid*="observation"], [class*="observation"], button[title*="Observ"]',
    );
    console.log('Elementos relacionados con observaciones:', observationElements.length);

    observationElements.forEach((el, index) => {
      console.log(`Elemento ${index + 1}:`, {
        tagName: el.tagName,
        text: el.textContent?.trim(),
        classes: el.className,
        id: el.id,
        type: el.getAttribute('type'),
        disabled: el.hasAttribute('disabled'),
      });
    });

    return {
      attendanceViewElements: attendanceViewElements.length,
      observationElements: observationElements.length,
    };
  }

  // Función para verificar el flujo de eventos desde AttendanceList
  ;(window as any).debugAttendanceListEvents = () => {
    console.log('🔍 === DEBUGGING EVENTOS DE ATTENDANCELIST ===');

    // Buscar el componente AttendanceList
    const attendanceListElements = document.querySelectorAll('[class*="AttendanceList"]');
    console.log('Elementos AttendanceList encontrados:', attendanceListElements.length);

    // Buscar específicamente el botón de observaciones en AttendanceList
    const observationButtons = document.querySelectorAll(
      'button[title*="Observ"], button[aria-label*="observ"]',
    );
    console.log('Botones de observación encontrados:', observationButtons.length);

    observationButtons.forEach((btn, index) => {
      console.log(`Botón ${index + 1}:`, {
        text: btn.textContent?.trim(),
        title: btn.getAttribute('title'),
        ariaLabel: btn.getAttribute('aria-label'),
        onclick: btn.getAttribute('onclick'),
        disabled: btn.hasAttribute('disabled'),
        parent: btn.parentElement?.className,
      });

      // Agregar listener temporal para debugging
      const debugListener = (e: Event) => {
        console.log(`🎯 Click detectado en botón ${index + 1}:`, {
          target: e.target,
          currentTarget: e.currentTarget,
          bubbles: e.bubbles,
          cancelable: e.cancelable,
        });
      };

      btn.addEventListener('click', debugListener, { once: true });
    });

    return {
      attendanceListElements: attendanceListElements.length,
      observationButtons: observationButtons.length,
    };
  };

  console.log('🔧 Funciones de debugging específicas creadas:');
  console.log('   - window.debugModalObservationsIssue() - Diagnóstico completo del modal');
  console.log('   - window.inspectAttendanceView() - Inspeccionar AttendanceView');
  console.log('   - window.debugAttendanceListEvents() - Debug eventos de AttendanceList');
}

// Función para verificar el estado de las variables reactivas de Vue
export function createVueStateInspector() {
  ;(window as any).inspectVueState = () => {
    console.log('🔍 === INSPECTOR DE ESTADO DE VUE ===');

    // Intentar encontrar la instancia de Vue
    const vueApp = (window as any).__VUE_APP__;
    if (vueApp) {
      console.log('Aplicación Vue encontrada:', vueApp);
    }

    // Buscar elementos Vue en el DOM
    const vueElements = document.querySelectorAll('[data-v-]');
    console.log('Elementos con datos Vue:', vueElements.length);

    // Intentar acceder al Vue DevTools
    const devtools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (devtools) {
      console.log('Vue DevTools disponible');
      console.log('Apps registradas:', devtools.apps?.length || 0);
    }

    // Buscar específicamente variables relacionadas con modales
    const potentialModalVars = [
      'showObservationsModal',
      'showModal',
      'modalOpen',
      'isVisible',
      'modelValue',
    ];

    console.log('Variables potenciales de modales a buscar:', potentialModalVars);

    return {
      vueElements: vueElements.length,
      hasDevtools: !!devtools,
      hasVueApp: !!vueApp,
    };
  };

  console.log('🔧 Inspector de estado Vue creado:');
  console.log('   - window.inspectVueState() - Inspeccionar estado de Vue');
}

/**
 * RESUMEN EJECUTIVO - FUNCIONES DE DEBUGGING DISPONIBLES
 *
 * 1. DESDE LA CONSOLA DEL NAVEGADOR (recomendado para debugging inmediato):
 *    - window.debugObservationIssue()
 *      → Diagnóstico completo del modal de observaciones
 *
 * 2. DESDE CÓDIGO TYPESCRIPT (para testing programático):
 *    - testAttendanceSystem() → Test completo del sistema de asistencias
 *    - testObservationSystem() → Test específico de observaciones estructuradas
 *    - testObservationModal() → Test específico del modal de observaciones
 *    - debugObservationFlow() → Debug completo del flujo de observaciones
 *    - testTeacherFiltering() → Test de filtrado por profesor
 *    - testStoreDebugging() → Test de debugging del store
 *
 * INSTRUCCIONES DE USO:
 *
 * A. Para diagnostic inmediato en el navegador:
 *    1. Abre las herramientas de desarrollador (F12)
 *    2. Ve a la pestaña Console
 *    3. Ejecuta: window.debugObservationIssue()
 *    4. Revisa los logs detallados que aparecen
 *
 * B. Para testing programático:
 *    1. Importa las funciones desde este archivo
 *    2. Ejecuta la función que necesites
 *    3. Revisa los resultados en consola
 *
 * EJEMPLO DE USO EN COMPONENTE VUE:
 *
 * import { testObservationSystem, debugObservationFlow } from '@/utils/testAttendanceSystem'
 *
 * // En el método o función donde quieras testear
 * const runDiagnostic = async () => {
 *   await testObservationSystem()
 *   await debugObservationFlow()
 * }
 */
export const DEBUGGING_INSTRUCTIONS = {
  immediate: 'window.debugObservationIssue()',
  programmatic: [
    'testAttendanceSystem()',
    'testObservationSystem()',
    'testObservationModal()',
    'debugObservationFlow()',
  ],
  description: 'Funciones de debugging para diagnosticar el problema del modal de observaciones',
};
