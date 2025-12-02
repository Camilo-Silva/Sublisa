import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  get imagenPrincipal(): string {
    const imagenPrincipal = this.producto.imagenes?.find(img => img.es_principal);
    return imagenPrincipal?.url || this.producto.imagenes?.[0]?.url || 'https://via.placeholder.com/300x300?text=Sin+Imagen';
  }

  async agregarAlCarrito(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.agregando()) return;

    // Si el producto tiene talles, redirigir al detalle para que seleccione
    if (this.producto.talles && this.producto.talles.length > 0) {
      this.router.navigate(['/producto', this.producto.id]);
      return;
    }

    // Verificar si hay stock disponible considerando lo que ya está en el carrito
    if (!this.puedeAgregar) {
      return;
    }

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

  tieneTalles(): boolean {
    return !!(this.producto.talles && this.producto.talles.length > 0);
  }

  /**
   * Verifica si se puede agregar el producto al carrito
   * Considera el stock disponible y la cantidad ya en el carrito
   */
  get puedeAgregar(): boolean {
    // Si tiene talles, siempre permitir ir al detalle
    if (this.tieneTalles()) {
      return true;
    }

    // Sin stock
    if (this.producto.stock === 0) {
      return false;
    }

    // Verificar si todavía hay stock disponible considerando lo que está en el carrito
    return this.carritoService.puedeAgregarMas(this.producto.id, this.producto.stock);
  }

  /**
   * Obtiene el texto del botón según el estado
   */
  get textoBoton(): string {
    if (this.agregando()) return 'Agregando...';
    if (this.tieneTalles()) return 'Ver Talles';

    const cantidadEnCarrito = this.carritoService.getCantidadProductoConTalle(this.producto.id);
    if (cantidadEnCarrito > 0 && !this.puedeAgregar) {
      return 'En Carrito';
    }

    return 'Agregar';
  }
}
