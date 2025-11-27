import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { ConfiguracionNegocio } from '../../../core/models';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnInit {
  currentYear = new Date().getFullYear();

  // Valores por defecto
  private readonly configPorDefecto: ConfiguracionNegocio = {
    email_contacto: 'contacto@sublisa.com',
    whatsapp_vendedor: '+5491138824544',
    mensaje_bienvenida: '',
    nombre_negocio: 'Sublisa',
    direccion: 'Calle Balboa 6741',
    localidad: 'González Catán',
    provincia: 'Buenos Aires'
  };

  // Computed signal que se actualiza automáticamente desde el servicio
  configuracion = computed(() => {
    return this.configuracionService.getConfiguracionSignal()() || this.configPorDefecto;
  });

  constructor(
    public carritoService: CarritoService,
    private readonly configuracionService: ConfiguracionService
  ) {}

  ngOnInit() {
    // Inicializar el servicio
    this.configuracionService.inicializar();
    this.cargarConfiguracion();
  }

  async cargarConfiguracion() {
    try {
      await this.configuracionService.getConfiguracion();
    } catch (err) {
      console.error('Error al cargar configuración del footer:', err);
      // Mantener valores por defecto en caso de error
    }
  }

  getWhatsAppUrl(): string {
    const whatsapp = this.configuracion().whatsapp_vendedor;
    // Remover todos los caracteres que no sean dígitos
    const cleanNumber = whatsapp.replaceAll(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  }

  abrirCarrito() {
    this.carritoService.abrirCarrito();
  }
}
