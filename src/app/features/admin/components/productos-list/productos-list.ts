import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ModalService } from '../../../../core/services/modal.service';
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
  mostrarInactivos = signal(false);

  // Filtros
  categoriaSeleccionada = signal<string | null>(null);
  subcategoriaSeleccionada = signal<string | null>(null);
  filtrosExpandidos = signal(false);

  // Listas de categorías y subcategorías únicas
  categorias = computed(() => {
    const cats = new Set<string>();
    this.productos().forEach(p => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  });

  subcategorias = computed(() => {
    const subs = new Set<string>();
    this.productos().forEach(p => {
      // Si hay categoría seleccionada, filtrar subcategorías de esa categoría
      if (this.categoriaSeleccionada()) {
        if (p.categoria === this.categoriaSeleccionada() && p.subcategoria) {
          subs.add(p.subcategoria);
        }
      } else {
        // Si no hay categoría seleccionada, mostrar todas las subcategorías
        if (p.subcategoria) subs.add(p.subcategoria);
      }
    });
    return Array.from(subs).sort();
  });

  constructor(
    private readonly productosService: ProductosService,
    private readonly categoriasService: CategoriasService,
    private readonly modalService: ModalService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cargarProductos();
  }

  async cargarProductos() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = this.mostrarInactivos()
        ? await this.productosService.getProductosInactivos()
        : await this.productosService.getProductos();
      this.productos.set(data);
      this.productosFiltrados.set(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      this.error.set('Error al cargar productos');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleMostrarInactivos() {
    this.mostrarInactivos.set(!this.mostrarInactivos());
    await this.cargarProductos();
  }

  filtrarProductos() {
    const query = this.busqueda().toLowerCase().trim();
    const categoria = this.categoriaSeleccionada();
    const subcategoria = this.subcategoriaSeleccionada();

    let filtrados = this.productos();

    // Filtro por categoría
    if (categoria) {
      filtrados = filtrados.filter(p => p.categoria === categoria);
    }

    // Filtro por subcategoría
    if (subcategoria) {
      filtrados = filtrados.filter(p => p.subcategoria === subcategoria);
    }

    // Filtro por búsqueda de texto
    if (query) {
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    this.productosFiltrados.set(filtrados);
  }

  seleccionarCategoria(categoria: string) {
    if (this.categoriaSeleccionada() === categoria) {
      this.categoriaSeleccionada.set(null);
    } else {
      this.categoriaSeleccionada.set(categoria);
    }
    // Limpiar subcategoría al cambiar categoría
    this.subcategoriaSeleccionada.set(null);
    this.filtrarProductos();
  }

  seleccionarSubcategoria(subcategoria: string) {
    if (this.subcategoriaSeleccionada() === subcategoria) {
      this.subcategoriaSeleccionada.set(null);
    } else {
      this.subcategoriaSeleccionada.set(subcategoria);
    }
    this.filtrarProductos();
  }

  limpiarFiltros() {
    this.categoriaSeleccionada.set(null);
    this.subcategoriaSeleccionada.set(null);
    this.busqueda.set('');
    this.filtrarProductos();
  }

  toggleFiltros() {
    this.filtrosExpandidos.set(!this.filtrosExpandidos());
  }

  editarProducto(id: string) {
    this.router.navigate(['/admin/productos/editar', id]);
  }

  confirmarDesactivar(producto: Producto) {
    this.productoAEliminar.set(producto);
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
      // Si el producto está inactivo, intentar eliminación permanente
      if (!producto.activo) {
        const verificacion = await this.productosService.puedeEliminarPermanente(producto.id);

        if (verificacion.puede) {
          const confirmado = await this.modalService.confirm(
            '¿Eliminar permanentemente?',
            'Este producto está inactivo y no tiene stock ni precio asignado. ¿Deseas eliminarlo permanentemente de la base de datos? Esta acción no se puede deshacer.'
          );

          if (confirmado) {
            // Eliminar imágenes asociadas
            if (producto.imagenes && producto.imagenes.length > 0) {
              for (const imagen of producto.imagenes) {
                await this.productosService.deleteImagenProducto(imagen.id, imagen.url);
              }
            }

            // Eliminar permanentemente
            await this.productosService.deleteProductoPermanente(producto.id);
            await this.cargarProductos();
            this.productoAEliminar.set(null);
            await this.modalService.success('Producto eliminado permanentemente de la base de datos');
            return;
          } else {
            this.productoAEliminar.set(null);
            return;
          }
        } else {
          // No se puede eliminar permanentemente, mostrar razón
          await this.modalService.warning(
            `No se puede eliminar permanentemente: ${verificacion.razon}`
          );
          this.productoAEliminar.set(null);
          return;
        }
      }

      // Eliminación normal (soft delete) para productos activos
      await this.productosService.deleteProducto(producto.id);

      // Actualizar lista
      await this.cargarProductos();
      this.productoAEliminar.set(null);

      // Mostrar modal de éxito
      await this.modalService.success('Producto desactivado correctamente');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      await this.modalService.error('Error al eliminar el producto');
    }
  }

  async activarProducto(producto: Producto) {
    const confirmado = await this.modalService.confirm(
      '¿Reactivar producto?',
      `¿Deseas reactivar el producto "${producto.nombre}"?`
    );

    if (!confirmado) return;

    try {
      await this.productosService.activarProducto(producto.id);
      await this.cargarProductos();
      await this.modalService.success('Producto reactivado correctamente');
    } catch (err) {
      console.error('Error al reactivar producto:', err);
      await this.modalService.error('Error al reactivar el producto');
    }
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'sin-stock';
    if (stock < 10) return 'stock-bajo';
    return 'stock-ok';
  }
}
