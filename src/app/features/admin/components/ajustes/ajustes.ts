import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ConfiguracionNegocio, ImagenCarousel } from '../../../../core/models';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-ajustes',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.scss',
})
export class Ajustes implements OnInit {
  configuracion = signal<ConfiguracionNegocio>({
    email_contacto: '',
    whatsapp_vendedor: '',
    mensaje_bienvenida: '',
    nombre_negocio: '',
    direccion: '',
    localidad: '',
    provincia: ''
  });
  loading = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);

  // Gestión de imágenes del carousel
  imagenesCarousel = signal<ImagenCarousel[]>([]);
  loadingCarousel = signal(false);
  uploadingCarousel = signal(false);
  selectedCarouselFiles = signal<File[]>([]);
  previewCarouselUrls = signal<string[]>([]);

  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly supabaseService: SupabaseService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.cargarConfiguracion();
    this.cargarImagenesCarousel();
  }

  async cargarConfiguracion() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const config = await this.configuracionService.getConfiguracion();
      this.configuracion.set(config);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      this.error.set('Error al cargar la configuración');
      await this.modalService.error('Error al cargar la configuración');
    } finally {
      this.loading.set(false);
    }
  }

  async guardarConfiguracion() {
    const config = this.configuracion();

    // Validaciones
    if (!config.nombre_negocio.trim()) {
      await this.modalService.warning('El nombre del negocio es obligatorio');
      return;
    }

    if (!config.email_contacto.trim()) {
      await this.modalService.warning('El email de contacto es obligatorio');
      return;
    }

    if (!config.whatsapp_vendedor.trim()) {
      await this.modalService.warning('El WhatsApp del vendedor es obligatorio');
      return;
    }

    if (!config.direccion.trim()) {
      await this.modalService.warning('La dirección es obligatoria');
      return;
    }

    if (!config.localidad.trim()) {
      await this.modalService.warning('La localidad es obligatoria');
      return;
    }

    if (!config.provincia.trim()) {
      await this.modalService.warning('La provincia es obligatoria');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.email_contacto)) {
      await this.modalService.warning('El formato del email no es válido');
      return;
    }

    // Validar formato de WhatsApp (debe empezar con + y tener números)
    const whatsappRegex = /^\+\d{10,15}$/;
    if (!whatsappRegex.test(config.whatsapp_vendedor.replaceAll(' ', ''))) {
      await this.modalService.warning('El formato del WhatsApp debe ser +54911XXXXXXXX (sin espacios)');
      return;
    }

    const confirmar = await this.modalService.confirm(
      'Guardar Cambios',
      '¿Estás seguro de que deseas actualizar la configuración del negocio?'
    );

    if (!confirmar) return;

    try {
      this.guardando.set(true);
      await this.configuracionService.actualizarConfiguracionCompleta(config);
      await this.modalService.success('Configuración actualizada exitosamente');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      await this.modalService.error('Error al guardar la configuración');
    } finally {
      this.guardando.set(false);
    }
  }

  actualizarCampo(campo: keyof ConfiguracionNegocio, valor: string) {
    this.configuracion.update(config => ({
      ...config,
      [campo]: valor
    }));
  }

  // ============================================
  // MÉTODOS PARA GESTIÓN DE IMÁGENES DEL CAROUSEL
  // ============================================

  async cargarImagenesCarousel() {
    try {
      this.loadingCarousel.set(true);
      const imagenes = await this.configuracionService.getAllImagenesCarousel();
      this.imagenesCarousel.set(imagenes);
    } catch (err) {
      console.error('Error al cargar imágenes del carousel:', err);
      await this.modalService.error('Error al cargar las imágenes del carousel');
    } finally {
      this.loadingCarousel.set(false);
    }
  }

  onCarouselFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.selectedCarouselFiles.set([...this.selectedCarouselFiles(), ...files]);

    // Crear previews
    const newPreviews: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          this.previewCarouselUrls.set([...this.previewCarouselUrls(), ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    input.value = '';
  }

  removeCarouselPreview(index: number) {
    const files = this.selectedCarouselFiles();
    const previews = this.previewCarouselUrls();

    files.splice(index, 1);
    previews.splice(index, 1);

    this.selectedCarouselFiles.set([...files]);
    this.previewCarouselUrls.set([...previews]);
  }

  async subirImagenesCarousel() {
    const files = this.selectedCarouselFiles();
    if (files.length === 0) {
      await this.modalService.warning('Selecciona al menos una imagen');
      return;
    }

    const confirmar = await this.modalService.confirm(
      'Subir Imágenes',
      `¿Deseas subir ${files.length} imagen(es) al carousel?`
    );
    if (!confirmar) return;

    try {
      this.uploadingCarousel.set(true);

      // Obtener el último orden
      const imagenes = this.imagenesCarousel();
      let ultimoOrden = imagenes.length > 0 ? Math.max(...imagenes.map(img => img.orden)) : 0;

      for (const file of files) {
        // Generar nombre único
        const timestamp = Date.now();
        const fileName = `carousel_${timestamp}_${file.name}`;
        const filePath = `carousel/${fileName}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await this.supabaseService.getClient()
          .storage
          .from('productos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = this.supabaseService.getClient()
          .storage
          .from('productos')
          .getPublicUrl(filePath);

        // Insertar en la tabla
        ultimoOrden++;
        await this.configuracionService.agregarImagenCarousel(publicUrl, ultimoOrden);
      }

      // Limpiar selección
      this.selectedCarouselFiles.set([]);
      this.previewCarouselUrls.set([]);

      // Recargar imágenes
      await this.cargarImagenesCarousel();
      await this.modalService.success('Imágenes subidas exitosamente');
    } catch (err) {
      console.error('Error al subir imágenes:', err);
      await this.modalService.error('Error al subir las imágenes');
    } finally {
      this.uploadingCarousel.set(false);
    }
  }

  async eliminarImagenCarousel(imagen: ImagenCarousel) {
    const confirmar = await this.modalService.confirm(
      'Eliminar Imagen',
      '¿Estás seguro de que deseas eliminar esta imagen del carousel?'
    );
    if (!confirmar) return;

    try {
      // Intentar extraer el path del storage solo si es una URL completa
      if (imagen.url.startsWith('http')) {
        try {
          const url = new URL(imagen.url);
          const regex = /\/productos\/(.+)$/;
          const pathMatch = regex.exec(url.pathname);

          if (pathMatch) {
            const filePath = pathMatch[1];
            // Eliminar del storage
            await this.supabaseService.getClient()
              .storage
              .from('productos')
              .remove([filePath]);
          }
        } catch (urlError) {
          console.warn('No se pudo parsear la URL, pero continuamos con la eliminación:', urlError);
        }
      }
      // Si es una ruta relativa (como /images/1.png), solo eliminar de BD

      // Eliminar de la base de datos
      await this.configuracionService.eliminarImagenCarousel(imagen.id);

      // Recargar imágenes
      await this.cargarImagenesCarousel();
      await this.modalService.success('Imagen eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      await this.modalService.error('Error al eliminar la imagen');
    }
  }

  async toggleActivoCarousel(imagen: ImagenCarousel) {
    try {
      await this.configuracionService.actualizarImagenCarousel(imagen.id, {
        activo: !imagen.activo
      });

      // Actualizar estado local
      this.imagenesCarousel.update(imagenes =>
        imagenes.map(img =>
          img.id === imagen.id ? { ...img, activo: !img.activo } : img
        )
      );

      await this.modalService.success(
        imagen.activo ? 'Imagen desactivada' : 'Imagen activada'
      );
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      await this.modalService.error('Error al cambiar el estado de la imagen');
    }
  }

  async moverImagenCarousel(imagen: ImagenCarousel, direccion: 'arriba' | 'abajo') {
    const imagenes = this.imagenesCarousel();
    const index = imagenes.findIndex(img => img.id === imagen.id);

    if (index === -1) return;
    if (direccion === 'arriba' && index === 0) return;
    if (direccion === 'abajo' && index === imagenes.length - 1) return;

    // Swap con la imagen vecina
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1;
    const imagenVecina = imagenes[newIndex];

    try {
      await this.configuracionService.actualizarOrdenCarousel([
        { id: imagen.id, orden: imagenVecina.orden },
        { id: imagenVecina.id, orden: imagen.orden }
      ]);

      // Recargar imágenes
      await this.cargarImagenesCarousel();
    } catch (err) {
      console.error('Error al cambiar orden:', err);
      await this.modalService.error('Error al cambiar el orden');
    }
  }
}
