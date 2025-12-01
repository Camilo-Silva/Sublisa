import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductosService } from '../../../core/services/productos.service';
import { ModalService } from '../../../core/services/modal.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { CategoriaConSubcategorias } from '../../../core/models/categoria.interface';
import { Producto } from '../../../core/models';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  menuAbierto = false;
  menuProductosAbierto = signal(false);
  menuProductosMovilAbierto = signal(false);
  categorias = signal<CategoriaConSubcategorias[]>([]);
  categoriaHover = signal<string | null>(null);
  categoriaExpandidaMobile = signal<string | null>(null);
  loading = signal(false);

  // Búsqueda
  searchActivo = signal(false);
  searchQuery = signal('');
  sugerencias = signal<Producto[]>([]);
  mostrarSugerencias = signal(false);
  loadingSearch = signal(false);
  selectedSuggestionIndex = signal(-1);

  constructor(
    public carritoService: CarritoService,
    public authService: AuthService,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    private readonly modalService: ModalService,
    private readonly categoriasService: CategoriasService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      this.loading.set(true);
      const categorias = await this.categoriasService.getCategoriasConSubcategorias();
      this.categorias.set(categorias);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getSubcategorias(categoriaId: string): any[] {
    const categoria = this.categorias().find(c => c.nombre === categoriaId);
    return categoria?.subcategorias || [];
  }

  onCategoriaHover(categoria: string | null) {
    this.categoriaHover.set(categoria);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
    this.menuProductosAbierto.set(false);
    this.categoriaExpandidaMobile.set(null);
  }

  toggleProductosMobile(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.menuProductosMovilAbierto.update(v => !v);
    // Si se cierra Productos, cerrar también las categorías expandidas
    if (!this.menuProductosMovilAbierto()) {
      this.categoriaExpandidaMobile.set(null);
    }
  }

  toggleCategoriaMobile(categoriaNombre: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.categoriaExpandidaMobile() === categoriaNombre) {
      this.categoriaExpandidaMobile.set(null);
    } else {
      this.categoriaExpandidaMobile.set(categoriaNombre);
    }
  }

  toggleMenuProductos() {
    this.menuProductosAbierto.update(v => !v);
  }

  cerrarMenuProductos() {
    setTimeout(() => this.menuProductosAbierto.set(false), 200);
  }

  async logout() {
    const confirmado = await this.modalService.logoutConfirm();

    if (confirmado) {
      await this.modalService.logoutSuccess();
      await this.authService.logout();
      this.cerrarMenu();
    }
  }

  // ========== MÉTODOS DE BÚSQUEDA ==========

  activarBusqueda() {
    this.searchActivo.set(true);
    setTimeout(() => {
      const input = document.querySelector('.search-input-header') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  cerrarBusqueda() {
    this.searchActivo.set(false);
    this.searchQuery.set('');
    this.sugerencias.set([]);
    this.mostrarSugerencias.set(false);
    this.selectedSuggestionIndex.set(-1);
  }

  async onSearchInput(query: string) {
    this.searchQuery.set(query);

    if (!query || query.trim().length < 2) {
      this.sugerencias.set([]);
      this.mostrarSugerencias.set(false);
      return;
    }

    try {
      this.loadingSearch.set(true);
      const resultados = await this.productosService.searchProductos(query.trim());
      this.sugerencias.set(resultados.slice(0, 5)); // Máximo 5 sugerencias
      this.mostrarSugerencias.set(resultados.length > 0);
      this.selectedSuggestionIndex.set(-1); // Resetear selección
    } catch (error) {
      console.error('Error al buscar productos:', error);
      this.sugerencias.set([]);
      this.mostrarSugerencias.set(false);
    } finally {
      this.loadingSearch.set(false);
    }
  }

  irAProducto(productoId: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.cerrarBusqueda();
    this.router.navigate(['/producto', productoId]);
  }

  onSearchEnter() {
    const query = this.searchQuery().trim();
    if (query) {
      this.cerrarBusqueda();
      this.router.navigate(['/productos'], {
        queryParams: { q: query },
        fragment: 'filtros-categorias'
      });
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    const suggestions = this.sugerencias();
    const currentIndex = this.selectedSuggestionIndex();

    if (event.key === 'Escape') {
      this.cerrarBusqueda();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (suggestions.length > 0) {
        const newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        this.selectedSuggestionIndex.set(newIndex);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length > 0) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        this.selectedSuggestionIndex.set(newIndex);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (currentIndex >= 0 && currentIndex < suggestions.length) {
        // Navegar al producto seleccionado
        this.irAProducto(suggestions[currentIndex].id);
      } else {
        // Buscar todos los resultados
        this.onSearchEnter();
      }
    }
  }
}
