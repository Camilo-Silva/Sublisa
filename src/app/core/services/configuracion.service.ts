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

  /**
   * Obtiene todas las imágenes del carousel activas ordenadas
   */
  async getImagenesCarousel(): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('imagenes_carousel')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene todas las imágenes del carousel (incluidas inactivas) - para admin
   */
  async getAllImagenesCarousel(): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('imagenes_carousel')
      .select('*')
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Agregar nueva imagen al carousel
   */
  async agregarImagenCarousel(url: string, orden?: number): Promise<void> {
    // Si no se especifica orden, obtener el máximo actual + 1
    if (orden === undefined) {
      const { data, error: selectError } = await this.supabase.getClient()
        .from('imagenes_carousel')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .maybeSingle(); // Cambio: maybeSingle() en vez de single() para manejar tabla vacía

      // Si hay error en el SELECT, intentar orden 1 por defecto
      orden = (data && !selectError) ? data.orden + 1 : 1;
    }

    const { error } = await this.supabase.getClient()
      .from('imagenes_carousel')
      .insert({ url, orden, activo: true });

    if (error) throw error;
  }

  /**
   * Actualizar imagen del carousel
   */
  async actualizarImagenCarousel(id: string, updates: { url?: string; orden?: number; activo?: boolean }): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('imagenes_carousel')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Eliminar imagen del carousel
   */
  async eliminarImagenCarousel(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('imagenes_carousel')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Actualizar orden de múltiples imágenes
   */
  async actualizarOrdenCarousel(imagenes: { id: string; orden: number }[]): Promise<void> {
    const updates = imagenes.map(img =>
      this.supabase.getClient()
        .from('imagenes_carousel')
        .update({ orden: img.orden, updated_at: new Date().toISOString() })
        .eq('id', img.id)
    );

    await Promise.all(updates);
  }
}
