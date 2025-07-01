export interface Teacher {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  specialties: string[]
  photoURL: string
  status: string
  biography: string
  experiencia: string
  address: string
  createdAt: Date
  updatedAt?: Date
}
