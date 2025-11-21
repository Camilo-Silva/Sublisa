import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) {}

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.supabaseService.signIn(
        this.email(),
        this.password()
      );

      // Redirigir al dashboard
      this.router.navigate(['/admin/dashboard']);
    } catch (err: any) {
      console.error('Error en login:', err);

      if (err.message.includes('Invalid login credentials')) {
        this.error.set('Credenciales incorrectas');
      } else if (err.message.includes('Email not confirmed')) {
        this.error.set('Por favor confirma tu email antes de iniciar sesión');
      } else {
        this.error.set('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }
}
