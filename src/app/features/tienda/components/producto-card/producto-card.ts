import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../core/services/carrito.service';
import { Producto } from '../../../../core/models';

@Component({
  selector: 'app-producto-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.scss',
})
export class ProductoCard {
  @Input({ required: true }) producto!: Producto;

  constructor(public carritoService: CarritoService) {}

  get imagenPrincipal(): string {
    const imagenPrincipal = this.producto.imagenes?.find(img => img.es_principal);
    return imagenPrincipal?.url || this.producto.imagenes?.[0]?.url || 'https://via.placeholder.com/300x300?text=Sin+Imagen';
  }

  agregarAlCarrito(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.carritoService.agregarProducto(this.producto, 1);
  }

  get estaEnCarrito(): boolean {
    return this.carritoService.estaEnCarrito(this.producto.id);
  }
}
