import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Producto, ImagenProducto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Obtiene todos los productos activos con sus imágenes
   */
  async getProductos(limit?: number): Promise<Producto[]> {
    let query = this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene un producto por ID con sus imágenes
   */
  async getProductoById(id: string): Promise<Producto | null> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Busca productos por texto en nombre o descripción
   */
  async searchProductos(query: string): Promise<Producto[]> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*)
      `)
      .eq('activo', true)
      .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Filtra productos por categoría
   */
  async getProductosByCategoria(categoria: string): Promise<Producto[]> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*)
      `)
      .eq('activo', true)
      .eq('categoria', categoria)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crea un nuevo producto (solo admin)
   */
  async createProducto(producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>): Promise<Producto> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .insert(producto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Actualiza un producto existente (solo admin)
   */
  async updateProducto(id: string, producto: Partial<Producto>): Promise<Producto> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .update({ ...producto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Elimina un producto (soft delete - marca como inactivo)
   */
  async deleteProducto(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('productos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Sube una imagen de producto
   */
  async uploadImagenProducto(productoId: string, file: File, orden: number = 0, esPrincipal: boolean = false): Promise<ImagenProducto> {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${productoId}/${Date.now()}.${fileExt}`;

    // Subir archivo a storage
    await this.supabase.uploadFile('productos', fileName, file);

    // Obtener URL pública
    const url = this.supabase.getPublicUrl('productos', fileName);

    // Crear registro en la tabla imagenes_producto
    const { data, error } = await this.supabase.getClient()
      .from('imagenes_producto')
      .insert({
        producto_id: productoId,
        url,
        orden,
        es_principal: esPrincipal
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Elimina una imagen de producto
   */
  async deleteImagenProducto(imagenId: string, url: string): Promise<void> {
    // Extraer path del storage desde la URL
    const path = url.split('/productos/')[1];

    // Eliminar de storage
    if (path) {
      await this.supabase.deleteFile('productos', path);
    }

    // Eliminar registro de la base de datos
    const { error } = await this.supabase.getClient()
      .from('imagenes_producto')
      .delete()
      .eq('id', imagenId);

    if (error) throw error;
  }
}
