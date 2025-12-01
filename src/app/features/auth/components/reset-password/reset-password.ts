import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  newPassword = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit() {
    if (!this.newPassword() || !this.confirmPassword()) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    if (this.newPassword().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.authService.updatePassword(this.newPassword());
      this.success.set(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (err: any) {
      console.error('Error al actualizar contraseña:', err);
      this.error.set('Error al actualizar la contraseña. Por favor intenta nuevamente.');
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
