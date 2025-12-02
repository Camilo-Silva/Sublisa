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
  talles?: ProductoTalle[]; // Talles disponibles con stock y precio
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

export interface Talle {
  id: string;
  codigo: string; // XS, S, M, L, XL, etc.
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface ProductoTalle {
  id: string;
  producto_id: string;
  talle_id: string;
  talle?: Talle; // Datos del talle (join)
  stock: number;
  precio?: number; // NULL = usar precio base del producto
  activo: boolean;
}

export interface Subcategoria {
  nombre: string;
  icono?: string;
}

export interface CategoriaJerarquica {
  nombre: string;
  subcategorias: Subcategoria[];
}
