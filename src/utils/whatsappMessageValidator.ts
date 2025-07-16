// Sistema de Verificación de Mensajes WhatsApp
// Este archivo contiene utilidades para validar y verificar el sistema de mensajería

export class WhatsAppMessageValidator {
  
  /**
   * Valida que los estudiantes seleccionados tengan números de teléfono válidos
   */
  static validateStudentPhoneNumbers(students) {
    const validationResults = {
      valid: [],
      invalid: [],
      warnings: [],
    };

    students.forEach(student => {
      const phoneData = {
        id: student.id,
        name: `${student.nombre} ${student.apellido}`,
        madre: student.phoneNumbers?.madre || student.numero_telefono_madre,
        padre: student.phoneNumbers?.padre || student.numero_telefono_padre,
      };

      // Validar formato de números telefónicos
      const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
      
      let hasValidPhone = false;
      
      if (phoneData.madre) {
        const cleanMadre = phoneData.madre.replace(/[\s\-\(\)]/g, '');
        if (phoneRegex.test(cleanMadre)) {
          hasValidPhone = true;
          phoneData.madreValid = true;
        } else {
          phoneData.madreValid = false;
          validationResults.warnings.push(`${phoneData.name}: Número de madre inválido (${phoneData.madre})`);
        }
      }

      if (phoneData.padre) {
        const cleanPadre = phoneData.padre.replace(/[\s\-\(\)]/g, '');
        if (phoneRegex.test(cleanPadre)) {
          hasValidPhone = true;
          phoneData.padreValid = true;
        } else {
          phoneData.padreValid = false;
          validationResults.warnings.push(`${phoneData.name}: Número de padre inválido (${phoneData.padre})`);
        }
      }

      if (hasValidPhone) {
        validationResults.valid.push(phoneData);
      } else {
        validationResults.invalid.push(phoneData);
      }
    });

    return validationResults;
  }

  /**
   * Valida el contenido del mensaje
   */
  static validateMessageContent(message, variables = {}) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      processedMessage: message,
    };

    // Verificar que el mensaje no esté vacío
    if (!message || message.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('El mensaje no puede estar vacío');
      return validation;
    }

    // Verificar longitud del mensaje (WhatsApp tiene límites)
    if (message.length > 4000) {
      validation.warnings.push('El mensaje es muy largo, podría ser truncado por WhatsApp');
    }

    // Verificar variables requeridas
    const requiredVariables = ['studentName', 'date', 'academyName'];
    const missingVariables = [];

    requiredVariables.forEach(variable => {
      if (message.includes(`{${variable}}`) && !variables[variable]) {
        missingVariables.push(variable);
      }
    });

    if (missingVariables.length > 0) {
      validation.warnings.push(`Variables sin definir: ${missingVariables.join(', ')}`);
    }

    // Procesar mensaje con variables
    let processedMessage = message;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedMessage = processedMessage.replace(regex, variables[key] || `[${key}]`);
    });

    validation.processedMessage = processedMessage;

    return validation;
  }

  /**
   * Verifica que los estudiantes correspondan al tipo de notificación
   */
  static validateStudentNotificationType(students, notificationType) {
    const validation = {
      correct: [],
      incorrect: [],
      warnings: [],
    };

    students.forEach(student => {
      switch (notificationType) {
      case 'ausentes':
        if (student.status === 'ausente' || student.status === 'absent') {
          validation.correct.push(student);
        } else {
          validation.incorrect.push(student);
          validation.warnings.push(`${student.nombre} ${student.apellido} no está marcado como ausente`);
        }
        break;

      case 'tarde':
        if (student.status === 'tarde' || student.status === 'late' || student.time) {
          validation.correct.push(student);
        } else {
          validation.incorrect.push(student);
          validation.warnings.push(`${student.nombre} ${student.apellido} no está marcado como tarde`);
        }
        break;

      case 'justificado':
        if (student.status === 'justificado' || student.status === 'justified' || student.reason) {
          validation.correct.push(student);
        } else {
          validation.incorrect.push(student);
          validation.warnings.push(`${student.nombre} ${student.apellido} no tiene justificación registrada`);
        }
        break;

      default:
        validation.incorrect.push(student);
        validation.warnings.push(`Tipo de notificación desconocido: ${notificationType}`);
      }
    });

    return validation;
  }

  /**
   * Genera un reporte completo de verificación
   */
  static generateVerificationReport(selectedRecipients, message, notificationType) {
    const report = {
      timestamp: new Date().toISOString(),
      notificationType,
      totalRecipients: selectedRecipients.length,
      validations: {
        phones: null,
        message: null,
        students: null,
      },
      recommendations: [],
      canProceed: true,
    };

    // Validar números de teléfono
    const students = selectedRecipients.map(r => r.studentData);
    report.validations.phones = this.validateStudentPhoneNumbers(students);

    // Validar mensaje
    const sampleRecipient = selectedRecipients[0];
    const variables = sampleRecipient ? {
      studentName: `${sampleRecipient.studentData.nombre} ${sampleRecipient.studentData.apellido}`,
      parentType: sampleRecipient.recipientType === 'madre' ? 'Madre' : 'Padre',
      date: new Date().toLocaleDateString('es-ES'),
      academyName: 'Music Academy',
    } : {};

    report.validations.message = this.validateMessageContent(message, variables);

    // Validar estudiantes
    report.validations.students = this.validateStudentNotificationType(students, notificationType);

    // Generar recomendaciones
    if (report.validations.phones.invalid.length > 0) {
      report.recommendations.push(`${report.validations.phones.invalid.length} estudiantes sin números válidos`);
      report.canProceed = false;
    }

    if (report.validations.students.incorrect.length > 0) {
      report.recommendations.push(`${report.validations.students.incorrect.length} estudiantes no corresponden al tipo de notificación`);
    }

    if (!report.validations.message.isValid) {
      report.recommendations.push('El mensaje contiene errores que deben corregirse');
      report.canProceed = false;
    }

    return report;
  }
}

// Función para mostrar el reporte de verificación en la consola
export function logVerificationReport(report) {
  console.group('📋 Reporte de Verificación WhatsApp');
  
  console.log('📊 Resumen:');
  console.log(`   • Tipo: ${report.notificationType}`);
  console.log(`   • Destinatarios: ${report.totalRecipients}`);
  console.log(`   • Puede proceder: ${report.canProceed ? '✅' : '❌'}`);
  
  console.log('\n📱 Validación de Teléfonos:');
  console.log(`   • Válidos: ${report.validations.phones.valid.length}`);
  console.log(`   • Inválidos: ${report.validations.phones.invalid.length}`);
  
  if (report.validations.phones.warnings.length > 0) {
    console.warn('   ⚠️ Advertencias:');
    report.validations.phones.warnings.forEach(warning => {
      console.warn(`     - ${warning}`);
    });
  }
  
  console.log('\n📝 Validación de Mensaje:');
  console.log(`   • Válido: ${report.validations.message.isValid ? '✅' : '❌'}`);
  console.log(`   • Longitud: ${report.validations.message.processedMessage.length} caracteres`);
  
  if (report.validations.message.errors.length > 0) {
    console.error('   ❌ Errores:');
    report.validations.message.errors.forEach(error => {
      console.error(`     - ${error}`);
    });
  }
  
  console.log('\n👥 Validación de Estudiantes:');
  console.log(`   • Correctos: ${report.validations.students.correct.length}`);
  console.log(`   • Incorrectos: ${report.validations.students.incorrect.length}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:');
    report.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }
  
  console.groupEnd();
  
  return report;
}
