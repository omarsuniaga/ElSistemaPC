// Script para probar Firebase Functions de WhatsApp
const baseUrl = 'https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi';

async function testFunction(endpoint, method = 'GET', body = null) {
  console.log(`\n🧪 Probando ${method} ${endpoint}...`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ Respuesta JSON:`, data);
      } else if (contentType && contentType.includes('image/')) {
        console.log(`✅ Respuesta es imagen (${contentType})`);
        console.log(`📦 Tamaño: ${response.headers.get('content-length')} bytes`);
      } else {
        const text = await response.text();
        console.log(`✅ Respuesta texto:`, text.substring(0, 200));
      }
      
      return true;
    } else {
      const text = await response.text();
      console.log(`❌ Error: ${text}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error de red: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de Firebase Functions para WhatsApp...');
  console.log(`🌍 URL Base: ${baseUrl}`);
  
  const results = {};
  
  // Test 1: Status
  results.status = await testFunction('/status');
  
  // Test 2: Init
  results.init = await testFunction('/init', 'POST');
  
  // Test 3: QR
  results.qr = await testFunction('/qr');
  
  // Resumen
  console.log('\n📋 RESUMEN DE PRUEBAS:');
  console.log(`/status: ${results.status ? '✅' : '❌'}`);
  console.log(`/init: ${results.init ? '✅' : '❌'}`);
  console.log(`/qr: ${results.qr ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! Firebase Functions están funcionando.');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Verificar el despliegue de Firebase Functions.');
    console.log('\n🔧 Para desplegar las functions:');
    console.log('1. firebase login');
    console.log('2. firebase use orquestapuntacana');
    console.log('3. cd functions');
    console.log('4. npm install');
    console.log('5. firebase deploy --only functions');
  }
}

// Ejecutar pruebas
runTests().catch(console.error);
