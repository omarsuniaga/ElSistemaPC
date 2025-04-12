/**
 * Email Webhook Handler Function
 *
 * This Cloud Function reemplaza el webhook externo de Make.com para enviar correos
 * Recibe solicitudes HTTP y envía correos electrónicos usando Nodemailer con Gmail
 */

import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import cors from "cors";

// Inicializar middleware de CORS permitiendo tu dominio de Netlify
const corsHandler = cors({
    origin: [
      "https://elsistemapc.netlify.app",
      "http://localhost:5173"  // Mantén localhost para desarrollo
    ],
    credentials: true
  });

// Interfaz para definir la estructura del payload del webhook
interface WebhookPayload {
  type: string;
  data: {
    records?: Record<string, unknown>[];
    date?: string;
    class?: string;
    className?: string;
    observations?: string;
    students?: Record<string, unknown>[];
    attendanceRecords?: Record<string, string>;
    presentes?: string[];
    ausentes?: string[];
    tardanza?: string[];
    justificados?: string[];
    summary?: {
      total: number;
      presentes: number;
      ausentes: number;
      tardanza: number;
      justificados: number;
      porcentajeAsistencia: number;
    };
    teacherInfo?: {
      id?: string;
      name?: string;
      email?: string;
    };
    recipient?: string;
    subject?: string;
    htmlBody?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  format?: "pdf" | "excel" | "email" | "html";
  action?: string;
}

/**
 * Construye el cuerpo HTML del correo electrónico basado en los datos del payload
 * @param {WebhookPayload} payload El payload del webhook con los datos para el correo
 * @return {string} Cadena HTML formateada para el correo electrónico
 */
function construirCuerpoDelCorreo(payload: WebhookPayload): string {
  const {data} = payload;
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Notificación: ${payload.type}</h2>
  `;

  // Información de la clase si está disponible
  if (data.className || data.class) {
    html += `
      <div style="background: #f7f7f7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Información de la clase</h3>
        <p><strong>Clase:</strong> ${data.className || data.class || "No especificada"}</p>
        ${data.date ? `<p><strong>Fecha:</strong> ${data.date}</p>` : ""}
        ${data.observations ? 
          `<p><strong>Observaciones:</strong> ${data.observations}</p>` : ""}
      </div>
    `;
  }

  // Si hay información de resumen de asistencia
  if (data.summary) {
    const { summary } = data;
    html += `
      <div style="background: #eef5ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Resumen de Asistencia</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #dde9f7;">
            <th style="padding: 8px; text-align: left;">Total</th>
            <th style="padding: 8px; text-align: left;">Presentes</th>
            <th style="padding: 8px; text-align: left;">Ausentes</th>
            <th style="padding: 8px; text-align: left;">Tardanza</th>
            <th style="padding: 8px; text-align: left;">Justificados</th>
          </tr>
          <tr>
            <td style="padding: 8px;">${summary.total}</td>
            <td style="padding: 8px;">${summary.presentes}</td>
            <td style="padding: 8px;">${summary.ausentes}</td>
            <td style="padding: 8px;">${summary.tardanza}</td>
            <td style="padding: 8px;">${summary.justificados}</td>
          </tr>
        </table>
        <p><strong>Porcentaje de Asistencia:</strong> ${summary.porcentajeAsistencia}%</p>
      </div>
    `;
  }

  // Si hay estudiantes con datos
  if (data.students && data.students.length > 0) {
    html += `
      <div style="margin-bottom: 20px;">
        <h3>Lista de Estudiantes</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Nombre</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Asistencia</th>
          </tr>
    `;

    data.students.forEach(student => {
      const asistencia = student.asistencia || 'No registrado';
      let colorAsistencia;
      
      switch (asistencia) {
        case 'Presente': colorAsistencia = '#c8e6c9'; break;
        case 'Ausente': colorAsistencia = '#ffcdd2'; break;
        case 'Tardanza': colorAsistencia = '#fff9c4'; break;
        case 'Justificado': colorAsistencia = '#bbdefb'; break;
        default: colorAsistencia = '#f5f5f5';
      }

      html += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${student.name || 'Sin nombre'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; background-color: ${colorAsistencia};">${asistencia}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </div>
    `;
  }

  // Mensaje de pie de correo
  html += `
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>Este es un mensaje automático enviado desde El Sistema Punta Cana.</p>
      </div>
    </div>
  `;

  return html;
}

// Definimos la función usando https.onRequest de firebase-functions
export const emailWebhookHandler = functions.https.onRequest((request, response) => {
  // Envolver toda la lógica de la función en el middleware de CORS
  corsHandler(request, response, async () => {
    try {
      console.log("Email webhook handler triggered");
      
      // El middleware corsHandler ya maneja las solicitudes OPTIONS automáticamente
      // No necesitamos un bloque if (request.method === 'OPTIONS') explícito
      
      // Solo aceptar solicitudes POST después del manejo de CORS/OPTIONS
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }
    
    // Parsear y validar el payload
    const payload: WebhookPayload = request.body;
    
    if (!payload || !payload.type) {
      console.error("Invalid payload: missing type");
      response.status(400).send('Bad Request: Invalid payload format');
      return;
    }
    
    console.log(`Processing ${payload.type} webhook request`);
    
    // Verificar que tengamos los datos necesarios para enviar el correo
    if (!payload.data.recipient) {
      console.error("Missing recipient email address");
      response.status(400).send('Bad Request: Missing recipient email address');
      return;
    }
    
    // Configurar el transporter de Nodemailer con Gmail usando las variables de configuración
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.password
      }
    });
    
    // Configurar las opciones del correo
    const mailOptions = {
      from: functions.config().gmail.email,
      to: payload.data.recipient,
      subject: payload.data.subject || `Notificación: ${payload.type}`,
      html: payload.data.htmlBody || construirCuerpoDelCorreo(payload)
    };
    
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    response.status(200).send({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
    } catch (error) {
      console.error("Error processing webhook", error);
      response.status(500).send(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
});
