import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quienes-somos.html',
  styleUrls: ['./quienes-somos.scss']
})
export class QuienesSomosComponent implements OnInit {
  titulo = 'Quiénes Somos';

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
    this.titleService.setTitle('Quiénes Somos | Sublisa');
    this.configuracionService.inicializar();
  }

  getWhatsAppUrl(): string {
    const cleanNumber = this.whatsapp().replaceAll(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  }

  mediosPago = [
    'Mercado Pago',
    'Efectivo en el local',
    'Transferencia bancaria'
  ];

  envios = [
    'Correo Argentino',
    'Vía Cargo'
  ];
}
