export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classIds: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
