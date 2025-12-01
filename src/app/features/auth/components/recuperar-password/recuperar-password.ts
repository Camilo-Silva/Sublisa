import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss',
})
export class RecuperarPassword {
  email = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit() {
    if (!this.email()) {
      this.error.set('Por favor ingresa tu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.error.set('Por favor ingresa un email válido');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.authService.resetPassword(this.email());
      this.success.set(true);
    } catch (err: any) {
      console.error('Error al enviar email de recuperación:', err);
      this.error.set('Error al enviar el email. Por favor intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}
