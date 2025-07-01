import type {Student, Teacher, Class, Content} from "../types"

// Webhook configuration
const WEBHOOK_URLS = {
  // La URL de attendance ahora apunta a nuestra Cloud Function de Firebase
  attendance: "https://us-central1-orquestapuntacana.cloudfunctions.net/emailWebhookHandler",
  students: "https://hook.us2.make.com/students-webhook",
  teachers: "https://hook.us2.make.com/teachers-webhook",
  classes: "https://hook.us2.make.com/classes-webhook",
  contents: "https://hook.us2.make.com/contents-webhook",
}

interface WebhookPayload {
  timestamp: string
  type: string
  action?: string
  data: any
}

interface PendingWebhook {
  type: keyof typeof WEBHOOK_URLS
  payload: WebhookPayload
  retryCount: number
  lastAttempt: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

// Queue for storing failed webhook requests
const webhookQueue: PendingWebhook[] = []

export async function sendWebhook(type: keyof typeof WEBHOOK_URLS, data: any, action?: string) {
  const payload: WebhookPayload = {
    timestamp: new Date().toISOString(),
    type,
    action,
    data,
  }

  try {
    if (!navigator.onLine) {
      throw new Error("No internet connection")
    }

    const response = await fetch(WEBHOOK_URLS[type], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending webhook:", error)

    // Add to retry queue
    webhookQueue.push({
      type,
      payload,
      retryCount: 0,
      lastAttempt: new Date().toISOString(),
    })

    // Store in localStorage for persistence
    localStorage.setItem("pendingWebhooks", JSON.stringify(webhookQueue))

    // Start retry process if not already running
    if (webhookQueue.length === 1) {
      processWebhookQueue()
    }

    throw error
  }
}

async function processWebhookQueue() {
  while (webhookQueue.length > 0) {
    const webhook = webhookQueue[0]

    // Skip if max retries reached
    if (webhook.retryCount >= MAX_RETRIES) {
      console.error("Max retries reached for webhook:", webhook)
      webhookQueue.shift()
      continue
    }

    // Wait for retry delay
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))

    try {
      const response = await fetch(WEBHOOK_URLS[webhook.type], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhook.payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Success - remove from queue
      webhookQueue.shift()
    } catch (error) {
      console.error("Error retrying webhook:", error)
      webhook.retryCount++
      webhook.lastAttempt = new Date().toISOString()

      // Move to end of queue if more retries available
      if (webhook.retryCount < MAX_RETRIES) {
        webhookQueue.push(webhookQueue.shift()!)
      } else {
        webhookQueue.shift()
      }
    }

    // Update localStorage
    localStorage.setItem("pendingWebhooks", JSON.stringify(webhookQueue))
  }
}

// Load pending webhooks from localStorage on startup
const loadPendingWebhooks = () => {
  const pending = localStorage.getItem("pendingWebhooks")
  if (pending) {
    webhookQueue.push(...JSON.parse(pending))
    if (webhookQueue.length > 0) {
      processWebhookQueue()
    }
  }
}

// Process pending webhooks when coming back online
window.addEventListener("online", () => {
  if (webhookQueue.length > 0) {
    processWebhookQueue()
  }
})

// Load pending webhooks when the module is imported
loadPendingWebhooks()

// Export functions for generating reports
export async function generateAttendanceReport() {
  return {
    timestamp: new Date().toISOString(),
    type: "attendance_report",
    data: {
      totalClasses: 0,
      totalStudents: 0,
      averageAttendance: 0,
      byClass: {},
      byStudent: {},
    },
  }
}

export async function generateClassesReport() {
  return {
    timestamp: new Date().toISOString(),
    type: "classes_report",
    data: {
      totalClasses: 0,
      activeClasses: 0,
      byInstrument: {},
      byLevel: {},
      byTeacher: {},
    },
  }
}

export async function generateProgressReport() {
  return {
    timestamp: new Date().toISOString(),
    type: "progress_report",
    data: {
      totalStudents: 0,
      averageProgress: 0,
      byClass: {},
      byLevel: {},
      byInstrument: {},
    },
  }
}
