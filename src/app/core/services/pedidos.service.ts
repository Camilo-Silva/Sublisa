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
   * Valida que hay stock suficiente para todos los productos
   */
  private async validarStock(items: ItemCarrito[]): Promise<void> {
    const productosIds = items.map(item => item.producto.id);

    // Obtener stock actual de todos los productos
    const { data: productos, error } = await this.supabase.getClient()
      .from('productos')
      .select('id, nombre, stock')
      .in('id', productosIds);

    if (error) throw error;

    // Verificar stock de cada item
    const productosInsuficientes: string[] = [];

    for (const item of items) {
      const producto = productos?.find(p => p.id === item.producto.id);

      if (!producto) {
        throw new Error(`Producto ${item.producto.nombre} no encontrado`);
      }

      if (producto.stock < item.cantidad) {
        productosInsuficientes.push(
          `${producto.nombre} (disponible: ${producto.stock}, solicitado: ${item.cantidad})`
        );
      }
    }

    if (productosInsuficientes.length > 0) {
      throw new Error(
        `Stock insuficiente para:\n${productosInsuficientes.join('\n')}`
      );
    }
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
      // 1. Validar stock disponible
      await this.validarStock(items);

      // 2. Crear el cliente
      const { data: clienteData, error: clienteError } = await this.supabase.getClient()
        .from('clientes')
        .insert(cliente)
        .select()
        .single();

      if (clienteError) throw clienteError;

      // 3. Calcular totales
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

      // 5. Enviar notificación por email
      await this.enviarNotificacionEmail(pedidoData.id, numeroPedido, clienteData, items, total);

      // 6. Retornar el pedido completo con relaciones
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
   * Envía notificación por email al administrador
   */
  private async enviarNotificacionEmail(
    pedidoId: string,
    numeroPedido: string,
    cliente: Cliente,
    items: ItemCarrito[],
    total: number
  ): Promise<void> {
    try {
      // Obtener email del vendedor desde configuración
      const { data: config } = await this.supabase.getClient()
        .from('configuracion')
        .select('valor')
        .eq('clave', 'email_contacto')
        .single();

      const emailVendedor = config?.valor || 'camilosilva.0301@gmail.com';

      // Construir el cuerpo del email
      const productosTexto = items.map(item =>
        `• ${item.producto.nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`
      ).join('\n');

      const fechaPedido = new Date().toLocaleString('es-AR');

      const asunto = `🛒 Nuevo Pedido #${numeroPedido} - Sublisa`;

      const mensaje = `
¡Nuevo Pedido Recibido!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PEDIDO #${numeroPedido}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Fecha: ${fechaPedido}
📌 Estado: PENDIENTE_CONTACTO

👤 DATOS DEL CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${cliente.nombre}
Teléfono/WhatsApp: ${cliente.telefono}
${cliente.email ? `Email: ${cliente.email}` : ''}

📦 PRODUCTOS SOLICITADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${productosTexto}

💰 TOTAL: $${total.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Contactar por WhatsApp:
https://wa.me/${cliente.telefono.replaceAll(/\D/g, '')}

📱 Gestionar en Admin:
https://ickamngcpuxaqppwzory.supabase.co/project/_/editor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este es un correo automático del sistema Sublisa
      `.trim();

      // Usar EmailJS (servicio gratuito) o FormSubmit
      // Opción 1: Usar fetch para enviar a un webhook
      const webhookUrl = 'https://formsubmit.co/ajax/' + emailVendedor;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: asunto,
          message: mensaje,
          _template: 'box',
          _captcha: 'false'
        })
      });

      console.log('✅ Email enviado a:', emailVendedor);

    } catch (error) {
      // No lanzar error para no bloquear la creación del pedido
      console.error('⚠️ Error al enviar email (pedido creado correctamente):', error);
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
