import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const { data: { session } } = await supabaseService.getClient().auth.getSession();
    
    if (session) {
      return true;
    } else {
      router.navigate(['/admin/login']);
      return false;
    }
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    router.navigate(['/admin/login']);
    return false;
  }
};
