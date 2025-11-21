import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../../../core/services/productos.service';
import { Producto } from '../../../../core/models';
import { ProductoCard } from '../producto-card/producto-card';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  categoriaSeleccionada = signal<string>('TODAS');
  categorias = signal<string[]>(['TODAS']);
  
  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = signal(12);
  totalPaginas = signal(1);
  productosPaginados = signal<Producto[]>([]);

  // Exponer Math para el template
  Math = Math;

  constructor(private readonly productosService: ProductosService) {}

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

      // Extraer categorías únicas
      const categoriasUnicas = ['TODAS', ...new Set(data.map(p => p.categoria).filter(Boolean))];
      this.categorias.set(categoriasUnicas as string[]);

      // Calcular paginación inicial
      this.calcularPaginacion();
    } catch (err) {
      console.error('Error al cargar productos:', err);
      this.error.set('Error al cargar los productos. Por favor, intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async buscarProductos(event: Event) {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    this.busqueda.set(query);

    if (query.length === 0) {
      await this.cargarProductos();
      return;
    }

    try {
      this.loading.set(true);
      const data = await this.productosService.searchProductos(query);
      this.productos.set(data);
      this.aplicarFiltros();
    } catch (err) {
      console.error('Error al buscar productos:', err);
      this.error.set('Error al buscar productos.');
    } finally {
      this.loading.set(false);
    }
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    let filtrados = [...this.productos()];

    // Filtrar por categoría
    if (this.categoriaSeleccionada() !== 'TODAS') {
      filtrados = filtrados.filter(p => p.categoria === this.categoriaSeleccionada());
    }

    this.productosFiltrados.set(filtrados);
    this.paginaActual.set(1); // Resetear a página 1 al filtrar
    this.calcularPaginacion();
  }

  private calcularPaginacion() {
    const totalItems = this.productosFiltrados().length;
    const paginas = Math.ceil(totalItems / this.itemsPorPagina());
    this.totalPaginas.set(paginas || 1);

    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    const fin = inicio + this.itemsPorPagina();
    const paginados = this.productosFiltrados().slice(inicio, fin);
    this.productosPaginados.set(paginados);
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(p => p - 1);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.calcularPaginacion();
      this.scrollToTop();
    }
  }

  getPaginasVisibles(): number[] {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);
      
      if (actual > 3) {
        paginas.push(-1); // Indicador de "..."
      }

      const inicio = Math.max(2, actual - 1);
      const fin = Math.min(total - 1, actual + 1);

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (actual < total - 2) {
        paginas.push(-1); // Indicador de "..."
      }

      paginas.push(total);
    }

    return paginas;
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
