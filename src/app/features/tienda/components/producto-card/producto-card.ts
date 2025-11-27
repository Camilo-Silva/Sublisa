import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../core/services/carrito.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Producto } from '../../../../core/models';

@Component({
  selector: 'app-producto-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.scss',
})
export class ProductoCard {
  @Input({ required: true }) producto!: Producto;

  agregando = signal(false);

  constructor(
    public carritoService: CarritoService,
    private readonly toastService: ToastService
  ) {}

  get imagenPrincipal(): string {
    const imagenPrincipal = this.producto.imagenes?.find(img => img.es_principal);
    return imagenPrincipal?.url || this.producto.imagenes?.[0]?.url || 'https://via.placeholder.com/300x300?text=Sin+Imagen';
  }

  async agregarAlCarrito(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.agregando()) return;

    this.agregando.set(true);

    // Simular pequeño delay para mostrar "Agregando..."
    await new Promise(resolve => setTimeout(resolve, 300));

    this.carritoService.agregarProducto(this.producto, 1);

    // Mostrar toast
    this.toastService.showProductAdded(
      this.producto.nombre,
      this.imagenPrincipal,
      1,
      this.producto.precio
    );

    // Volver al estado inicial después de un momento
    setTimeout(() => {
      this.agregando.set(false);
    }, 500);
  }

  get estaEnCarrito(): boolean {
    return this.carritoService.estaEnCarrito(this.producto.id);
  }
}
