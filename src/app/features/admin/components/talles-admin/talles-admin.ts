import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TallesService } from '../../../../core/services/talles.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';
import { Talle } from '../../../../core/models';

@Component({
  selector: 'app-talles-admin',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './talles-admin.html',
  styleUrl: './talles-admin.scss',
})
export class TallesAdmin implements OnInit {
  talles = signal<Talle[]>([]);
  loading = signal(true);
  modoEdicion = signal(false);
  talleEditando = signal<Talle | null>(null);
  mostrarFormulario = signal(false);

  // Formulario
  formData = signal({
    codigo: '',
    nombre: '',
    orden: 0,
    activo: true
  });

  // Validación
  erroresValidacion = signal<Record<string, string>>({});

  // Computed values para el summary
  get tallesActivos() {
    return this.talles().filter(t => t.activo).length;
  }

  get tallesInactivos() {
    return this.talles().filter(t => !t.activo).length;
  }

  constructor(
    private readonly tallesService: TallesService,
    private readonly toastService: ToastService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.cargarTalles();
  }

  async cargarTalles() {
    try {
      this.loading.set(true);
      const data = await this.tallesService.getTalles(false); // Incluir inactivos
      this.talles.set(data);
    } catch (error) {
      console.error('Error al cargar talles:', error);
      this.toastService.error('Error al cargar talles');
    } finally {
      this.loading.set(false);
    }
  }

  nuevoTalle() {
    this.modoEdicion.set(false);
    this.talleEditando.set(null);
    this.formData.set({
      codigo: '',
      nombre: '',
      orden: this.talles().length + 1,
      activo: true
    });
    this.erroresValidacion.set({});
    this.mostrarFormulario.set(true);
  }

  editarTalle(talle: Talle) {
    this.modoEdicion.set(true);
    this.talleEditando.set(talle);
    this.formData.set({
      codigo: talle.codigo,
      nombre: talle.nombre,
      orden: talle.orden,
      activo: talle.activo
    });
    this.erroresValidacion.set({});
    this.mostrarFormulario.set(true);

    // Scroll al modal después de un pequeño delay para que se renderice
    setTimeout(() => {
      const modal = document.querySelector('.modal-overlay');
      if (modal) {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  cancelar() {
    this.mostrarFormulario.set(false);
    this.modoEdicion.set(false);
    this.talleEditando.set(null);
    this.erroresValidacion.set({});
  }

  validarFormulario(): boolean {
    const errores: Record<string, string> = {};
    const datos = this.formData();

    if (!datos.codigo.trim()) {
      errores['codigo'] = 'El código es obligatorio';
    } else if (datos.codigo.length > 10) {
      errores['codigo'] = 'El código no puede tener más de 10 caracteres';
    }

    if (!datos.nombre.trim()) {
      errores['nombre'] = 'El nombre es obligatorio';
    } else if (datos.nombre.length > 50) {
      errores['nombre'] = 'El nombre no puede tener más de 50 caracteres';
    }

    if (datos.orden < 0) {
      errores['orden'] = 'El orden debe ser un número positivo';
    }

    this.erroresValidacion.set(errores);
    return Object.keys(errores).length === 0;
  }

  async guardarTalle() {
    if (!this.validarFormulario()) {
      return;
    }

    const confirmado = await this.modalService.confirm(
      this.modoEdicion() ? 'Confirmar Edición' : 'Confirmar Creación',
      this.modoEdicion()
        ? `¿Estás seguro de actualizar el talle "${this.formData().codigo}"?`
        : `¿Estás seguro de crear el talle "${this.formData().codigo}"?`
    );

    if (!confirmado) return;

    try {
      const datos = this.formData();

      if (this.modoEdicion()) {
        const talle = this.talleEditando();
        if (!talle) return;

        await this.tallesService.actualizarTalle(talle.id, datos);
        this.toastService.success('Talle actualizado correctamente');
      } else {
        await this.tallesService.crearTalle(datos);
        this.toastService.success('Talle creado correctamente');
      }

      this.cancelar();
      await this.cargarTalles();
    } catch (error: any) {
      console.error('Error al guardar talle:', error);
      this.toastService.error(error.message || 'Error al guardar talle');
    }
  }

  async cambiarEstado(talle: Talle) {
    try {
      if (talle.activo) {
        // Intentar desactivar
        const enUso = await this.tallesService.talleEnUso(talle.id);

        if (enUso) {
          const productos = await this.tallesService.getProductosConTalle(talle.id);
          const mensaje = `No se puede desactivar el talle "${talle.codigo}" porque está asignado a ${productos.length} producto(s) con stock:\n\n` +
            productos.map((p: any) => `• ${p.productos.nombre} (Stock: ${p.stock})`).join('\n');

          await this.modalService.alert('Talle en uso', mensaje, 'warning');
          return;
        }

        await this.tallesService.desactivarTalle(talle.id);
        this.toastService.success(`Talle "${talle.codigo}" desactivado`);
      } else {
        // Activar
        await this.tallesService.activarTalle(talle.id);
        this.toastService.success(`Talle "${talle.codigo}" activado`);
      }

      await this.cargarTalles();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      this.toastService.error(error.message || 'Error al cambiar estado del talle');
    }
  }

  async eliminarTalle(talle: Talle) {
    const confirmado = await this.modalService.confirm(
      'Confirmar eliminación',
      `¿Está seguro que desea eliminar el talle "${talle.codigo}"?\n\nEsta acción no se puede deshacer y solo se permite si el talle no tiene referencias en productos.`
    );

    if (!confirmado) return;

    try {
      await this.tallesService.eliminarTalle(talle.id);
      this.toastService.success(`Talle "${talle.codigo}" eliminado correctamente`);
      await this.cargarTalles();
    } catch (error: any) {
      console.error('Error al eliminar talle:', error);
      this.toastService.error(error.message || 'Error al eliminar talle');
    }
  }

  async verProductosConTalle(talle: Talle) {
    try {
      const productos = await this.tallesService.getProductosConTalle(talle.id);

      if (productos.length === 0) {
        await this.modalService.alert(
          `Talle: ${talle.codigo}`,
          'Este talle no está asignado a ningún producto con stock.',
          'info'
        );
        return;
      }

      const mensaje = `Productos con el talle "${talle.codigo}":\n\n` +
        productos.map((p: any) =>
          `• ${p.productos.nombre} (SKU: ${p.productos.sku || 'N/A'}) - Stock: ${p.stock}`
        ).join('\n');

      await this.modalService.alert(`Talle: ${talle.codigo}`, mensaje, 'info');
    } catch (error) {
      console.error('Error al obtener productos:', error);
      this.toastService.error('Error al cargar productos');
    }
  }
}
