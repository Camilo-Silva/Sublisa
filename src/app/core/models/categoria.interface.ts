export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subcategoria {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaConSubcategorias extends Categoria {
  subcategorias: Subcategoria[];
}
