import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Verificar sesión de forma asíncrona
    const isAuthenticated = await authService.verifySession();

    if (isAuthenticated) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Guard para proteger rutas de admin (requiere rol admin)
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Verificar sesión de forma asíncrona
    const isAuthenticated = await authService.verifySession();

    if (!isAuthenticated) {

      router.navigate(['/login']);
      return false;
    }

    const isAdmin = authService.isAdmin();


    if (isAdmin) {

      return true;
    } else {

      // Redirigir silenciosamente - el usuario cliente nunca ve el botón de admin de todas formas
      router.navigate(['/mi-cuenta']);
      return false;
    }
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    router.navigate(['/login']);
    return false;
  }
};
