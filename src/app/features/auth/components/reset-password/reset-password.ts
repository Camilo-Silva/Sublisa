import { Component, OnInit, signal } from '@angular/core';
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
export class ResetPassword implements OnInit {
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

  async ngOnInit() {
    // Esperar a que Supabase procese el hash de la URL
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verificar si hay errores en el hash
    const hash = window.location.hash;
    if (hash && hash.includes('error')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');

      if (errorCode === 'otp_expired') {
        this.error.set('El enlace ha expirado. Solicita uno nuevo desde la página de recuperar contraseña.');
      } else {
        this.error.set('El enlace es inválido. Solicita uno nuevo desde la página de recuperar contraseña.');
      }
    }
  }

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
