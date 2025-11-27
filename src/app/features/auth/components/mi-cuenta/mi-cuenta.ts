import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';
import { UserProfile, Pedido } from '../../../../core/models';

@Component({
  selector: 'app-mi-cuenta',
  imports: [CommonModule, RouterLink],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.scss',
})
export class MiCuenta implements OnInit {
  userProfile = signal<UserProfile | null>(null);
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  pedidoSeleccionado = signal<any>(null);
  mostrarModal = signal(false);
  loadingDetalle = signal(false);

  // Computed signals para configuración dinámica
  whatsapp = computed(() => {
    const config = this.configuracionService.getConfiguracionSignal()();
    return config?.whatsapp_vendedor || '+5491138824544';
  });

  email = computed(() => {
    const config = this.configuracionService.getConfiguracionSignal()();
    return config?.email_contacto || 'contacto@sublisa.com';
  });

  constructor(
    public readonly authService: AuthService,
    private readonly pedidosService: PedidosService,
    private readonly configuracionService: ConfiguracionService
  ) {}

  ngOnInit() {
    this.configuracionService.inicializar();
    this.cargarDatos();
  }

  getWhatsAppUrl(): string {
    const cleanNumber = this.whatsapp().replaceAll(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  }

  async cargarDatos() {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Cargar perfil
      const profile = this.authService.getUserProfile();
      this.userProfile.set(profile);

      // Cargar pedidos del usuario
      const user = this.authService.getCurrentUser();
      if (user) {
        const { data, error } = await this.authService['supabase'].getClient()
          .from('pedidos')
          .select(`
            *,
            cliente:clientes(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        this.pedidos.set(data || []);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      this.error.set('Error al cargar la información');
    } finally {
      this.loading.set(false);
    }
  }

  async cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
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

  async verDetallePedido(pedido: Pedido) {
    try {
      this.loadingDetalle.set(true);

      // Cargar detalle del pedido con productos
      const { data, error } = await this.authService['supabase'].getClient()
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          detalles:detalle_pedido(
            *,
            producto:productos(*)
          )
        `)
        .eq('id', pedido.id)
        .single();

      if (error) throw error;

      this.pedidoSeleccionado.set(data);
      this.mostrarModal.set(true);
      console.log('📦 Detalle del pedido cargado:', data);
    } catch (err) {
      console.error('Error al cargar detalle del pedido:', err);
      alert('Error al cargar el detalle del pedido');
    } finally {
      this.loadingDetalle.set(false);
    }
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.pedidoSeleccionado.set(null);
  }
}
