import { Injectable, signal, computed } from '@angular/core';
import { ItemCarrito, Producto, Talle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly STORAGE_KEY = 'sublisa_carrito';

  // Señal reactiva para los items del carrito
  private readonly itemsSignal = signal<ItemCarrito[]>(this.loadFromStorage());

  // Signal para controlar el carrito lateral
  private readonly carritoAbiertoSignal = signal(false);
  carritoAbierto = this.carritoAbiertoSignal.asReadonly();

  // Computed signals para cálculos
  items = this.itemsSignal.asReadonly();

  cantidadTotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.cantidad, 0)
  );

  subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.subtotal, 0)
  );

  toggleCarrito() {
    this.carritoAbiertoSignal.update(value => !value);
  }

  abrirCarrito() {
    this.carritoAbiertoSignal.set(true);
  }

  cerrarCarrito() {
    this.carritoAbiertoSignal.set(false);
  }

  /**
   * Añade un producto al carrito (con soporte para talles)
   */
  agregarProducto(producto: Producto, cantidad: number = 1, talle?: Talle, precioUnitario?: number): void {
    const items = [...this.itemsSignal()];

    // Si tiene talle, buscar por producto Y talle
    // Si no tiene talle, buscar solo por producto
    const index = items.findIndex(item => {
      if (talle) {
        return item.producto.id === producto.id && item.talle?.id === talle.id;
      }
      return item.producto.id === producto.id && !item.talle;
    });

    // Precio a usar: específico del talle > específico pasado > precio base del producto
    const precio = precioUnitario ?? producto.precio;

    if (index >= 0) {
      // Si ya existe, aumentar cantidad
      items[index].cantidad += cantidad;
      items[index].subtotal = items[index].cantidad * (items[index].precio_unitario || precio);
    } else {
      // Si no existe, agregarlo
      items.push({
        producto,
        cantidad,
        subtotal: precio * cantidad,
        talle,
        precio_unitario: precioUnitario
      });
    }

    this.itemsSignal.set(items);
    this.saveToStorage();
  }

  /**
   * Elimina un producto del carrito (con soporte para talles)
   */
  eliminarProducto(productoId: string, talleId?: string): void {
    const items = this.itemsSignal().filter(item => {
      if (talleId) {
        // Si se especifica talle, eliminar solo esa combinación
        return !(item.producto.id === productoId && item.talle?.id === talleId);
      }
      // Si no se especifica talle, eliminar todas las variantes del producto
      return item.producto.id !== productoId;
    });

    this.itemsSignal.set(items);
    this.saveToStorage();
  }

  /**
   * Actualiza la cantidad de un producto (con soporte para talles)
   */
  actualizarCantidad(productoId: string, cantidad: number, talleId?: string): void {
    if (cantidad <= 0) {
      this.eliminarProducto(productoId, talleId);
      return;
    }

    const items = this.itemsSignal().map(item => {
      const coincide = talleId
        ? (item.producto.id === productoId && item.talle?.id === talleId)
        : (item.producto.id === productoId && !item.talle);

      if (coincide) {
        const precio = item.precio_unitario || item.producto.precio;
        return {
          ...item,
          cantidad,
          subtotal: cantidad * precio
        };
      }
      return item;
    });

    this.itemsSignal.set(items);
    this.saveToStorage();
  }

  /**
   * Vacía el carrito
   */
  vaciarCarrito(): void {
    this.itemsSignal.set([]);
    this.saveToStorage();
  }

  /**
   * Verifica si un producto está en el carrito
   */
  estaEnCarrito(productoId: string): boolean {
    return this.itemsSignal().some(item => item.producto.id === productoId);
  }

  /**
   * Obtiene la cantidad de un producto en el carrito
   */
  getCantidadProducto(productoId: string): number {
    const item = this.itemsSignal().find(item => item.producto.id === productoId);
    return item?.cantidad || 0;
  }

  /**
   * Guarda el carrito en localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.itemsSignal()));
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }

  /**
   * Carga el carrito desde localStorage
   */
  private loadFromStorage(): ItemCarrito[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
      return [];
    }
  }
}
