import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Configuracion, ConfiguracionNegocio } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  // Signal para mantener la configuración en cache y actualizar automáticamente
  private readonly configuracionCache = signal<ConfiguracionNegocio | null>(null);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Inicializa la configuración (debe llamarse desde app.ts o similar)
   */
  inicializar() {
    this.cargarConfiguracion();
  }

  /**
   * Obtiene la configuración como signal (reactivo)
   */
  getConfiguracionSignal() {
    return this.configuracionCache;
  }

  /**
   * Carga la configuración desde la base de datos
   */
  private async cargarConfiguracion() {
    try {
      const config = await this.fetchConfiguracion();
      this.configuracionCache.set(config);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  }

  /**
   * Obtiene la configuración desde la base de datos
   */
  private async fetchConfiguracion(): Promise<ConfiguracionNegocio> {
    const { data, error } = await this.supabase.getClient()
      .from('configuracion')
      .select('*');

    if (error) throw error;

    // Convertir array de configuraciones a objeto
    const config: any = {};
    if (data) {
      for (const item of data as Configuracion[]) {
        config[item.clave] = item.valor;
      }
    }

    return config as ConfiguracionNegocio;
  }

  /**
   * Obtiene la configuración (método legacy)
   */
  async getConfiguracion(): Promise<ConfiguracionNegocio> {
    // Si ya está en cache, devolver cache
    const cached = this.configuracionCache();
    if (cached) return cached;

    // Si no, cargar y devolver
    const config = await this.fetchConfiguracion();
    this.configuracionCache.set(config);
    return config;
  }

  async getConfiguracionPorClave(clave: string): Promise<string> {
    const { data, error } = await this.supabase.getClient()
      .from('configuracion')
      .select('valor')
      .eq('clave', clave)
      .single();

    if (error) throw error;
    return data?.valor || '';
  }

  async actualizarConfiguracion(clave: string, valor: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('configuracion')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('clave', clave);

    if (error) throw error;
  }

  async actualizarConfiguracionCompleta(config: ConfiguracionNegocio): Promise<void> {
    const updates = [
      this.actualizarConfiguracion('email_contacto', config.email_contacto),
      this.actualizarConfiguracion('whatsapp_vendedor', config.whatsapp_vendedor),
      this.actualizarConfiguracion('mensaje_bienvenida', config.mensaje_bienvenida),
      this.actualizarConfiguracion('nombre_negocio', config.nombre_negocio),
      this.actualizarConfiguracion('direccion', config.direccion),
      this.actualizarConfiguracion('localidad', config.localidad),
      this.actualizarConfiguracion('provincia', config.provincia),
    ];

    await Promise.all(updates);

    // Recargar configuración para actualizar el cache
    await this.cargarConfiguracion();
  }  /**
   * Forzar recarga de la configuración
   */
  async recargar(): Promise<void> {
    await this.cargarConfiguracion();
  }
}
