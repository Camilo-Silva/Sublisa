import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ModalService } from '../../../../core/services/modal.service';

interface Estadisticas {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosConfirmados: number;
  totalProductos: number;
  productosStockBajo: number;
  productosSinStock: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  stats = signal<Estadisticas>({
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosConfirmados: 0,
    totalProductos: 0,
    productosStockBajo: 0,
    productosSinStock: 0
  });
  loading = signal(true);
  error = signal<string | null>(null);
  pedidosRecientes = signal<any[]>([]);
  adminEmail = signal('');

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly productosService: ProductosService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    this.cargarDashboard();
    this.cargarDatosUsuario();
  }

  async cargarDashboard() {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Cargar estadísticas
      const estadisticas = await this.pedidosService.getEstadisticas();

      // Cargar productos para calcular stock bajo y sin stock
      const productos = await this.productosService.getProductos();
      const productosStockBajo = productos.filter(p => p.stock > 0 && p.stock < 10).length;
      const productosSinStock = productos.filter(p => p.stock === 0).length;

      this.stats.set({
        totalPedidos: estadisticas.total_pedidos || 0,
        pedidosPendientes: estadisticas.pendientes || 0,
        pedidosConfirmados: estadisticas.confirmados || 0,
        totalProductos: productos.length,
        productosStockBajo: productosStockBajo,
        productosSinStock: productosSinStock
      });

      // Cargar pedidos recientes
      const pedidos = await this.pedidosService.getPedidos();
      this.pedidosRecientes.set(pedidos.slice(0, 5));

    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      this.error.set('Error al cargar el dashboard');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarDatosUsuario() {
    const user = this.authService.getCurrentUser();
    if (user?.email) {
      this.adminEmail.set(user.email);
    }
  }

  async cerrarSesion() {
    const confirmado = await this.modalService.logoutConfirm();

    if (confirmado) {
      await this.modalService.logoutSuccess();
      await this.authService.logout();
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
}
