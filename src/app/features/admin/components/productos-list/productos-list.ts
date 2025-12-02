import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
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
