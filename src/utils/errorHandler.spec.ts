import {describe, it, expect} from "vitest"
import {AppError, ValidationError, NetworkError, handleError} from "./errorHandler"

describe("Error Handler", () => {
  it("debe crear errores personalizados", () => {
    const error = new AppError("TEST_ERROR", "Test message", 400)
    expect(error.code).toBe("TEST_ERROR")
    expect(error.message).toBe("Test message")
    expect(error.statusCode).toBe(400)
  })

  it("debe manejar errores de validación", () => {
    const error = new ValidationError("Campo requerido", "email")
    expect(error.code).toBe("VALIDATION_ERROR")
    expect(error.context?.field).toBe("email")
  })

  it("debe manejar errores de red", () => {
    const error = new NetworkError()
    expect(error.code).toBe("NETWORK_ERROR")
    expect(error.statusCode).toBe(500)
  })

  it("debe convertir errores desconocidos", () => {
    const unknownError = new Error("Unknown error")
    const appError = handleError(unknownError, false)
    expect(appError.code).toBe("UNKNOWN_ERROR")
    expect(appError.message).toBe("Unknown error")
  })
})
