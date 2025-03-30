// Script para validar las variables de entorno de Firebase
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Determinar qué archivo .env cargar basado en el entorno
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env';

// Cargar variables de entorno
const envPath = join(rootDir, envFile);
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.error(`\x1b[31mError: El archivo ${envFile} no existe.\x1b[0m`);
  process.exit(1);
}

// Cargar variables desde el archivo
const envVars = dotenv.parse(fs.readFileSync(envPath));

// Validar variables de Firebase requeridas
const requiredVars = [
  'VITE_APP_API_KEY',
  'VITE_APP_AUTH_DOMAIN',
  'VITE_APP_PROJECT_ID',
  'VITE_APP_STORAGE_BUCKET',
  'VITE_APP_MESSAGING_SENDER_ID',
  'VITE_APP_APP_ID'
];

const missingVars = [];

// Verificar cada variable requerida
for (const varName of requiredVars) {
  const value = envVars[varName];
  
  // Comprobar si existe y no contiene ${} (plantillas no resueltas)
  if (!value || value.includes('${')) {
    missingVars.push(varName);
  }
}

// Si faltan variables, mostrar error y salir
if (missingVars.length > 0) {
  console.error('\x1b[31mError: Las siguientes variables de entorno son requeridas o tienen valores incorrectos:\x1b[0m');
  missingVars.forEach(varName => {
    console.error(`- ${varName}`);
  });
  console.error('\x1b[33mAsegúrate de que tu archivo ${envFile} tenga estas variables correctamente configuradas.\x1b[0m');
  process.exit(1);
}

// Todo bien
console.log('\x1b[32mValidación exitosa: Todas las variables de entorno de Firebase están correctamente configuradas.\x1b[0m');
process.exit(0);