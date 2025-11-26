import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  nombre = signal('');
  apellido = signal('');
  email = signal('');
  telefono = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit() {
    // Validaciones
    if (!this.nombre() || !this.apellido() || !this.email() || !this.password()) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.error.set('Por favor ingrese un email válido');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.authService.register({
        nombre: this.nombre(),
        apellido: this.apellido(),
        email: this.email(),
        telefono: this.telefono(),
        password: this.password()
      });

      // El AuthService ya redirige a /mi-cuenta
    } catch (err: any) {
      console.error('Error en registro:', err);

      if (err.message.includes('User already registered')) {
        this.error.set('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (err.message.includes('Invalid email')) {
        this.error.set('El email ingresado no es válido');
      } else {
        this.error.set('Error al crear la cuenta. Por favor intenta nuevamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(v => !v);
  }
}
