export interface UserProfile {
  id?: string;
  user_id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: 'cliente' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  password: string;
}
