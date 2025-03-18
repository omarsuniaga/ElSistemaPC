export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classIds: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  grupo: string[];
  instrumento: string;
  fecInscripcion: string;
  avatar: string;
  documentos: Record<string, string>;
  attendanceStatus: string;
  sexo: string;
  madre: string;
  padre: string;
  tlf_madre: string;
  tlf_padre: string;
  colegio_trabajo: string;
  horario_colegio_trabajo: string;
  clase: string;
  tlf: string;
  nombre: string;
  apellido: string;
  edad: string;
  nac: string;
  horario: string;
  fecha: string;
}

export interface SelectedStudent {
  id: string;
  nombre: string;
  apellido: string;
}

