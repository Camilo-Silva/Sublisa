import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-como-comprar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './como-comprar.html',
  styleUrls: ['./como-comprar.scss']
})
export class ComoComprarComponent {
  titulo = 'Cómo Comprar';

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
    'MD Cargas',
    'Vía Cargo',
    'Crucero Express',
    'Bus Pack'
  ];
}
