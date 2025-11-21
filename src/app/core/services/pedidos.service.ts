import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Pedido, DetallePedido, Cliente, ItemCarrito } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Genera un número de pedido único
   */
  private generateNumeroPedido(): string {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `PED-${year}${month}${day}-${random}`;
  }

  /**
   * Crea un nuevo pedido con todos los detalles
   */
  async crearPedido(
    cliente: Omit<Cliente, 'id'>,
    items: ItemCarrito[],
    notas?: string
  ): Promise<Pedido> {
    try {
      // 1. Crear el cliente
      const { data: clienteData, error: clienteError } = await this.supabase.getClient()
        .from('clientes')
        .insert(cliente)
        .select()
        .single();

      if (clienteError) throw clienteError;

      // 2. Calcular totales
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const total = subtotal; // Aquí podrías agregar impuestos o descuentos

      // 3. Crear el pedido
      const numeroPedido = this.generateNumeroPedido();
      
      const { data: pedidoData, error: pedidoError } = await this.supabase.getClient()
        .from('pedidos')
        .insert({
          numero_pedido: numeroPedido,
          cliente_id: clienteData.id,
          estado: 'PENDIENTE_CONTACTO',
          subtotal,
          total,
          notas
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 4. Crear los detalles del pedido
      const detalles: Omit<DetallePedido, 'id' | 'created_at'>[] = items.map(item => ({
        pedido_id: pedidoData.id!,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio,
        subtotal: item.subtotal
      }));

      const { error: detallesError } = await this.supabase.getClient()
        .from('detalle_pedido')
        .insert(detalles);

      if (detallesError) throw detallesError;

      // 5. Retornar el pedido completo con relaciones
      return {
        ...pedidoData,
        cliente: clienteData
      };

    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por ID con todos sus detalles
   */
  async getPedidoById(id: string): Promise<Pedido | null> {
    const { data, error } = await this.supabase.getClient()
      .from('pedidos')
      .select(`
        *,
        cliente:clientes(*),
        detalles:detalle_pedido(
          *,
          producto:productos(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Obtiene todos los pedidos (para admin)
   */
  async getPedidos(estado?: string, limit?: number): Promise<Pedido[]> {
    let query = this.supabase.getClient()
      .from('pedidos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Actualiza el estado de un pedido
   */
  async actualizarEstadoPedido(id: string, estado: string): Promise<Pedido> {
    const { data, error } = await this.supabase.getClient()
      .from('pedidos')
      .update({ 
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Obtiene estadísticas de pedidos (para dashboard admin)
   */
  async getEstadisticas() {
    const { data, error } = await this.supabase.getClient()
      .from('pedidos')
      .select('estado, total');
    
    if (error) throw error;

    const stats = {
      total_pedidos: data?.length || 0,
      pendientes: data?.filter(p => p.estado === 'PENDIENTE_CONTACTO').length || 0,
      confirmados: data?.filter(p => p.estado === 'CONFIRMADO').length || 0,
      en_preparacion: data?.filter(p => p.estado === 'EN_PREPARACION').length || 0,
      total_ventas: data?.reduce((sum, p) => sum + (p.total || 0), 0) || 0
    };

    return stats;
  }
}
