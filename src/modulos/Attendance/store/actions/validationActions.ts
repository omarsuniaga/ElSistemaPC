// Archivo para acciones relacionadas con validaciones
import {format, parseISO, isValid} from "date-fns"

export const validationActions = {
  validateAttendanceDate(this: any, date: string): boolean {
    if (!date || typeof date !== "string") {
      console.error("Formato de fecha inválido:", date)
      return false
    }

    const parsedDate = parseISO(date)

    if (!isValid(parsedDate)) {
      return false
    }

    const today = format(new Date(), "yyyy-MM-dd")
    const dateIsValid = date <= today

    if (!dateIsValid) {
      console.warn(`La fecha ${date} es posterior a hoy (${today})`)
    }

    return dateIsValid
  },
}
