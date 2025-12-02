import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../core/services/carrito.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito implements OnInit {
  constructor(
    public carritoService: CarritoService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    // Scroll al principio de la página cuando se carga el carrito
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Aumenta la cantidad de un producto en el carrito
   * Valida que haya stock restante disponible
   */
  aumentarCantidad(productoId: string, cantidadActual: number, stockRestante: number | undefined, talleId?: string) {
    // Si no hay stock restante definido, no validar (caso legacy)
    if (stockRestante === undefined || stockRestante === null) {
      console.warn('Stock no disponible para validación, permitiendo incremento');
      this.carritoService.actualizarCantidad(productoId, cantidadActual + 1, talleId);
      return;
    }

    // Validar que haya stock restante para agregar
    if (stockRestante <= 0) {
      this.modalService.alert(
        'Stock Insuficiente',
        `No hay stock adicional disponible de este producto.`
      );
      return;
    }

    this.carritoService.actualizarCantidad(productoId, cantidadActual + 1, talleId);
  }

  disminuirCantidad(productoId: string, cantidadActual: number, talleId?: string) {
    if (cantidadActual > 1) {
      this.carritoService.actualizarCantidad(productoId, cantidadActual - 1, talleId);
    }
  }

  async eliminarProducto(productoId: string, talleId?: string) {
    const result = await this.modalService.confirm(
      'Eliminar Producto',
      '¿Estás seguro de que deseas eliminar este producto del carrito?'
    );
    if (result) {
      this.carritoService.eliminarProducto(productoId, talleId);
    }
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

  /**
   * Obtiene el stock TOTAL disponible del item considerando el talle
   * Fallback a producto.stock si talle_stock no está disponible
   */
  getStockDisponible(item: any): number {
    // Si tiene talle_stock definido, usarlo
    if (item.talle_stock !== undefined && item.talle_stock !== null) {
      return item.talle_stock;
    }

    // Fallback: intentar obtener del talle del producto si existe
    if (item.talle && item.producto.talles) {
      const productoTalle = item.producto.talles.find((t: any) => t.id === item.talle.id);
      if (productoTalle) {
        return productoTalle.stock;
      }
    }

    // Último fallback: stock del producto
    return item.producto.stock ?? 0;
  }

  /**
   * Obtiene el stock RESTANTE que puede agregar al carrito
   * Stock total menos la cantidad actual en el carrito
   */
  getStockMaximo(item: any): number {
    const stockTotal = this.getStockDisponible(item);
    return Math.max(0, stockTotal - item.cantidad);
  }
}
