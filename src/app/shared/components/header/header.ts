import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductosService } from '../../../core/services/productos.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  menuAbierto = false;
  menuProductosAbierto = signal(false);
  categorias = signal<string[]>([]);

  constructor(
    public carritoService: CarritoService,
    public authService: AuthService,
    private readonly router: Router,
    private readonly productosService: ProductosService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      const productos = await this.productosService.getProductos();
      const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
      this.categorias.set(categoriasUnicas as string[]);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
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
    if (confirm('¿Deseas cerrar sesión?')) {
      await this.authService.logout();
      this.cerrarMenu();
    }
  }
}
