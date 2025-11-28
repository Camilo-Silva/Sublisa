import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ProductosService } from '../../../../core/services/productos.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { Producto } from '../../../../core/models';
import { ProductoCard } from '../producto-card/producto-card';
import { Breadcrumbs, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, ProductoCard, Breadcrumbs],
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
  subcategoriaSeleccionada = signal<string>('TODAS');
  categorias = signal<string[]>(['TODAS']);
  subcategoriasMap = signal<Map<string, string[]>>(new Map());

  // Subcategorías disponibles basadas en la categoría seleccionada
  subcategoriasDisponibles = computed(() => {
    const categoria = this.categoriaSeleccionada();
    if (categoria === 'TODAS') return [];
    return this.subcategoriasMap().get(categoria) || [];
  });

  // Mostrar sidebar solo cuando hay categoría seleccionada
  mostrarSidebar = computed(() => {
    return this.categoriaSeleccionada() !== 'TODAS' && this.subcategoriasDisponibles().length > 0;
  });

  // Control del sidebar mobile
  sidebarMobileAbierto = signal(false);

  // Breadcrumbs dinámicos
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Inicio', url: '/' }
    ];

    const categoria = this.categoriaSeleccionada();
    const subcategoria = this.subcategoriaSeleccionada();

    if (categoria && categoria !== 'TODAS') {
      items.push({
        label: categoria,
        url: '/productos',
        queryParams: { categoria }
      });

      if (subcategoria && subcategoria !== 'TODAS') {
        items.push({
          label: subcategoria
        });
      }
    } else {
      items.push({
        label: 'Productos'
      });
    }

    return items;
  });

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = signal(12);
  totalPaginas = signal(1);
  productosPaginados = signal<Producto[]>([]);

  // Exponer Math para el template
  Math = Math;

  constructor(
    private readonly productosService: ProductosService,
    private readonly categoriasService: CategoriasService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly titleService: Title
  ) {}

  navegarASubcategoria(subcategoria: string) {
    this.router.navigate(['/productos'], {
      queryParams: {
        categoria: this.categoriaSeleccionada(),
        subcategoria: subcategoria
      }
    });
  }

  limpiarSubcategoria() {
    this.router.navigate(['/productos'], {
      queryParams: {
        categoria: this.categoriaSeleccionada()
      }
    });
    this.cerrarSidebarMobile();
  }

  abrirSidebarMobile() {
    this.sidebarMobileAbierto.set(true);
  }

  cerrarSidebarMobile() {
    this.sidebarMobileAbierto.set(false);
  }

  navegarASubcategoriaYCerrar(subcategoria: string) {
    this.navegarASubcategoria(subcategoria);
    this.cerrarSidebarMobile();
  }

  ngOnInit() {
    this.titleService.setTitle('Tienda Online de Sublisa');
    this.cargarCategorias();

    // Suscribirse a cambios en los query params
    this.route.queryParams.subscribe(params => {
      const categoria = params['categoria'];
      const subcategoria = params['subcategoria'];

      if (categoria) {
        this.categoriaSeleccionada.set(categoria);
      } else {
        this.categoriaSeleccionada.set('TODAS');
      }

      if (subcategoria) {
        this.subcategoriaSeleccionada.set(subcategoria);
      } else {
        this.subcategoriaSeleccionada.set('TODAS');
      }

      // Scroll al inicio cuando cambian los filtros
      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.cargarProductos();
    });
  }

  async cargarCategorias() {
    try {
      const categorias = await this.categoriasService.getCategoriasConSubcategorias();
      const categoriasNombres = ['TODAS', ...categorias.map(c => c.nombre)];
      this.categorias.set(categoriasNombres);

      // Crear mapa de subcategorías
      const map = new Map<string, string[]>();
      for (const cat of categorias) {
        map.set(cat.nombre, cat.subcategorias.map(sub => sub.nombre));
      }
      this.subcategoriasMap.set(map);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  async cargarProductos() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.productosService.getProductos();
      this.productos.set(data);

      // Extraer categorías únicas
      const categoriasUnicas = ['TODAS', ...new Set(data.map(p => p.categoria).filter(Boolean))];
      this.categorias.set(categoriasUnicas as string[]);

      // Aplicar filtros según la categoría seleccionada
      this.aplicarFiltros();
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
    // Navegar con la nueva categoría y limpiar subcategoría
    if (categoria === 'TODAS') {
      this.router.navigate(['/productos']);
    } else {
      this.router.navigate(['/productos'], {
        queryParams: { categoria: categoria }
      });
    }
  }

  private aplicarFiltros() {
    let filtrados = [...this.productos()];

    // Filtrar por categoría
    if (this.categoriaSeleccionada() !== 'TODAS') {
      filtrados = filtrados.filter(p => p.categoria === this.categoriaSeleccionada());
    }

    // Filtrar por subcategoría
    if (this.subcategoriaSeleccionada() !== 'TODAS') {
      filtrados = filtrados.filter(p => p.subcategoria === this.subcategoriaSeleccionada());
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
