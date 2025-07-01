/**
 * Test script to verify Firebase queries with undefined parameters
 * This script tests the fix for the error:
 * "Function where() called with invalid data. Unsupported field value: undefined"
 */

// Import Firebase modules
import {initializeApp} from "firebase/app"
import {getFirestore, collection, query, where, getDocs, orderBy} from "firebase/firestore"

// Firebase config from your config file (you'll need to fill this in)
const firebaseConfig = {
  // Your Firebase config here
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Test collection name
const OBSERVATIONS_COLLECTION = "OBSERVACIONES"

/**
 * Function to test query with undefined classId parameter
 */
async function testObservationsQuery(classId, specificDate) {
  console.log(
    `Testing query with classId: ${classId || "undefined"}, date: ${specificDate || "undefined"}`
  )

  try {
    let queryRef

    // Check if classId is valid
    if (!classId) {
      // If no classId, get all observations or filter by date only
      if (specificDate) {
        queryRef = query(
          collection(db, OBSERVATIONS_COLLECTION),
          where("date", "==", specificDate),
          orderBy("createdAt", "desc")
        )
      } else {
        queryRef = query(collection(db, OBSERVATIONS_COLLECTION), orderBy("createdAt", "desc"))
      }
    } else {
      // If classId is valid, proceed with class-specific queries
      if (specificDate) {
        queryRef = query(
          collection(db, OBSERVATIONS_COLLECTION),
          where("classId", "==", classId),
          where("date", "==", specificDate),
          orderBy("createdAt", "desc")
        )
      } else {
        queryRef = query(
          collection(db, OBSERVATIONS_COLLECTION),
          where("classId", "==", classId),
          orderBy("createdAt", "desc")
        )
      }
    }

    const querySnapshot = await getDocs(queryRef)
    console.log(`✅ Query successful. Found ${querySnapshot.docs.length} documents.`)

    // Print first few docs for inspection
    if (querySnapshot.docs.length > 0) {
      console.log("Sample document data:")
      querySnapshot.docs.slice(0, 3).forEach((doc) => {
        console.log(`- Doc ID: ${doc.id}, Data:`, doc.data())
      })
    }

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("❌ Query failed:", error)
    return []
  }
}

// Run test cases
async function runTests() {
  console.log("Starting Firebase query tests...")

  // Test case 1: Both parameters undefined (should return all observations)
  await testObservationsQuery(undefined, undefined)

  // Test case 2: Only classId defined (should return all observations for that class)
  await testObservationsQuery("some-class-id", undefined)

  // Test case 3: Only date defined (should return all observations for that date)
  await testObservationsQuery(undefined, "2025-04-01")

  // Test case 4: Both parameters defined (should return observations for that class and date)
  await testObservationsQuery("some-class-id", "2025-04-01")

  console.log("All tests completed!")
}

// Execute tests
runTests().catch(console.error)
