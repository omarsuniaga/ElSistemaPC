type EnvVar = {
  key: string
  required: boolean
  pattern?: RegExp
}

const ENV_VARS: EnvVar[] = [
  {
    key: "VITE_APP_API_KEY",
    required: true,
    pattern: /^[A-Za-z0-9_-]+$/, // Patrón más flexible para API key
  },
  {
    key: "VITE_APP_AUTH_DOMAIN",
    required: true,
    pattern: /^[a-z0-9-]+\.(firebaseapp\.com|web\.app)$/, // Soporte para .web.app también
  },
  {
    key: "VITE_APP_PROJECT_ID",
    required: true,
  },
  {
    key: "VITE_APP_STORAGE_BUCKET",
    required: true,
    pattern: /^[a-z0-9-]+\.(appspot\.com)$/,
  },
  {
    key: "VITE_APP_MESSAGING_SENDER_ID",
    required: true,
    pattern: /^\d+$/,
  },
  {
    key: "VITE_APP_APP_ID",
    required: true,
    pattern: /^[0-9:a-zA-Z-]+$/, // Patrón más flexible para App ID
  },
]

export function validateEnvVars(): {isValid: boolean; errors: string[]} {
  const errors: string[] = []

  for (const envVar of ENV_VARS) {
    const value = import.meta.env[envVar.key]

    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.key}`)
      continue
    }

    if (value && envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(`Invalid format for environment variable ${envVar.key}`)
      if (import.meta.env.DEV) {
        console.warn(`Expected format for ${envVar.key}: ${envVar.pattern}`)
        console.warn(`Current value: ${value}`)
      }
    }
  }

  if (import.meta.env.DEV) {
    if (errors.length > 0) {
      console.error("❌ Environment validation errors:")
      errors.forEach((error) => console.error(`  ${error}`))
    } else {
      console.log("✅ Environment variables validated successfully")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
