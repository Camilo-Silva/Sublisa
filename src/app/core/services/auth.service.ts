import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal(false);
  private currentUserSignal = signal<any>(null);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {
    this.checkSession();
  }

  /**
   * Verifica si hay una sesión activa al iniciar la app
   */
  private async checkSession() {
    try {
      const session = await this.supabase.getSession();
      if (session?.user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(session.user);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
    }
  }

  /**
   * Inicia sesión
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const { session, user } = await this.supabase.signIn(email, password);
      
      if (session && user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(user);
        await this.router.navigate(['/admin/dashboard']);
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.isAuthenticatedSignal.set(false);
      this.currentUserSignal.set(null);
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  /**
   * Obtiene el signal de autenticación
   */
  isAuthenticatedSignal$() {
    return this.isAuthenticatedSignal;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.currentUserSignal();
  }

  /**
   * Verifica la sesión actual (usado por el guard)
   */
  async verifySession(): Promise<boolean> {
    try {
      const session = await this.supabase.getSession();
      const isValid = !!session?.user;
      this.isAuthenticatedSignal.set(isValid);
      
      if (isValid && session.user) {
        this.currentUserSignal.set(session.user);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      return false;
    }
  }
}
