import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Obtiene el cliente de Supabase para operaciones directas
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Obtiene la sesión actual del usuario autenticado
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Inicia sesión con email y contraseña (para admin)
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  /**
   * Cierra sesión
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      // Ignorar error si la sesión ya no existe (AuthSessionMissingError)
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }
    } catch (error: any) {
      // Ignorar silenciosamente si la sesión ya expiró o no existe
      if (error?.message !== 'Auth session missing!') {
        throw error;
      }
    }
  }

  /**
   * Sube un archivo al storage
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene la URL pública de un archivo en storage
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Elimina un archivo del storage
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }
}
