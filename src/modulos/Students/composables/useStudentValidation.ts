import { ref, computed, type Ref } from 'vue'
import type { Student } from '../types/student'

export const useStudentValidation = (student: Ref<Omit<Student, 'id'> & { id?: string }>) => {
  const validationErrors = ref<Record<string, string>>({})

  // Reglas de validación
  const validationRules = {
    nombre: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'El nombre es obligatorio'
      }
      if (value.trim().length < 2) {
        return 'El nombre debe tener al menos 2 caracteres'
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        return 'El nombre solo puede contener letras y espacios'
      }
      return ''
    },

    apellido: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'El apellido es obligatorio'
      }
      if (value.trim().length < 2) {
        return 'El apellido debe tener al menos 2 caracteres'
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        return 'El apellido solo puede contener letras y espacios'
      }
      return ''
    },

    edad: (value: string | number) => {
      if (!value) return '' // Campo opcional
      const edad = typeof value === 'string' ? parseInt(value) : value
      if (isNaN(edad)) {
        return 'La edad debe ser un número válido'
      }
      if (edad < 3 || edad > 99) {
        return 'La edad debe estar entre 3 y 99 años'
      }
      return ''
    },

    instrumento: (value: string) => {
      if (!value) return '' // Campo opcional
      if (value.trim().length < 2) {
        return 'El instrumento debe tener al menos 2 caracteres'
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        return 'El instrumento solo puede contener letras y espacios'
      }
      return ''
    },

    tlf: (value: string) => {
      if (!value) return '' // Campo opcional
      // Permitir formatos: (809) 123-4567, 809-123-4567, 8091234567
      const phoneRegex = /^(\(\d{3}\)\s?|\d{3}[-.]?)?\d{3}[-.]?\d{4}$/
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return 'Formato de teléfono inválido. Ejemplo: (809) 123-4567'
      }
      return ''
    },

    email: (value: string) => {
      if (!value) return '' // Campo opcional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Formato de email inválido'
      }
      return ''
    },

    direccion: (value: string) => {
      if (!value) return '' // Campo opcional
      if (value.trim().length < 5) {
        return 'La dirección debe tener al menos 5 caracteres'
      }
      return ''
    },

    observaciones: (value: string) => {
      if (!value) return '' // Campo opcional
      if (value.trim().length > 500) {
        return 'Las observaciones no pueden exceder 500 caracteres'
      }
      return ''
    },

    grupo: (value: string[] | string) => {
      // Campo opcional, pero si se proporciona debe ser válido
      if (!value) return ''
      if (Array.isArray(value) && value.length === 0) return ''
      return ''
    }
  }

  // Validar un campo específico
  const validateField = (fieldName: keyof typeof validationRules) => {
    const value = student.value[fieldName as keyof typeof student.value]
    const rule = validationRules[fieldName]
    
    if (rule) {
      const error = rule(value as any)
      if (error) {
        validationErrors.value[fieldName] = error
      } else {
        delete validationErrors.value[fieldName]
      }
    }
  }

  // Validar todo el formulario
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    Object.keys(validationRules).forEach((fieldName) => {
      const field = fieldName as keyof typeof validationRules
      const value = student.value[field as keyof typeof student.value]
      const rule = validationRules[field]
      
      if (rule) {
        const error = rule(value as any)
        if (error) {
          errors[field] = error
        }
      }
    })
    
    validationErrors.value = errors
    return Object.keys(errors).length === 0
  }

  // Computed para verificar si el formulario es válido
  const isFormValid = computed(() => {
    // Campos obligatorios
    const requiredFields = ['nombre', 'apellido']
    const hasRequiredFields = requiredFields.every(field => {
      const value = student.value[field as keyof typeof student.value]
      return value && typeof value === 'string' && value.trim().length > 0
    })

    // No debe haber errores de validación
    const hasNoErrors = Object.keys(validationErrors.value).length === 0

    return hasRequiredFields && hasNoErrors
  })

  // Limpiar errores de validación
  const clearValidationErrors = () => {
    validationErrors.value = {}
  }

  // Obtener mensaje de error para un campo
  const getFieldError = (fieldName: string) => {
    return validationErrors.value[fieldName] || ''
  }

  // Verificar si un campo tiene error
  const hasFieldError = (fieldName: string) => {
    return !!validationErrors.value[fieldName]
  }

  return {
    validationErrors,
    isFormValid,
    validateField,
    validateForm,
    clearValidationErrors,
    getFieldError,
    hasFieldError
  }
}
