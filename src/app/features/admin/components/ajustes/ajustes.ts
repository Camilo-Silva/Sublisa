import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';
import { ConfiguracionNegocio } from '../../../../core/models';
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

  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.cargarConfiguracion();
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
}
