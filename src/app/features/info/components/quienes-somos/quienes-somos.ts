import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quienes-somos.html',
  styleUrls: ['./quienes-somos.scss']
})
export class QuienesSomosComponent {
  titulo = 'Quiénes Somos';

  ubicacion = {
    direccion: 'Calle Balboa 6741',
    localidad: 'González Catán',
    provincia: 'Buenos Aires'
  };

  contacto = {
    telefono: '1122355874',
    whatsapp: '1122355874'
  };

  mediosPago = [
    'Mercado Pago',
    'Efectivo en el local',
    'Transferencia bancaria'
  ];

  envios = [
    'Correo Argentino',
    'MD Cargas',
    'Vía Cargo',
    'Crucero Express',
    'Bus Pack'
  ];
}
