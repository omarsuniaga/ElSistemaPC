// Debug script para verificar datos de estudiantes
import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs, query, orderBy} from "firebase/firestore"

// Configuración de Firebase (usando las mismas credenciales que la app)
const firebaseConfig = {
  apiKey: "AIzaSyBHwZkCRsVePqKzJTU13QS02u8Sd7CYo6w",
  authDomain: "music-academy-99274.firebaseapp.com",
  projectId: "music-academy-99274",
  storageBucket: "music-academy-99274.firebasestorage.app",
  messagingSenderId: "1056903083820",
  appId: "1:1056903083820:web:5c26e6bea1b5e1e2f09e5b",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function debugStudentsData() {
  try {
    console.log("🔍 Verificando datos de estudiantes en Firestore...")

    // Consultar la colección ALUMNOS
    const studentsCollection = collection(db, "ALUMNOS")
    const q = query(studentsCollection, orderBy("apellido"))
    const querySnapshot = await getDocs(q)

    console.log(`📊 Total de documentos en ALUMNOS: ${querySnapshot.size}`)

    if (querySnapshot.size === 0) {
      console.log("❌ No hay estudiantes en la base de datos")

      // Intentar obtener sin ordenamiento
      console.log("🔄 Intentando obtener sin ordenamiento...")
      const simpleQuery = await getDocs(studentsCollection)
      console.log(`📊 Total sin ordenamiento: ${simpleQuery.size}`)
    } else {
      console.log("✅ Estudiantes encontrados:")
      querySnapshot.forEach((doc, index) => {
        const data = doc.data()
        console.log(`${index + 1}. ID: ${doc.id}`)
        console.log(`   Nombre: ${data.nombre || "N/A"} ${data.apellido || "N/A"}`)
        console.log(`   Email: ${data.email || "N/A"}`)
        console.log(`   Activo: ${data.activo}`)
        console.log(`   Instrumento: ${data.instrumento || "N/A"}`)
        console.log(`   Grupo: ${JSON.stringify(data.grupo || "N/A")}`)
        console.log(`   ----`)
      })
    }

    // Verificar estructura de un documento de ejemplo
    if (querySnapshot.size > 0) {
      const firstDoc = querySnapshot.docs[0]
      console.log("🔬 Estructura del primer documento:")
      console.log(JSON.stringify(firstDoc.data(), null, 2))
    }
  } catch (error) {
    console.error("❌ Error al verificar datos:", error)
    console.error("Detalles del error:", error.message)
  }
}

// Ejecutar el debug
debugStudentsData()
