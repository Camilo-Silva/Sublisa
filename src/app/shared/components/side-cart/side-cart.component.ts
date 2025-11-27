import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-side-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './side-cart.component.html',
  styleUrl: './side-cart.component.scss'
})
export class SideCartComponent {
  eliminandoId = signal<string | null>(null);

  constructor(
    public carritoService: CarritoService,
    private readonly modalService: ModalService
  ) {}

  aumentarCantidad(productoId: string, cantidadActual: number) {
    this.carritoService.actualizarCantidad(productoId, cantidadActual + 1);
  }

  disminuirCantidad(productoId: string, cantidadActual: number) {
    if (cantidadActual > 1) {
      this.carritoService.actualizarCantidad(productoId, cantidadActual - 1);
    }
  }

  async eliminarProducto(productoId: string) {
    this.eliminandoId.set(productoId);
    await new Promise(resolve => setTimeout(resolve, 400));
    this.carritoService.eliminarProducto(productoId);
    this.eliminandoId.set(null);
  }

  async vaciarCarrito() {
    const result = await this.modalService.confirm(
      'Vaciar Carrito',
      '¿Estás seguro de que deseas vaciar todo el carrito?'
    );
    if (result) {
      this.carritoService.vaciarCarrito();
    }
  }

  cerrar() {
    this.carritoService.cerrarCarrito();
  }
}
