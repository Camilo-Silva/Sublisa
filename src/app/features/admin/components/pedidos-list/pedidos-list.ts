import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Pedido } from '../../../../core/models';
import { ModalService } from '../../../../core/services/modal.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

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

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = signal(20);
  totalPaginas = signal(1);
  pedidosPaginados = signal<Pedido[]>([]);

  // Exponer Math para el template
  Math = Math;

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
    private readonly router: Router,
    private readonly modalService: ModalService,
    private readonly supabase: SupabaseService
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    this.paginaActual.set(1); // Resetear a página 1 al filtrar
    this.calcularPaginacion();
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.estadoFiltro.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.aplicarFiltros();
  }

  private calcularPaginacion() {
    const totalItems = this.pedidosFiltrados().length;
    const paginas = Math.ceil(totalItems / this.itemsPorPagina());
    this.totalPaginas.set(paginas || 1);

    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    const fin = inicio + this.itemsPorPagina();
    const paginados = this.pedidosFiltrados().slice(inicio, fin);
    this.pedidosPaginados.set(paginados);
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(p => p - 1);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  getPaginasVisibles(): number[] {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      if (actual > 3) {
        paginas.push(-1);
      }

      const inicio = Math.max(2, actual - 1);
      const fin = Math.min(total - 1, actual + 1);

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (actual < total - 2) {
        paginas.push(-1);
      }

      paginas.push(total);
    }

    return paginas;
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  async exportarAExcel() {
    const pedidos = this.pedidosFiltrados();

    if (pedidos.length === 0) {
      await this.modalService.warning('No hay pedidos para exportar');
      return;
    }

    // Preparar datos para CSV
    const headers = ['Número', 'Fecha', 'Cliente', 'Teléfono', 'Estado', 'Total'];
    const rows = pedidos.map(p => [
      p.numero_pedido,
      p.created_at ? new Date(p.created_at).toLocaleString('es-AR') : '',
      p.cliente?.nombre || '',
      p.cliente?.telefono || '',
      this.getEstadoTexto(p.estado),
      `$${p.total.toFixed(2)}`
    ]);

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell, index) => {
        // Para la columna del teléfono (índice 3), agregar comilla simple al inicio
        if (index === 3 && cell) {
          return `"'${cell}"`;
        }
        return `"${cell}"`;
      }).join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fechaHoy = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${fechaHoy}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async exportarAExcelDetallado() {
    const pedidos = this.pedidosFiltrados();

    if (pedidos.length === 0) {
      await this.modalService.warning('No hay pedidos para exportar');
      return;
    }

    // CSV con formato más detallado
    let csvContent = '\ufeff'; // BOM para Excel
    csvContent += 'REPORTE DE PEDIDOS - SUBLISA\n';
    csvContent += `Fecha de exportación: ${new Date().toLocaleString('es-AR')}\n`;
    csvContent += `Total de pedidos: ${pedidos.length}\n`;
    csvContent += `Monto total: $${this.getTotalPedidos().toFixed(2)}\n\n`;

    csvContent += 'Número,Fecha,Cliente,Teléfono,Email,Estado,Subtotal,Total,Notas\n';

    for (const p of pedidos) {
      const row = [
        p.numero_pedido,
        p.created_at ? new Date(p.created_at).toLocaleString('es-AR') : '',
        p.cliente?.nombre || '',
        p.cliente?.telefono || '',
        p.cliente?.email || '',
        this.getEstadoTexto(p.estado),
        p.subtotal.toFixed(2),
        p.total.toFixed(2),
        (p.notas || '').replaceAll(',', ';')
      ];
      csvContent += row.map((cell, index) => {
        // Para la columna del teléfono (índice 3), agregar comilla simple al inicio
        if (index === 3 && cell) {
          return `"'${cell}"`;
        }
        return `"${cell}"`;
      }).join(',') + '\n';
    }

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fechaHoy = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_detallado_${fechaHoy}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async exportarClientes() {
    try {
      // Obtener todos los clientes
      const { data: clientes, error: errorClientes } = await this.supabase.getClient()
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (errorClientes) {
        console.error('Error al obtener clientes:', errorClientes);
        await this.modalService.warning('Error al obtener clientes');
        return;
      }

      if (!clientes || clientes.length === 0) {
        await this.modalService.warning('No hay clientes para exportar');
        return;
      }

      // Obtener todos los user_profiles con información de usuarios registrados
      const { data: profiles, error: errorProfiles } = await this.supabase.getClient()
        .from('user_profiles')
        .select('user_id, nombre, apellido, email, telefono, rol');

      if (errorProfiles) {
        console.error('Error al obtener profiles:', errorProfiles);
      }

      // Crear mapeo por teléfono y email para búsqueda rápida
      const profilesByPhone = new Map();
      const profilesByEmail = new Map();

      if (profiles) {
        profiles.forEach(profile => {
          const profileData = {
            nombre: profile.nombre || '',
            apellido: profile.apellido || '',
            email: profile.email || '',
            telefono: profile.telefono || ''
          };

          if (profile.telefono) {
            profilesByPhone.set(profile.telefono, profileData);
          }
          if (profile.email) {
            profilesByEmail.set(profile.email.toLowerCase(), profileData);
          }
        });
      }

      // CSV con formato
      let csvContent = '\ufeff'; // BOM para Excel
      csvContent += 'REPORTE DE CLIENTES - SUBLISA\n';
      csvContent += `Fecha de exportación: ${new Date().toLocaleString('es-AR')}\n`;
      csvContent += `Total de clientes: ${clientes.length}\n\n`;

      csvContent += 'ID Cliente,Nombre Registro,Email Registro,Nombre Último Pedido,Email Último Pedido,Teléfono,Fecha Creación\n';

      for (const cliente of clientes) {
        // Buscar si hay un user_profile asociado a este cliente
        // Intentamos buscar por teléfono primero, luego por email
        let profile = null;

        if (cliente.telefono) {
          profile = profilesByPhone.get(cliente.telefono);
        }

        if (!profile && cliente.email) {
          profile = profilesByEmail.get(cliente.email.toLowerCase());
        }

        // Combinar nombre y apellido de registro
        const nombreRegistro = profile ? `${profile.nombre} ${profile.apellido}`.trim() : '';

        const row = [
          cliente.id || '',
          nombreRegistro,
          profile?.email || '',
          cliente.nombre || '',
          cliente.email || '',
          cliente.telefono || '', // Mantener el formato completo con +
          cliente.created_at ? new Date(cliente.created_at).toLocaleString('es-AR') : ''
        ];

        csvContent += row.map((cell, index) => {
          // Para la columna del teléfono (índice 5), agregar comilla simple al inicio para formato texto
          if (index === 5 && cell) {
            return `"'${cell}"`;
          }
          return `"${cell}"`;
        }).join(',') + '\n';
      }      // Descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const fechaHoy = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${fechaHoy}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      await this.modalService.warning('Error al exportar clientes');
    }
  }
}
