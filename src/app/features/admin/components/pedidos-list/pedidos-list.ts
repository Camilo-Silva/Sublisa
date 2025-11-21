import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Pedido } from '../../../../core/models';

type EstadoPedido = 'TODOS' | 'PENDIENTE_CONTACTO' | 'CONFIRMADO' | 'EN_PREPARACION' | 'LISTO_ENTREGA' | 'ENTREGADO' | 'CANCELADO';

@Component({
  selector: 'app-pedidos-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  pedidos = signal<Pedido[]>([]);
  pedidosFiltrados = signal<Pedido[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filtros
  busqueda = signal('');
  estadoFiltro = signal<EstadoPedido>('TODOS');
  fechaDesde = signal('');
  fechaHasta = signal('');

  estados: EstadoPedido[] = [
    'TODOS',
    'PENDIENTE_CONTACTO',
    'CONFIRMADO',
    'EN_PREPARACION',
    'LISTO_ENTREGA',
    'ENTREGADO',
    'CANCELADO'
  ];

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  async cargarPedidos() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.pedidosService.getPedidos();
      this.pedidos.set(data);
      this.aplicarFiltros();
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      this.error.set('Error al cargar pedidos');
    } finally {
      this.loading.set(false);
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.pedidos()];

    // Filtro por búsqueda (número de pedido o cliente)
    const query = this.busqueda().toLowerCase().trim();
    if (query) {
      filtrados = filtrados.filter(p =>
        p.numero_pedido?.toLowerCase().includes(query) ||
        p.cliente?.nombre?.toLowerCase().includes(query) ||
        p.cliente?.telefono?.includes(query) ||
        p.cliente?.email?.toLowerCase().includes(query)
      );
    }

    // Filtro por estado
    if (this.estadoFiltro() !== 'TODOS') {
      filtrados = filtrados.filter(p => p.estado === this.estadoFiltro());
    }

    // Filtro por fecha desde
    if (this.fechaDesde()) {
      const desde = new Date(this.fechaDesde());
      filtrados = filtrados.filter(p => p.created_at && new Date(p.created_at) >= desde);
    }

    // Filtro por fecha hasta
    if (this.fechaHasta()) {
      const hasta = new Date(this.fechaHasta());
      hasta.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(p => p.created_at && new Date(p.created_at) <= hasta);
    }

    this.pedidosFiltrados.set(filtrados);
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.estadoFiltro.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.aplicarFiltros();
  }

  verDetalle(pedidoId: string) {
    this.router.navigate(['/admin/pedidos', pedidoId]);
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
      'CANCELADO': 'Cancelado',
      'TODOS': 'Todos los estados'
    };
    return textos[estado] || estado;
  }

  getTotalPedidos(): number {
    return this.pedidosFiltrados().reduce((sum, p) => sum + p.total, 0);
  }
}
