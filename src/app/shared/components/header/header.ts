import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  menuAbierto = false;

  constructor(
    public carritoService: CarritoService,
    public authService: AuthService,
    private readonly router: Router
  ) {}

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  async logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      await this.authService.logout();
      this.cerrarMenu();
    }
  }
}
