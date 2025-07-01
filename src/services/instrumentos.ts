import {db} from "../firebase"
import {collection, getDocs} from "firebase/firestore"
// import { InstrumentFamilyName } from '../types/instrumento';

export const fetchInstrumentOptions = async () => {
  const querySnapshot = await getDocs(collection(db, "instrumentOptions"))
  const data: {[familia: string]: string[]} = {
    cuerdas: [] as string[],
    maderas: [] as string[],
    metales: [] as string[],
    percusion: [] as string[],
    coro: [] as string[],
  }

  querySnapshot.forEach((doc) => {
    const familia = doc.id
    const instrumentos = doc.data().instrumentos
    if (data[familia]) {
      data[familia] = instrumentos
    }
  })

  return data
}
