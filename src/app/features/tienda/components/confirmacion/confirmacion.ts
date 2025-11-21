import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Pedido } from '../../../../core/models';

@Component({
  selector: 'app-confirmacion',
  imports: [CommonModule, RouterLink],
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.scss',
})
export class Confirmacion implements OnInit {
  pedido: Pedido | null = null;

  constructor(private readonly router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.pedido = navigation?.extras?.state?.['pedido'] || null;
  }

  ngOnInit() {
    // Si no hay pedido, redirigir al inicio
    if (!this.pedido) {
      this.router.navigate(['/']);
    }
  }
}
