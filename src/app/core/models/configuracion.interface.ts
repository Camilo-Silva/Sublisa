export interface Configuracion {
  id: string;
  clave: string;
  valor: string;
  descripcion: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConfiguracionNegocio {
  email_contacto: string;
  whatsapp_vendedor: string;
  mensaje_bienvenida: string;
  nombre_negocio: string;
  direccion: string;
  localidad: string;
  provincia: string;
}
