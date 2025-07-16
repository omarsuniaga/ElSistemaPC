// Motor de Renderizado de Plantillas
// Procesa variables y genera mensajes personalizados

import { MessageTemplate, MessageVariable, GLOBAL_VARIABLES } from './templateManager';

// Interfaces
interface RenderContext {
  student?: {
    id: string
    nombre: string
    apellido: string
    tlf_madre?: string
    tlf_padre?: string
  }
  class?: {
    id: string
    name: string
    teacherId: string
    teacherName?: string
  }
  attendance?: {
    date: string
    time: string
    status: string
    observations?: string
  }
  escalation?: {
    level: number
    weeklyAbsences: number
    totalAbsences: number
  }
  custom?: Record<string, string | number | Date>
}

interface RenderResult {
  success: boolean
  content: string
  subject?: string
  variables: Record<string, string>
  errors: string[]
  warnings: string[]
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingRequired: string[]
  unresolvedVariables: string[]
}

/**
 * Clase principal para renderizado de plantillas
 */
export class TemplateRenderer {
  /**
   * Renderiza una plantilla con el contexto proporcionado
   */
  render(template: MessageTemplate, context: RenderContext): RenderResult {
    console.log(`🎨 Template Renderer - Renderizando: ${template.name}`);

    const result: RenderResult = {
      success: false,
      content: '',
      subject: '',
      variables: {},
      errors: [],
      warnings: [],
    };

    try {
      // Validar plantilla
      const validation = this.validateTemplate(template, context);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Recopilar warnings
      result.warnings = validation.warnings;

      // Construir diccionario de variables
      const variables = this.buildVariableDictionary(context, template.variables);
      result.variables = variables;

      // Renderizar contenido
      result.content = this.replaceVariables(template.content, variables);

      // Renderizar subject si existe
      if (template.subject) {
        result.subject = this.replaceVariables(template.subject, variables);
      }

      // Verificar que no queden variables sin resolver
      const unresolvedInContent = this.findUnresolvedVariables(result.content);
      const unresolvedInSubject = template.subject
        ? this.findUnresolvedVariables(result.subject)
        : [];

      if (unresolvedInContent.length > 0 || unresolvedInSubject.length > 0) {
        result.warnings.push(
          `Variables sin resolver: ${[...unresolvedInContent, ...unresolvedInSubject].join(', ')}`,
        );
      }

      result.success = true;
      console.log('✅ Template Renderer - Renderizado exitoso');
    } catch (error) {
      console.error('Error renderizando plantilla:', error);
      result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
    }

    return result;
  }

  /**
   * Valida una plantilla antes del renderizado
   */
  private validateTemplate(template: MessageTemplate, context: RenderContext): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      unresolvedVariables: [],
    };

    // Verificar que la plantilla tenga contenido
    if (!template.content || template.content.trim() === '') {
      result.errors.push('La plantilla no tiene contenido');
      result.isValid = false;
    }

    // Verificar variables requeridas
    const requiredVariables = template.variables.filter((v) => v.required);
    for (const variable of requiredVariables) {
      if (!this.canResolveVariable(variable.key, context)) {
        result.missingRequired.push(variable.key);
        result.errors.push(`Variable requerida faltante: ${variable.label} (${variable.key})`);
        result.isValid = false;
      }
    }

    // Encontrar variables en el contenido que no estén definidas
    const variablesInContent = this.extractVariables(template.content);
    const definedVariableKeys = template.variables.map((v) => v.key);
    const globalVariableKeys = GLOBAL_VARIABLES.map((v) => v.key);
    const allDefinedKeys = [...definedVariableKeys, ...globalVariableKeys];

    for (const varName of variablesInContent) {
      if (!allDefinedKeys.includes(varName)) {
        result.warnings.push(`Variable no definida encontrada: {${varName}}`);
        result.unresolvedVariables.push(varName);
      }
    }

    return result;
  }

  /**
   * Construye el diccionario de variables desde el contexto
   */
  private buildVariableDictionary(
    context: RenderContext,
    templateVariables: MessageVariable[],
  ): Record<string, string> {
    const variables: Record<string, string> = {};

    // Agregar variables globales
    for (const globalVar of GLOBAL_VARIABLES) {
      const value = this.resolveGlobalVariable(globalVar, context);
      if (value !== null) {
        variables[globalVar.key] = value;
      }
    }

    // Agregar variables específicas de la plantilla
    for (const templateVar of templateVariables) {
      const value = this.resolveVariable(templateVar, context);
      if (value !== null) {
        variables[templateVar.key] = value;
      }
    }

    return variables;
  }

  /**
   * Resuelve una variable global
   */
  private resolveGlobalVariable(variable: MessageVariable, context: RenderContext): string | null {
    switch (variable.key) {
    case 'studentName':
      return context.student
        ? `${context.student.nombre} ${context.student.apellido}`.trim()
        : null;

    case 'studentFirstName':
      return context.student?.nombre || null;

    case 'className':
      return context.class?.name || null;

    case 'teacherName':
      return context.class?.teacherName || null;

    case 'date':
      return context.attendance?.date
        ? new Date(context.attendance.date).toLocaleDateString('es-ES')
        : new Date().toLocaleDateString('es-ES');

    case 'time':
      return context.attendance?.time
        ? new Date(context.attendance.time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
        : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    case 'dayOfWeek':
      const date = context.attendance?.date ? new Date(context.attendance.date) : new Date();
      return date.toLocaleDateString('es-ES', { weekday: 'long' });

    case 'academyName':
      return variable.defaultValue || 'Academia Musical El Sistema';

    case 'contactPhone':
      return variable.defaultValue || '+58 (XXX) XXX-XXXX';

    case 'nextClassDate':
      // Calcular próxima clase (simplificado - en producción esto vendría de la base de datos)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7); // Próxima semana
      return nextDate.toLocaleDateString('es-ES');

    case 'absenceCount':
      return context.escalation?.weeklyAbsences?.toString() || '0';

    case 'escalationLevel':
      return context.escalation?.level?.toString() || '1';

    default:
      return variable.defaultValue || null;
    }
  }

  /**
   * Resuelve una variable específica de plantilla
   */
  private resolveVariable(variable: MessageVariable, context: RenderContext): string | null {
    // Primero intentar resolver como variable global
    const globalValue = this.resolveGlobalVariable(variable, context);
    if (globalValue !== null) {
      return globalValue;
    }

    // Luego buscar en variables personalizadas
    if (context.custom && variable.key in context.custom) {
      const value = context.custom[variable.key];
      return typeof value === 'string' ? value : String(value);
    }

    // Finalmente usar valor por defecto
    return variable.defaultValue || null;
  }

  /**
   * Verifica si una variable puede ser resuelta
   */
  private canResolveVariable(variableKey: string, context: RenderContext): boolean {
    const globalVar = GLOBAL_VARIABLES.find((v) => v.key === variableKey);
    if (globalVar) {
      return this.resolveGlobalVariable(globalVar, context) !== null;
    }

    if (context.custom && variableKey in context.custom) {
      return true;
    }

    return false;
  }

  /**
   * Reemplaza variables en un texto
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;

    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Extrae nombres de variables de un texto
   */
  private extractVariables(text: string): string[] {
    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) return [];

    return matches.map((match) => match.slice(1, -1)); // Remover { y }
  }

  /**
   * Encuentra variables que no fueron resueltas
   */
  private findUnresolvedVariables(text: string): string[] {
    return this.extractVariables(text);
  }

  /**
   * Genera preview de una plantilla con datos de ejemplo
   */
  generatePreview(template: MessageTemplate): RenderResult {
    const sampleContext: RenderContext = {
      student: {
        id: 'sample-student-id',
        nombre: 'María',
        apellido: 'González Rodríguez',
        tlf_madre: '+58424123456',
        tlf_padre: '+58414987654',
      },
      class: {
        id: 'sample-class-id',
        name: 'Violín Intermedio',
        teacherId: 'sample-teacher-id',
        teacherName: 'Prof. Ana Martínez',
      },
      attendance: {
        date: new Date().toISOString(),
        time: new Date().toISOString(),
        status: 'Ausente',
      },
      escalation: {
        level: template.escalationLevel || 1,
        weeklyAbsences: 2,
        totalAbsences: 5,
      },
      custom: {
        customVariable: 'Valor personalizado',
      },
    };

    return this.render(template, sampleContext);
  }

  /**
   * Valida el formato de una plantilla sin renderizar
   */
  validateTemplateFormat(template: MessageTemplate): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      unresolvedVariables: [],
    };

    // Verificar sintaxis de variables
    const variablesInContent = this.extractVariables(template.content);
    const variablesInSubject = template.subject ? this.extractVariables(template.subject) : [];
    const allVariables = [...variablesInContent, ...variablesInSubject];

    // Verificar que todas las variables en el contenido estén definidas
    const definedKeys = template.variables.map((v) => v.key);
    const globalKeys = GLOBAL_VARIABLES.map((v) => v.key);
    const allDefinedKeys = [...definedKeys, ...globalKeys];

    for (const varName of allVariables) {
      if (!allDefinedKeys.includes(varName)) {
        result.warnings.push(`Variable no definida: {${varName}}`);
        result.unresolvedVariables.push(varName);
      }
    }

    // Verificar duplicados en variables de plantilla
    const variableKeys = template.variables.map((v) => v.key);
    const duplicates = variableKeys.filter((key, index) => variableKeys.indexOf(key) !== index);

    if (duplicates.length > 0) {
      result.errors.push(`Variables duplicadas: ${duplicates.join(', ')}`);
      result.isValid = false;
    }

    // Verificar que el contenido no esté vacío
    if (!template.content || template.content.trim() === '') {
      result.errors.push('El contenido de la plantilla no puede estar vacío');
      result.isValid = false;
    }

    // Verificar longitud del contenido
    if (template.content.length > 4096) {
      result.warnings.push('El contenido es muy largo para WhatsApp (>4096 caracteres)');
    }

    return result;
  }
}

// Instancia global
export const templateRenderer = new TemplateRenderer();

// Funciones helper para uso directo
export const renderTemplate = (template: MessageTemplate, context: RenderContext): RenderResult => {
  return templateRenderer.render(template, context);
};

export const generateTemplatePreview = (template: MessageTemplate): RenderResult => {
  return templateRenderer.generatePreview(template);
};

export const validateTemplate = (template: MessageTemplate): ValidationResult => {
  return templateRenderer.validateTemplateFormat(template);
};

export default {
  TemplateRenderer,
  templateRenderer,
  renderTemplate,
  generateTemplatePreview,
  validateTemplate,
};
