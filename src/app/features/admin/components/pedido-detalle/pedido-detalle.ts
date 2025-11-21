import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Pedido, EstadoPedido } from '../../../../core/models';

@Component({
  selector: 'app-pedido-detalle',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pedido-detalle.html',
  styleUrl: './pedido-detalle.scss',
})
export class PedidoDetalle implements OnInit {
  pedido = signal<Pedido | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actualizandoEstado = signal(false);
  nuevoEstado = signal<EstadoPedido>('PENDIENTE_CONTACTO');

  estados: EstadoPedido[] = [
    'PENDIENTE_CONTACTO',
    'CONFIRMADO',
    'EN_PREPARACION',
    'LISTO_ENTREGA',
    'ENTREGADO',
    'CANCELADO'
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pedidosService: PedidosService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarPedido(id);
      }
    });
  }

  async cargarPedido(id: string) {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.pedidosService.getPedidoById(id);

      if (!data) {
        this.error.set('Pedido no encontrado');
        return;
      }

      this.pedido.set(data);
      this.nuevoEstado.set(data.estado);
    } catch (err) {
      console.error('Error al cargar pedido:', err);
      this.error.set('Error al cargar el pedido');
    } finally {
      this.loading.set(false);
    }
  }

  async cambiarEstado() {
    const pedido = this.pedido();
    if (!pedido?.id) return;

    const estadoActual = pedido.estado;
    const nuevoEstadoValor = this.nuevoEstado();

    // Mensaje especial si se va a confirmar el pedido
    let mensajeConfirmacion = `¿Cambiar estado del pedido a ${this.getEstadoTexto(nuevoEstadoValor)}?`;

    if (nuevoEstadoValor === 'CONFIRMADO' && estadoActual !== 'CONFIRMADO') {
      mensajeConfirmacion = `⚠️ IMPORTANTE: Al confirmar este pedido se descontará automáticamente el stock de los productos.\n\n¿Desea confirmar el pedido #${pedido.numero_pedido}?`;
    }

    if (!confirm(mensajeConfirmacion)) {
      return;
    }

    try {
      this.actualizandoEstado.set(true);
      await this.pedidosService.actualizarEstadoPedido(pedido.id, nuevoEstadoValor);

      // Recargar pedido
      await this.cargarPedido(pedido.id);

      // Mensaje específico según el cambio de estado
      if (nuevoEstadoValor === 'CONFIRMADO' && estadoActual !== 'CONFIRMADO') {
        alert('✅ Pedido confirmado exitosamente\n\n📦 El stock de los productos ha sido descontado automáticamente.');
      } else {
        alert('✅ Estado actualizado exitosamente');
      }
    } catch (err: unknown) {
      console.error('Error al cambiar estado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';

      if (errorMessage.includes('Stock insuficiente')) {
        alert(`❌ Error: ${errorMessage}\n\nNo se puede confirmar el pedido porque no hay stock suficiente.`);
      } else {
        alert(`❌ Error al cambiar el estado: ${errorMessage}`);
      }
    } finally {
      this.actualizandoEstado.set(false);
    }
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE_CONTACTO': 'estado-pendiente',
      'CONFIRMADO': 'estado-confirmado',
      'EN_PREPARACION': 'estado-preparacion',
      'LISTO_ENTREGA': 'estado-listo',
      'ENTREGADO': 'estado-entregado',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'PENDIENTE_CONTACTO': 'Pendiente Contacto',
      'CONFIRMADO': 'Confirmado',
      'EN_PREPARACION': 'En Preparación',
      'LISTO_ENTREGA': 'Listo para Entrega',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  abrirWhatsApp() {
    const pedido = this.pedido();
    if (!pedido?.cliente?.telefono) {
      alert('No hay teléfono de contacto');
      return;
    }

    const mensaje = `Hola ${pedido.cliente.nombre}, te contacto por tu pedido #${pedido.numero_pedido}.`;
    const telefono = pedido.cliente.telefono.replaceAll(/\D/g, '');
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    globalThis.open(url, '_blank');
  }

  imprimirPedido() {
    globalThis.print();
  }
}
