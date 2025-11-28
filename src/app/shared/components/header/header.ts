import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductosService } from '../../../core/services/productos.service';
import { ModalService } from '../../../core/services/modal.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { CategoriaConSubcategorias } from '../../../core/models/categoria.interface';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
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
    const result = await this.modalService.confirm(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?'
    );
    if (result) {
      await this.authService.logout();
      this.cerrarMenu();
    }
  }
}
