import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  returnUrl = signal('/');

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    // Obtener la URL de retorno si existe
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
      }
    });
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.authService.login(this.email(), this.password());

      // El AuthService ya maneja la redirección
      // Pero podemos navegar a la URL de retorno si existe
      await this.router.navigate([this.returnUrl()]);
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
