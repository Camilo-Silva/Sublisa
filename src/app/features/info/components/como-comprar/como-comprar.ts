import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';

@Component({
  selector: 'app-como-comprar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './como-comprar.html',
  styleUrls: ['./como-comprar.scss']
})
export class ComoComprarComponent implements OnInit {
  titulo = 'Cómo Comprar';

  // Computed signals que obtienen la configuración dinámicamente
  whatsapp = computed(() => {
    const config = this.configuracionService.getConfiguracionSignal()();
    return config?.whatsapp_vendedor || '+5491138824544';
  });

  ubicacion = computed(() => {
    const config = this.configuracionService.getConfiguracionSignal()();
    return {
      direccion: config?.direccion || 'Calle Balboa 6741',
      localidad: config?.localidad || 'González Catán',
      provincia: config?.provincia || 'Buenos Aires'
    };
  });

  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly titleService: Title
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.titleService.setTitle('Cómo Comprar | Sublisa');
    this.configuracionService.inicializar();
  }

  getWhatsAppUrl(): string {
    const cleanNumber = this.whatsapp().replaceAll(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  }

  mediosPago = [
    {
      nombre: 'Mercado Pago',
      descripcion: 'Pagá con tarjetas de crédito, débito o en efectivo'
    },
    {
      nombre: 'Transferencia Bancaria',
      descripcion: 'Realizá una transferencia directa a nuestra cuenta'
    },
    {
      nombre: 'Depósito Bancario',
      descripcion: 'Depositá en nuestras cuentas bancarias'
    }
  ];

  empresasEnvio = [
    'Correo Argentino',
    'Vía Cargo'
  ];
}
