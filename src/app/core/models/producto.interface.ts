export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  activo: boolean;
  categoria?: string;
  subcategoria?: string;
  sku?: string;
  imagenes?: ImagenProducto[];
  created_at?: string;
  updated_at?: string;
}

export interface ImagenProducto {
  id: string;
  producto_id: string;
  url: string;
  orden: number;
  es_principal: boolean;
}

export interface Subcategoria {
  nombre: string;
  icono?: string;
}

export interface CategoriaJerarquica {
  nombre: string;
  subcategorias: Subcategoria[];
}
