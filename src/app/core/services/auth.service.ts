import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { UserProfile } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly isAuthenticatedSignal = signal(false);
  private readonly currentUserSignal = signal<any>(null);
  private readonly userProfileSignal = signal<UserProfile | null>(null);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {
    void this.initializeSession();
  }

  /**
   * Inicializa y verifica la sesión al cargar la app
   */
  private async initializeSession() {
    try {
      const session = await this.supabase.getSession();
      if (session?.user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(session.user);
        await this.loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error al inicializar sesión:', error);
    }
  }

  /**
   * Carga el perfil del usuario desde la base de datos
   */
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (data) {
        this.userProfileSignal.set(data as UserProfile);
      }
    } catch (error) {
      console.error('Error al cargar perfil de usuario:', error);
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(data: { nombre: string; apellido: string; email: string; telefono?: string; password: string }): Promise<void> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.getClient().auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${globalThis.location.origin}/mi-cuenta`,
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Si hay sesión inmediata (email confirmation desactivada)
      if (authData.session) {
        // Esperar para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 300));

        // Crear el perfil (ahora el usuario está autenticado)
        const { error: profileError } = await this.supabase.getClient()
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            telefono: data.telefono || null,
            rol: 'cliente'
          });

        if (profileError) {
          console.error('Error al crear perfil:', profileError);
          throw profileError;
        }

        // Establecer el estado de autenticación
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(authData.user);
        await this.loadUserProfile(authData.user.id);
        await this.router.navigate(['/mi-cuenta']);
      } else {
        // 3. Si NO hay sesión (email confirmation activada)
        // Crear el perfil usando service role (bypass RLS)
        // Por ahora, mostrar mensaje al usuario
        alert('✅ Cuenta creada exitosamente.\n\n⚠️ Por favor, revisa tu email y confirma tu cuenta antes de iniciar sesión.\n\nUna vez confirmado, podrás iniciar sesión normalmente.');
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión y detecta automáticamente si es admin o cliente
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const { session, user } = await this.supabase.signIn(email, password);

      if (session && user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(user);

        // Cargar perfil para determinar el rol
        await this.loadUserProfile(user.id);

        // Si el perfil no existe, crearlo (caso de email confirmation activada)
        let profile = this.userProfileSignal();
        if (!profile) {

          const metadata = user.user_metadata || {};

          const { error: profileError } = await this.supabase.getClient()
            .from('user_profiles')
            .insert({
              user_id: user.id,
              nombre: metadata['nombre'] || user.email?.split('@')[0] || 'Usuario',
              apellido: metadata['apellido'] || '',
              email: user.email || '',
              telefono: metadata['telefono'] || null,
              rol: 'cliente'
            });

          if (profileError) {
            console.error('Error al crear perfil en login:', profileError);
          } else {
            // Recargar el perfil
            await this.loadUserProfile(user.id);
            profile = this.userProfileSignal();
          }
        }

        // Redirigir según el rol
        if (profile?.rol === 'admin') {
          await this.router.navigate(['/admin/dashboard']);
        } else {
          await this.router.navigate(['/mi-cuenta']);
        }
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
    } catch (error) {
      console.error('Error al cerrar sesión (ignorado):', error);
      // Continuar con la limpieza local aunque falle el logout remoto
    } finally {
      // Siempre limpiar el estado local
      this.isAuthenticatedSignal.set(false);
      this.currentUserSignal.set(null);
      this.userProfileSignal.set(null);
      await this.router.navigate(['/']);
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
        await this.loadUserProfile(session.user.id);
      }

      return isValid;
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      return false;
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  getUserProfile(): UserProfile | null {
    return this.userProfileSignal();
  }

  /**
   * Obtiene el signal del perfil de usuario
   */
  getUserProfileSignal() {
    return this.userProfileSignal;
  }

  /**
   * Verifica si el usuario actual es admin
   */
  isAdmin(): boolean {
    return this.userProfileSignal()?.rol === 'admin';
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const user = this.currentUserSignal();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await this.supabase.getClient()
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      await this.loadUserProfile(user.id);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Envía email para recuperar contraseña
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.getClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw error;
    }
  }

  /**
   * Actualiza la contraseña del usuario (después de usar el link de recuperación)
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.getClient().auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }
}
