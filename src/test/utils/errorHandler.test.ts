/**
 * Error Handler Tests
 * Unit tests for the error handling utility
 */

import {describe, it, expect, vi, beforeEach} from "vitest"
import {ErrorHandler, Logger, Validator} from "@/utils/errorHandler"

describe("ErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("handleError", () => {
    it("should handle Firebase auth errors correctly", () => {
      const firebaseError = {
        code: "auth/user-not-found",
        message: "There is no user record corresponding to this identifier.",
      }

      const result = ErrorHandler.handleError(firebaseError, "Authentication")

      expect(result.code).toBe("auth/user-not-found")
      expect(result.message).toBe("Usuario no encontrado")
      expect(result.details).toBe(firebaseError)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it("should handle Firestore errors correctly", () => {
      const firestoreError = {
        code: "firestore/permission-denied",
        message: "Missing or insufficient permissions.",
      }

      const result = ErrorHandler.handleError(firestoreError, "Database")

      expect(result.code).toBe("firestore/permission-denied")
      expect(result.message).toBe("No tienes permisos para esta operación")
    })

    it("should handle unknown errors with default message", () => {
      const unknownError = new Error("Something went wrong")

      const result = ErrorHandler.handleError(unknownError, "Unknown operation")

      expect(result.code).toBe("unknown")
      expect(result.message).toBe("Something went wrong")
    })

    it("should handle network errors", () => {
      const networkError = new Error("Network error")
      networkError.name = "NetworkError"

      const result = ErrorHandler.handleError(networkError, "Network operation")

      expect(result.code).toBe("network/offline")
      expect(result.message).toBe("Sin conexión a internet")
    })
  })

  describe("withErrorHandling", () => {
    it("should return data on successful operation", async () => {
      const mockOperation = vi.fn().mockResolvedValue("success")

      const result = await ErrorHandler.withErrorHandling(mockOperation, "Test operation")

      expect(result.data).toBe("success")
      expect(result.error).toBeNull()
      expect(mockOperation).toHaveBeenCalledOnce()
    })

    it("should return error on failed operation", async () => {
      const mockError = new Error("Operation failed")
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      const result = await ErrorHandler.withErrorHandling(mockOperation, "Test operation")

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        code: "unknown",
        message: "Operation failed",
        details: mockError,
        timestamp: expect.any(Date),
      })
    })
  })

  describe("useErrorHandler", () => {
    it("should provide reactive error state", () => {
      const {errorState, clearError, setLoading, handleError} = ErrorHandler.useErrorHandler()

      expect(errorState.value.error).toBeNull()
      expect(errorState.value.loading).toBe(false)

      // Test setting loading
      setLoading(true)
      expect(errorState.value.loading).toBe(true)

      // Test handling error
      const testError = new Error("Test error")
      handleError(testError, "Test context")
      expect(errorState.value.error).toEqual({
        code: "unknown",
        message: "Test error",
        details: testError,
        timestamp: expect.any(Date),
      })
      expect(errorState.value.loading).toBe(false)

      // Test clearing error
      clearError()
      expect(errorState.value.error).toBeNull()
    })

    it("should execute operations with error handling", async () => {
      const {executeWithErrorHandling} = ErrorHandler.useErrorHandler()
      const mockOperation = vi.fn().mockResolvedValue("result")

      const result = await executeWithErrorHandling(mockOperation, "Test operation")

      expect(result).toBe("result")
      expect(mockOperation).toHaveBeenCalledOnce()
    })
  })
})

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("should log debug messages in development", () => {
    // Mock development environment
    vi.stubGlobal("import", {meta: {env: {DEV: true}}})

    Logger.debug("Debug message", {data: "test"})

    expect(console.log).toHaveBeenCalledWith("[DEBUG] Debug message", {data: "test"})
  })

  it("should always log error messages", () => {
    Logger.error("Error message", new Error("test"))

    expect(console.error).toHaveBeenCalledWith("[ERROR] Error message", expect.any(Error))
  })

  it("should always log warning messages", () => {
    Logger.warn("Warning message")

    expect(console.warn).toHaveBeenCalledWith("[WARN] Warning message")
  })
})

describe("Validator", () => {
  describe("isRequired", () => {
    it("should return false for empty values", () => {
      expect(Validator.isRequired("")).toBe(false)
      expect(Validator.isRequired(null)).toBe(false)
      expect(Validator.isRequired(undefined)).toBe(false)
    })

    it("should return true for non-empty values", () => {
      expect(Validator.isRequired("test")).toBe(true)
      expect(Validator.isRequired(0)).toBe(true)
      expect(Validator.isRequired(false)).toBe(true)
      expect(Validator.isRequired([])).toBe(true)
    })
  })

  describe("isEmail", () => {
    it("should validate correct email formats", () => {
      expect(Validator.isEmail("test@example.com")).toBe(true)
      expect(Validator.isEmail("user.name@domain.co.uk")).toBe(true)
      expect(Validator.isEmail("user+tag@example.org")).toBe(true)
    })

    it("should reject invalid email formats", () => {
      expect(Validator.isEmail("invalid-email")).toBe(false)
      expect(Validator.isEmail("test@")).toBe(false)
      expect(Validator.isEmail("@domain.com")).toBe(false)
      expect(Validator.isEmail("test..test@domain.com")).toBe(false)
    })
  })

  describe("isDateRange", () => {
    it("should validate correct date ranges", () => {
      expect(Validator.isDateRange("2024-01-01", "2024-01-31")).toBe(true)
      expect(Validator.isDateRange("2024-01-01", "2024-01-01")).toBe(true)
    })

    it("should reject invalid date ranges", () => {
      expect(Validator.isDateRange("2024-01-31", "2024-01-01")).toBe(false)
    })
  })

  describe("validateRequired", () => {
    it("should return no errors for valid fields", () => {
      const fields = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      }

      const errors = Validator.validateRequired(fields)

      expect(errors).toHaveLength(0)
    })

    it("should return errors for empty fields", () => {
      const fields = {
        name: "",
        email: null,
        age: undefined,
      }

      const errors = Validator.validateRequired(fields)

      expect(errors).toHaveLength(3)
      expect(errors[0].code).toBe("validation/required-field")
      expect(errors[0].message).toContain("name es requerido")
    })
  })
})
