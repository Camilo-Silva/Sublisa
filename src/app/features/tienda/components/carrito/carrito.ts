import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../core/services/carrito.service';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito {
  constructor(public carritoService: CarritoService) {}

  aumentarCantidad(productoId: string, cantidadActual: number) {
    this.carritoService.actualizarCantidad(productoId, cantidadActual + 1);
  }

  disminuirCantidad(productoId: string, cantidadActual: number) {
    if (cantidadActual > 1) {
      this.carritoService.actualizarCantidad(productoId, cantidadActual - 1);
    }
  }

  eliminarProducto(productoId: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto del carrito?')) {
      this.carritoService.eliminarProducto(productoId);
    }
  }

  vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar todo el carrito?')) {
      this.carritoService.vaciarCarrito();
    }
  }
}
