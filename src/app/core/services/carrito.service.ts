import { Injectable, signal, computed } from '@angular/core';
import { ItemCarrito, Producto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly STORAGE_KEY = 'sublisa_carrito';

  // Señal reactiva para los items del carrito
  private readonly itemsSignal = signal<ItemCarrito[]>(this.loadFromStorage());

  // Computed signals para cálculos
  items = this.itemsSignal.asReadonly();

  cantidadTotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.cantidad, 0)
  );

  subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.subtotal, 0)
  );

  /**
   * Añade un producto al carrito
   */
  agregarProducto(producto: Producto, cantidad: number = 1): void {
    const items = [...this.itemsSignal()];
    const index = items.findIndex(item => item.producto.id === producto.id);

    if (index >= 0) {
      // Si ya existe, aumentar cantidad
      items[index].cantidad += cantidad;
      items[index].subtotal = items[index].cantidad * items[index].producto.precio;
    } else {
      // Si no existe, agregarlo
      items.push({
        producto,
        cantidad,
        subtotal: producto.precio * cantidad
      });
    }

    this.itemsSignal.set(items);
    this.saveToStorage();
  }

  /**
   * Elimina un producto del carrito
   */
  eliminarProducto(productoId: string): void {
    const items = this.itemsSignal().filter(item => item.producto.id !== productoId);
    this.itemsSignal.set(items);
    this.saveToStorage();
  }

  /**
   * Actualiza la cantidad de un producto
   */
  actualizarCantidad(productoId: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminarProducto(productoId);
      return;
    }

    const items = this.itemsSignal().map(item => {
      if (item.producto.id === productoId) {
        return {
          ...item,
          cantidad,
          subtotal: cantidad * item.producto.precio
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
