export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  bio: string;
  photoUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
