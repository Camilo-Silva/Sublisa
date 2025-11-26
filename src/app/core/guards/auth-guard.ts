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
    const isAuthenticated = authService.isAuthenticated();

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
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      console.log('❌ No autenticado, redirigiendo a /login');
      router.navigate(['/login']);
      return false;
    }

    const isAdmin = authService.isAdmin();
    console.log('🔒 Verificando acceso admin en ruta:', state.url, { isAuthenticated, isAdmin });

    if (isAdmin) {
      console.log('✅ Usuario es admin, permitiendo acceso');
      return true;
    } else {
      console.log('❌ Usuario NO es admin, bloqueando acceso');
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
