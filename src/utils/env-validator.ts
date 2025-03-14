type EnvVar = {
  key: string;
  required: boolean;
  pattern?: RegExp;
}

const ENV_VARS: EnvVar[] = [
  { 
    key: 'VITE_APP_API_KEY',
    required: true,
    pattern: /^[A-Za-z0-9_-]{39}$/ 
  },
  { 
    key: 'VITE_APP_AUTH_DOMAIN',
    required: true,
    pattern: /^[a-z0-9-]+\.firebaseapp\.com$/ 
  },
  { 
    key: 'VITE_APP_PROJECT_ID',
    required: true 
  },
  { 
    key: 'VITE_APP_STORAGE_BUCKET',
    required: true,
    pattern: /^[a-z0-9-]+\.appspot\.com$/ 
  },
  { 
    key: 'VITE_APP_MESSAGING_SENDER_ID',
    required: true,
    pattern: /^\d+$/ 
  },
  { 
    key: 'VITE_APP_APP_ID',
    required: true,
    pattern: /^\d+:[a-z0-9-]+:[a-z0-9-]+:[a-f0-9-]+$/ 
  }
]

export function validateEnvVars(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const envVar of ENV_VARS) {
    const value = import.meta.env[envVar.key]

    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.key}`)
      continue
    }

    if (value && envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(`Invalid format for environment variable ${envVar.key}`)
    }
  }

  if (import.meta.env.DEV && errors.length > 0) {
    console.error('❌ Environment validation errors:')
    errors.forEach(error => console.error(`  ${error}`))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}