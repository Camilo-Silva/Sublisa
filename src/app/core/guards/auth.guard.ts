import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege las rutas del admin
 * Solo permite acceso si el usuario está autenticado
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si hay una sesión válida
  const isAuthenticated = await authService.verifySession();

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    await router.navigate(['/admin/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
