import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Categoria, Subcategoria, CategoriaConSubcategorias } from '../models/categoria.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  constructor(private readonly supabase: SupabaseService) {}

  // ==================== CATEGORÍAS ====================

  /**
   * Obtiene todas las categorías activas ordenadas
   */
  async getCategorias(): Promise<Categoria[]> {
    const { data, error } = await this.supabase.getClient()
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene todas las categorías (incluso inactivas) para admin
   */
  async getCategoriasAdmin(): Promise<Categoria[]> {
    const { data, error } = await this.supabase.getClient()
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategoriaById(id: string): Promise<Categoria | null> {
    const { data, error } = await this.supabase.getClient()
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crea una nueva categoría
   */
  async createCategoria(categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>): Promise<Categoria> {
    const { data, error } = await this.supabase.getClient()
      .from('categorias')
      .insert(categoria)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Actualiza una categoría existente
   */
  async updateCategoria(id: string, categoria: Partial<Categoria>): Promise<Categoria> {
    const { data, error } = await this.supabase.getClient()
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Elimina una categoría (soft delete)
   */
  async deleteCategoria(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('categorias')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Elimina permanentemente una categoría
   */
  async deleteCategoriaHard(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== SUBCATEGORÍAS ====================

  /**
   * Obtiene todas las subcategorías de una categoría
   */
  async getSubcategorias(categoriaId: string): Promise<Subcategoria[]> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategorias')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene todas las subcategorías (admin)
   */
  async getSubcategoriasAdmin(categoriaId: string): Promise<Subcategoria[]> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategorias')
      .select('*')
      .eq('categoria_id', categoriaId)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crea una nueva subcategoría
   */
  async createSubcategoria(subcategoria: Omit<Subcategoria, 'id' | 'created_at' | 'updated_at'>): Promise<Subcategoria> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategorias')
      .insert(subcategoria)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Actualiza una subcategoría existente
   */
  async updateSubcategoria(id: string, subcategoria: Partial<Subcategoria>): Promise<Subcategoria> {
    const { data, error } = await this.supabase.getClient()
      .from('subcategorias')
      .update(subcategoria)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Elimina una subcategoría (soft delete)
   */
  async deleteSubcategoria(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('subcategorias')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Elimina permanentemente una subcategoría
   */
  async deleteSubcategoriaHard(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('subcategorias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene todas las categorías con sus subcategorías
   */
  async getCategoriasConSubcategorias(): Promise<CategoriaConSubcategorias[]> {
    const categorias = await this.getCategorias();
    const result: CategoriaConSubcategorias[] = [];

    for (const categoria of categorias) {
      const subcategorias = await this.getSubcategorias(categoria.id);
      result.push({
        ...categoria,
        subcategorias
      });
    }

    return result;
  }

  /**
   * Obtiene nombres de categorías para autocomplete
   */
  async getNombresCategorias(): Promise<string[]> {
    const categorias = await this.getCategorias();
    return categorias.map(c => c.nombre);
  }

  /**
   * Obtiene nombres de subcategorías por categoría
   */
  async getNombresSubcategorias(categoriaNombre: string): Promise<string[]> {
    // Buscar categoría por nombre
    const { data: categoria } = await this.supabase.getClient()
      .from('categorias')
      .select('id')
      .eq('nombre', categoriaNombre)
      .eq('activo', true)
      .single();

    if (!categoria) return [];

    const subcategorias = await this.getSubcategorias(categoria.id);
    return subcategorias.map(s => s.nombre);
  }
}
