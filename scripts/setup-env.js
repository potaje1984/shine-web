#!/usr/bin/env node
// scripts/setup-env.js
// ──────────────────────────────────────────────────────────────────────────
// Asistente interactivo para crear el archivo .env con las credenciales
// de Firebase.
//
// Uso:
//   node scripts/setup-env.js
//
// O si tienes npm:
//   npm run setup
// ──────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const ENV_PATH = path.join(__dirname, '..', '.env')
const EXAMPLE_PATH = path.join(__dirname, '..', '.env.example')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const hint = defaultValue ? ` [${defaultValue}]` : ''
    rl.question(`${question}${hint}: `, (answer) => {
      resolve((answer || defaultValue).trim())
    })
  })
}

async function main() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                                                              ║')
  console.log('║   🔧 Asistente de configuración de Firebase — Shine Web     ║')
  console.log('║                                                              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('Este script creará tu archivo .env con las credenciales de Firebase.')
  console.log('')
  console.log('📋 Necesitas tener a mano tu configuración de Firebase.')
  console.log('   Obtenla en: https://console.firebase.google.com/')
  console.log('   → Tu proyecto → Project settings → General → Your apps')
  console.log('')
  console.log('──────────────────────────────────────────────────────────────')
  console.log('')

  // Si ya existe .env, preguntar si sobrescribir
  if (fs.existsSync(ENV_PATH)) {
    const overwrite = await ask('⚠️  Ya existe .env. ¿Sobrescribir? (s/N)', 'N')
    if (overwrite.toLowerCase() !== 's') {
      console.log('\n✓ Operación cancelada. Tu .env no se modificó.')
      rl.close()
      return
    }
  }

  console.log('')
  console.log('👉 Introduce tus credenciales (o pulsa Enter para usar el valor por defecto):')
  console.log('')

  // Preguntar cada credencial
  const apiKey = await ask('1. API Key (AIzaSy...)', '')
  if (!apiKey) {
    console.log('\n❌ La API Key es obligatoria. Cancelando.')
    rl.close()
    return
  }

  const projectId = await ask('2. Project ID', 'shine-web-8d20b')
  const authDomain = await ask(
    '3. Auth Domain',
    `${projectId}.firebaseapp.com`,
  )
  const storageBucket = await ask(
    '4. Storage Bucket',
    `${projectId}.appspot.com`,
  )
  const messagingSenderId = await ask('5. Messaging Sender ID (números)', '')
  const appId = await ask('6. App ID (1:XXXX:web:XXXX)', '')

  // Cloud Functions
  console.log('')
  console.log('⚙️  Configuración de Cloud Functions (Enter para defaults):')
  console.log('')
  const region = await ask('7. Región de Cloud Functions', 'us-central1')
  const useEmulator = await ask(
    '8. ¿Usar emulador local? (true/false)',
    'false',
  )

  // Generar contenido
  const content = `# ──────────────────────────────────────────────────────────────────────────
# Configuración de Firebase — generada por scripts/setup-env.js
# Fecha: ${new Date().toISOString()}
# ──────────────────────────────────────────────────────────────────────────

VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}

# ──────────────────────────────────────────────────────────────────────────
# Cloud Functions
# ──────────────────────────────────────────────────────────────────────────

VITE_FIREBASE_FUNCTIONS_REGION=${region}
VITE_USE_FUNCTIONS_EMULATOR=${useEmulator}
`

  // Escribir archivo
  fs.writeFileSync(ENV_PATH, content, { mode: 0o600 })

  console.log('')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                                                              ║')
  console.log('║   ✅ Archivo .env creado correctamente                       ║')
  console.log('║                                                              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📁 Ubicación: ${ENV_PATH}`)
  console.log('')
  console.log('🚀 Próximos pasos:')
  console.log('   1. Reinicia el servidor de desarrollo:')
  console.log('      npm run dev')
  console.log('')
  console.log('   2. Abre http://localhost:5173 en tu navegador')
  console.log('')
  console.log('⚠️  IMPORTANTE:')
  console.log('   • Nunca subas .env a Git (ya está en .gitignore)')
  console.log('   • Si despliegas en producción, añade estas variables en el panel del hosting')
  console.log('')

  rl.close()
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message)
  rl.close()
  process.exit(1)
})
