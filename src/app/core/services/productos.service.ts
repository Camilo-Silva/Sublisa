import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Producto, ImagenProducto, Talle, ProductoTalle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Obtiene todos los productos activos con sus imágenes y talles
   */
  async getProductos(limit?: number): Promise<Producto[]> {
    let query = this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*),
        talles:productos_talles(
          *,
          talle:talles(*)
        )
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
   * Obtiene un producto por ID con sus imágenes y talles
   */
  async getProductoById(id: string): Promise<Producto | null> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*),
        talles:productos_talles(
          *,
          talle:talles(*)
        )
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

    if (error) {
      // Detectar error de SKU duplicado
      if (error.code === '23505' && error.message.includes('productos_sku_key')) {
        throw new Error('SKU_DUPLICADO');
      }
      throw error;
    }
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

    if (error) {
      // Detectar error de SKU duplicado
      if (error.code === '23505' && error.message.includes('productos_sku_key')) {
        throw new Error('SKU_DUPLICADO');
      }
      throw error;
    }
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
   * Verifica si un producto puede ser eliminado permanentemente
   * (no tiene stock ni precio asignado)
   */
  async puedeEliminarPermanente(id: string): Promise<{ puede: boolean; razon?: string }> {
    const producto = await this.getProductoById(id);

    if (!producto) {
      return { puede: false, razon: 'Producto no encontrado' };
    }

    // Verificar si tiene stock
    if (producto.stock > 0) {
      return { puede: false, razon: `El producto tiene ${producto.stock} unidades en stock` };
    }

    // Verificar si tiene precio asignado
    if (producto.precio > 0) {
      return { puede: false, razon: 'El producto tiene un precio asignado' };
    }

    return { puede: true };
  }

  /**
   * Elimina un producto permanentemente de la base de datos
   */
  async deleteProductoPermanente(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Reactiva un producto desactivado
   */
  async activarProducto(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('productos')
      .update({ activo: true })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Obtiene productos inactivos
   */
  async getProductosInactivos(): Promise<Producto[]> {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select(`
        *,
        imagenes:imagenes_producto(*),
        talles:productos_talles(
          *,
          talle:talles(*)
        )
      `)
      .eq('activo', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
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

  // ============================================
  // MÉTODOS PARA GESTIÓN DE TALLES
  // ============================================

  /**
   * Obtiene todos los talles disponibles
   */
  async getTalles(): Promise<Talle[]> {
    const { data, error } = await this.supabase.getClient()
      .from('talles')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene los talles de un producto específico con su stock y precio
   */
  async getTallesProducto(productoId: string): Promise<ProductoTalle[]> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .select(`
        *,
        talle:talles(*)
      `)
      .eq('producto_id', productoId)
      .eq('activo', true)
      .order('talle.orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Agrega un talle a un producto con stock y precio opcional
   */
  async agregarTalleProducto(
    productoId: string,
    talleId: string,
    stock: number,
    precio?: number
  ): Promise<ProductoTalle> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .insert({
        producto_id: productoId,
        talle_id: talleId,
        stock,
        precio,
        activo: true
      })
      .select(`
        *,
        talle:talles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Actualiza stock y precio de un talle específico de un producto
   */
  async actualizarTalleProducto(
    productoTalleId: string,
    stock: number,
    precio?: number
  ): Promise<ProductoTalle> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .update({ stock, precio })
      .eq('id', productoTalleId)
      .select(`
        *,
        talle:talles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Elimina un talle de un producto
   */
  async eliminarTalleProducto(productoTalleId: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('productos_talles')
      .delete()
      .eq('id', productoTalleId);

    if (error) throw error;
  }

  /**
   * Verifica si un producto tiene talles configurados
   */
  async productTieneTalles(productoId: string): Promise<boolean> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .select('id')
      .eq('producto_id', productoId)
      .eq('activo', true)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }
}
