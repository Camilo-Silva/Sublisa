import { CategoriaJerarquica } from '../models/producto.interface';

/**
 * Configuración centralizada de categorías jerárquicas
 * Categoría Principal -> Subcategorías
 */
export const CATEGORIAS_JERARQUICAS: CategoriaJerarquica[] = [
  {
    nombre: 'Para Sublimar',
    subcategorias: [
      { nombre: 'Remeras' },
      { nombre: 'Tazas' },
      { nombre: 'Llaveros' },
      { nombre: 'Termos' },
      { nombre: 'Gorras' },
      { nombre: 'Almohadones' },
      { nombre: 'Azulejos' },
      { nombre: 'Individuales' },
      { nombre: 'Mouse Pads' },
      { nombre: 'Vasos' },
    ]
  },
  {
    nombre: 'Sublimado',
    subcategorias: [
      { nombre: 'Remeras' },
      { nombre: 'Tazas' },
      { nombre: 'Llaveros' },
      { nombre: 'Termos' },
      { nombre: 'Gorras' },
      { nombre: 'Almohadones' },
      { nombre: 'Cuadros' },
      { nombre: 'Pines' },
    ]
  },
  {
    nombre: 'DTF',
    subcategorias: [
      { nombre: 'Diseños A4' },
      { nombre: 'Diseños A3' },
      { nombre: 'Diseños Personalizados' },
      { nombre: 'Parches' },
    ]
  },
  {
    nombre: 'Otros',
    subcategorias: [
      { nombre: 'Insumos' },
      { nombre: 'Accesorios' },
      { nombre: 'Equipos' },
    ]
  }
];

/**
 * Obtiene todas las categorías principales
 */
export function getCategoriasNivel1(): string[] {
  return CATEGORIAS_JERARQUICAS.map(c => c.nombre);
}

/**
 * Obtiene las subcategorías de una categoría principal
 */
export function getSubcategorias(categoriaPrincipal: string): string[] {
  const categoria = CATEGORIAS_JERARQUICAS.find(c => c.nombre === categoriaPrincipal);
  return categoria ? categoria.subcategorias.map(s => s.nombre) : [];
}

/**
 * Verifica si existe una categoría principal
 */
export function existeCategoria(nombre: string): boolean {
  return CATEGORIAS_JERARQUICAS.some(c => c.nombre === nombre);
}

/**
 * Verifica si existe una subcategoría dentro de una categoría principal
 */
export function existeSubcategoria(categoriaPrincipal: string, subcategoria: string): boolean {
  const categoria = CATEGORIAS_JERARQUICAS.find(c => c.nombre === categoriaPrincipal);
  return categoria ? categoria.subcategorias.some(s => s.nombre === subcategoria) : false;
}
