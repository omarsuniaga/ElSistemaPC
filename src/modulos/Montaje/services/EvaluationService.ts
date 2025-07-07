import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  writeBatch,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../../../firebase/config'
import type { InstrumentEvaluation, WeeklyEvaluation } from '../types/heatmap'

class EvaluationService {
  // Save a single instrument evaluation
  async saveInstrumentEvaluation(evaluation: Partial<InstrumentEvaluation>): Promise<string> {
    try {
      // Add timestamp fields
      const now = new Date()
      const evaluationData = {
        ...evaluation,
        createdAt: evaluation.createdAt || now.toISOString(),
        updatedAt: now.toISOString()
      }
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'instrument_evaluations'), evaluationData)
      return docRef.id
    } catch (error) {
      console.error('Error saving instrument evaluation:', error)
      throw error
    }
  }

  // Update an existing instrument evaluation
  async updateInstrumentEvaluation(id: string, evaluation: Partial<InstrumentEvaluation>): Promise<void> {
    try {
      // Add updated timestamp
      const now = new Date()
      const evaluationData = {
        ...evaluation,
        updatedAt: now.toISOString()
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'instrument_evaluations', id), evaluationData)
    } catch (error) {
      console.error('Error updating instrument evaluation:', error)
      throw error
    }
  }

  // Save multiple instrument evaluations in batch
  async saveBatchEvaluations(evaluations: Partial<InstrumentEvaluation>[]): Promise<void> {
    try {
      const batch = writeBatch(db)
      const now = new Date()
      
      for (const evaluation of evaluations) {
        const evaluationData = {
          ...evaluation,
          createdAt: evaluation.createdAt || now.toISOString(),
          updatedAt: now.toISOString()
        }
        
        const docRef = doc(collection(db, 'instrument_evaluations'))
        batch.set(docRef, evaluationData)
      }
      
      await batch.commit()
    } catch (error) {
      console.error('Error saving batch evaluations:', error)
      throw error
    }
  }

  // Get evaluations for a specific instrument
  async getInstrumentEvaluations(workId: string, instrumentId: string): Promise<InstrumentEvaluation[]> {
    try {
      const evaluationsRef = collection(db, 'instrument_evaluations')
      const q = query(
        evaluationsRef,
        where('workId', '==', workId),
        where('instrumentId', '==', instrumentId),
        orderBy('updatedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InstrumentEvaluation[]
    } catch (error) {
      console.error('Error getting instrument evaluations:', error)
      throw error
    }
  }

  // Get the most recent evaluation for an instrument
  async getLatestInstrumentEvaluation(workId: string, instrumentId: string): Promise<InstrumentEvaluation | null> {
    try {
      const evaluationsRef = collection(db, 'instrument_evaluations')
      const q = query(
        evaluationsRef,
        where('workId', '==', workId),
        where('instrumentId', '==', instrumentId),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(1)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as InstrumentEvaluation
    } catch (error) {
      console.error('Error getting latest instrument evaluation:', error)
      throw error
    }
  }

  // Get all evaluations for a work
  async getWorkEvaluations(workId: string): Promise<InstrumentEvaluation[]> {
    try {
      const evaluationsRef = collection(db, 'instrument_evaluations')
      const q = query(
        evaluationsRef,
        where('workId', '==', workId),
        orderBy('updatedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InstrumentEvaluation[]
    } catch (error) {
      console.error('Error getting work evaluations:', error)
      throw error
    }
  }

  // Get recent evaluations
  async getRecentEvaluations(limitValue: number = 10): Promise<InstrumentEvaluation[]> {
    try {
      const evaluationsRef = collection(db, 'instrument_evaluations')
      const q = query(
        evaluationsRef,
        orderBy('updatedAt', 'desc'),
        firestoreLimit(limitValue)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InstrumentEvaluation[]
    } catch (error) {
      console.error('Error getting recent evaluations:', error)
      throw error
    }
  }

  // Delete an evaluation
  async deleteEvaluation(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'instrument_evaluations', id))
    } catch (error) {
      console.error('Error deleting evaluation:', error)
      throw error
    }
  }

  // Weekly evaluations
  async saveWeeklyEvaluation(evaluation: Partial<WeeklyEvaluation>): Promise<string> {
    try {
      // Add timestamp fields
      const now = new Date()
      const evaluationData = {
        ...evaluation,
        createdAt: evaluation.createdAt || now.toISOString(),
        updatedAt: now.toISOString()
      }
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'weekly_evaluations'), evaluationData)
      return docRef.id
    } catch (error) {
      console.error('Error saving weekly evaluation:', error)
      throw error
    }
  }

  // Get weekly evaluations for a work
  async getWeeklyEvaluations(workId: string): Promise<WeeklyEvaluation[]> {
    try {
      const evaluationsRef = collection(db, 'weekly_evaluations')
      const q = query(
        evaluationsRef,
        where('workId', '==', workId),
        orderBy('week', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyEvaluation[]
    } catch (error) {
      console.error('Error getting weekly evaluations:', error)
      throw error
    }
  }

  // Calculate average scores for an instrument
  calculateAverageScores(evaluations: InstrumentEvaluation[]): Record<string, number> {
    if (evaluations.length === 0) {
      return {
        afinacion: 0,
        articulacion: 0,
        ritmo: 0,
        cohesion: 0,
        dinamica: 0,
        memorizacion: 0
      }
    }

    const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion']
    const averages: Record<string, number> = {}

    criteria.forEach(criterion => {
      const scores = evaluations.map(e => e[criterion]).filter(score => score > 0)
      averages[criterion] = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
    })

    return averages
  }

  // Calculate overall average score
  calculateOverallScore(evaluation: InstrumentEvaluation | Record<string, number>): number {
    const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion']
    const scores = criteria.map(c => evaluation[c]).filter(score => score > 0)
    
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }
}

export const evaluationService = new EvaluationService()
export default evaluationService