import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductosService } from '../../../core/services/productos.service';
import { ModalService } from '../../../core/services/modal.service';
import { CATEGORIAS_JERARQUICAS, getSubcategorias } from '../../../core/config/categorias.config';
import { CategoriaJerarquica } from '../../../core/models/producto.interface';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  menuAbierto = false;
  menuProductosAbierto = signal(false);
  categorias = signal<CategoriaJerarquica[]>([]);
  categoriaHover = signal<string | null>(null);

  constructor(
    public carritoService: CarritoService,
    public authService: AuthService,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  async cargarCategorias() {
    // Usar las categorías jerárquicas predefinidas
    this.categorias.set(CATEGORIAS_JERARQUICAS);
  }

  getSubcategorias(categoriaPrincipal: string): string[] {
    return getSubcategorias(categoriaPrincipal);
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
