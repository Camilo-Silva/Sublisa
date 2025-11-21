import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { Producto } from '../../../../core/models';

@Component({
  selector: 'app-productos-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos-list.html',
  styleUrl: './productos-list.scss',
})
export class ProductosList implements OnInit {
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  productoAEliminar = signal<Producto | null>(null);

  constructor(
    private readonly productosService: ProductosService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  async cargarProductos() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.productosService.getProductos();
      this.productos.set(data);
      this.productosFiltrados.set(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      this.error.set('Error al cargar productos');
    } finally {
      this.loading.set(false);
    }
  }

  filtrarProductos() {
    const query = this.busqueda().toLowerCase().trim();

    if (!query) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    const filtrados = this.productos().filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.descripcion?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.categoria?.toLowerCase().includes(query)
    );

    this.productosFiltrados.set(filtrados);
  }

  editarProducto(id: string) {
    this.router.navigate(['/admin/productos/editar', id]);
  }

  confirmarEliminar(producto: Producto) {
    this.productoAEliminar.set(producto);
  }

  cancelarEliminar() {
    this.productoAEliminar.set(null);
  }

  async eliminarProducto() {
    const producto = this.productoAEliminar();
    if (!producto?.id) return;

    try {
      // Eliminar imágenes asociadas
      if (producto.imagenes && producto.imagenes.length > 0) {
        for (const imagen of producto.imagenes) {
          await this.productosService.deleteImagenProducto(imagen.id, imagen.url);
        }
      }

      // Eliminar producto
      await this.productosService.deleteProducto(producto.id);

      // Actualizar lista
      await this.cargarProductos();
      this.productoAEliminar.set(null);

      alert('✅ Producto eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('❌ Error al eliminar el producto');
    }
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'sin-stock';
    if (stock < 10) return 'stock-bajo';
    return 'stock-ok';
  }
}
