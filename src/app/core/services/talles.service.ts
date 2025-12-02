import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Talle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TallesService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Obtener todos los talles (activos e inactivos)
   */
  async getTalles(soloActivos: boolean = false): Promise<Talle[]> {
    let query = this.supabase.getClient()
      .from('talles')
      .select('*')
      .order('orden', { ascending: true });

    if (soloActivos) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener talles:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtener un talle por ID
   */
  async getTalleById(id: string): Promise<Talle | null> {
    const { data, error } = await this.supabase.getClient()
      .from('talles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener talle:', error);
      throw error;
    }

    return data;
  }

  /**
   * Crear un nuevo talle
   */
  async crearTalle(talle: Omit<Talle, 'id'>): Promise<Talle> {
    const { data, error } = await this.supabase.getClient()
      .from('talles')
      .insert([talle])
      .select()
      .single();

    if (error) {
      console.error('Error al crear talle:', error);
      throw error;
    }

    return data;
  }

  /**
   * Actualizar un talle existente
   */
  async actualizarTalle(id: string, cambios: Partial<Omit<Talle, 'id'>>): Promise<Talle> {
    const { data, error } = await this.supabase.getClient()
      .from('talles')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar talle:', error);
      throw error;
    }

    return data;
  }

  /**
   * Desactivar un talle (soft delete)
   */
  async desactivarTalle(id: string): Promise<void> {
    // Primero verificar si el talle está en uso
    const enUso = await this.talleEnUso(id);

    if (enUso) {
      throw new Error('No se puede desactivar un talle que está asignado a productos con stock');
    }

    const { error } = await this.supabase.getClient()
      .from('talles')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      console.error('Error al desactivar talle:', error);
      throw error;
    }
  }

  /**
   * Activar un talle
   */
  async activarTalle(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('talles')
      .update({ activo: true })
      .eq('id', id);

    if (error) {
      console.error('Error al activar talle:', error);
      throw error;
    }
  }

  /**
   * Verificar si un talle está en uso en productos con stock
   */
  async talleEnUso(talleId: string): Promise<boolean> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .select('id, stock')
      .eq('talle_id', talleId)
      .eq('activo', true)
      .gt('stock', 0);

    if (error) {
      console.error('Error al verificar uso de talle:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Obtener productos que usan un talle específico
   */
  async getProductosConTalle(talleId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('productos_talles')
      .select(`
        id,
        stock,
        productos:producto_id (
          id,
          nombre,
          sku
        )
      `)
      .eq('talle_id', talleId)
      .eq('activo', true)
      .gt('stock', 0);

    if (error) {
      console.error('Error al obtener productos con talle:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Eliminar físicamente un talle (solo si no está en uso)
   */
  async eliminarTalle(id: string): Promise<void> {
    // Verificar si está en uso
    const enUso = await this.talleEnUso(id);

    if (enUso) {
      throw new Error('No se puede eliminar un talle que está asignado a productos con stock');
    }

    // Verificar si hay referencias en productos_talles (incluso sin stock)
    const { data: referencias } = await this.supabase.getClient()
      .from('productos_talles')
      .select('id')
      .eq('talle_id', id)
      .limit(1);

    if (referencias && referencias.length > 0) {
      throw new Error('No se puede eliminar un talle que tiene referencias en productos. Use desactivar en su lugar.');
    }

    const { error } = await this.supabase.getClient()
      .from('talles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar talle:', error);
      throw error;
    }
  }
}
