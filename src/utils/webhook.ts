// Reemplazando el webhook de Make.com con nuestra Cloud Function de Firebase
const WEBHOOK_URL = 'https://us-central1-orquestapuntacana.cloudfunctions.net/emailWebhookHandler'
const TIMEOUT = 10000 // 10 segundos

// Función específica para enviar datos a Make.com
export async function sendToMake(webhookUrl: string, payload: any) {
  if (!webhookUrl) {
    throw new Error('URL del webhook no especificada')
  }

  // Log de la petición
  console.log('Enviando datos al webhook de Make.com:', {
    url: webhookUrl,
    method: 'POST',
    payload
  })

  // Configurar la petición con timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error en respuesta del webhook de Make.com:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Error del servidor Make.com: ${response.status}`)
    }

    // Intentar parsear como JSON, si falla retornar el texto
    let responseData
    const contentType = response.headers.get('content-type')
    const responseText = await response.text()
    
    if (contentType && contentType.includes('application/json') && responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        responseData = responseText
      }
    } else {
      responseData = responseText
    }

    return responseData
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.error('La petición al webhook de Make.com excedió el tiempo límite')
      throw new Error('Tiempo de espera agotado')
    }
    console.error('Error al enviar webhook a Make.com:', error)
    throw error
  }
}

interface WebhookPayload {
  type: string
  data: {
    records?: any[]
    date?: string
    class?: string
    className?: string
    observations?: string
    students?: any[]
    attendanceRecords?: Record<string, string>
    presentes?: string[]
    ausentes?: string[]
    tardanza?: string[]
    justificados?: string[]
    summary?: {
      total: number
      presentes: number
      ausentes: number
      tardanza: number
      justificados: number
      porcentajeAsistencia: number
    }
    teacherInfo?: {
      id?: string
      name?: string
      email?: string
    }
    [key: string]: any
  }
  timestamp: string
  format?: 'pdf' | 'excel' | 'email' | 'html'
  action?: string
}

// Define a basic Student interface if not imported from elsewhere
interface Student {
  id: string;
  [key: string]: any; // Allow other properties
}

export async function sendWebhook(type: string, data: any) {
  try {
    // Validar datos requeridos
    if (!type) {
      throw new Error('El tipo de webhook es requerido')
    }

    // Procesar datos de asistencia si están disponibles
    let studentsData: Student[] = data.students || []; // Explicitly type studentsData
    let attendanceRecords = data.attendanceRecords || {};
    let presentes: string[] = [], ausentes: string[] = [], tardanza: string[] = [], justificados: string[] = [];
    
    // Si existen registros de asistencia, procesarlos para estadísticas
    if (attendanceRecords && Object.keys(attendanceRecords).length > 0) {
      Object.entries(attendanceRecords).forEach(([studentId, status]) => {
        if (status === 'Presente') presentes.push(studentId);
        else if (status === 'Ausente') ausentes.push(studentId);
        else if (status === 'Tardanza') tardanza.push(studentId);
        else if (status === 'Justificado') justificados.push(studentId);
      });
    }

    // Calcular estadísticas si hay datos suficientes
    const totalStudents = studentsData.length || Object.keys(attendanceRecords).length;
    const totalPresentes = presentes.length;
    const porcentajeAsistencia = totalStudents > 0 ? (totalPresentes / totalStudents) * 100 : 0;

    // Enriquecer los datos de estudiantes con su estado de asistencia
    if (studentsData.length > 0 && Object.keys(attendanceRecords).length > 0) {
      studentsData = studentsData.map(student => ({
        ...student,
        asistencia: attendanceRecords[student.id] || 'No registrado'
      }));
    }

    // Limpiar y estructurar los datos para el webhook
    const records = Array.isArray(data.records) ? data.records.map((r: any) => ({
      ...r,
      fecha: r.fecha || data.date,
      clase: r.clase || data.class
    })) : undefined

    // Construir payload con toda la información disponible
    const payload: WebhookPayload = {
      type,
      data: {
        // Información básica
        records,
        date: data.date,
        class: data.class,
        className: data.className,
        
        // Datos de estudiantes y asistencia
        students: studentsData,
        attendanceRecords,
        presentes,
        ausentes,
        tardanza,
        justificados,
        
        // Observaciones
        observations: data.observations,
        comment: data.comment,
        
        // Información adicional
        studentId: data.studentId,
        status: data.status,
        format: data.format,
        
        // Resumen estadístico
        summary: {
          total: totalStudents,
          presentes: presentes.length,
          ausentes: ausentes.length,
          tardanza: tardanza.length,
          justificados: justificados.length,
          porcentajeAsistencia: Math.round(porcentajeAsistencia * 100) / 100 // Redondear a 2 decimales
        },
        
        // Información del maestro/usuario
        teacherInfo: {
          id: data.teacherId,
          name: data.teacherName,
          email: data.teacherEmail
        },
        
        // Mantener compatibilidad con datos del correo
        recipient: data.recipient,
        subject: data.subject,
        htmlBody: data.htmlBody
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
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain, application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'same-origin'
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