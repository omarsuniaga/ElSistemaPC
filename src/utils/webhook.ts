const WEBHOOK_URL = 'https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo'
const TIMEOUT = 10000 // 10 segundos

interface WebhookPayload {
  type: string
  data: {
    records?: any[]
    date?: string
    class?: string
    [key: string]: any
  }
  timestamp: string
  format?: 'pdf' | 'excel' | 'email'
  action?: string
}

export async function sendWebhook(type: string, data: any) {
  try {
    // Validar datos requeridos
    if (!type) {
      throw new Error('El tipo de webhook es requerido')
    }

    // Limpiar y estructurar los datos para el webhook
    const records = Array.isArray(data.records) ? data.records.map(r => ({
      ...r,
      fecha: r.fecha || data.date,
      clase: r.clase || data.class
    })) : undefined

    // Construir payload
    const payload: WebhookPayload = {
      type,
      data: {
        records,
        date: data.date,
        class: data.class,
        studentId: data.studentId,
        status: data.status,
        comment: data.comment,
        format: data.format
      },
      format: data.format,
      action: data.action,
      timestamp: new Date().toISOString()
    }

    // Log de la petición
    console.log('Enviando datos al webhook:', {
      url: WEBHOOK_URL,
      method: 'POST',
      payload
    })

    // Configurar la petición con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain, application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error en respuesta del webhook:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      // Intentar parsear como JSON, si falla retornar el texto
      let responseData
      const contentType = response.headers.get('content-type')
      const responseText = await response.text()

      if (contentType?.includes('application/json')) {
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { message: responseText }
        }
      } else {
        responseData = { message: responseText }
      }

      console.log('Respuesta del webhook:', responseData)
      return responseData

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La petición al webhook excedió el tiempo de espera')
      }
      throw error
    }
  } catch (error) {
    console.error('Error al enviar webhook:', error)
    throw error instanceof Error ? error : new Error('Error desconocido al enviar webhook')
  }
}