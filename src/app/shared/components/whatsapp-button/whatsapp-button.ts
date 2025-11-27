import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionService } from '../../../core/services/configuracion.service';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-button.html',
  styleUrls: ['./whatsapp-button.scss']
})
export class WhatsappButton implements OnInit {
  whatsapp = computed(() => {
    const config = this.configuracionService.getConfiguracionSignal()();
    return config?.whatsapp_vendedor || '+5491138824544';
  });

  constructor(private readonly configuracionService: ConfiguracionService) {}

  ngOnInit() {
    this.configuracionService.inicializar();
  }

  getWhatsAppUrl(): string {
    const cleanNumber = this.whatsapp().replaceAll(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent('¡Hola! Vengo desde la tienda online y tengo una consulta.')}`;
  }
}
