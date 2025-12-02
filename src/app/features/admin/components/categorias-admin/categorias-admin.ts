import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { ModalService } from '../../../../core/services/modal.service';
import { Categoria, Subcategoria } from '../../../../core/models/categoria.interface';

@Component({
  selector: 'app-categorias-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categorias-admin.html',
  styleUrl: './categorias-admin.scss',
})
export class CategoriasAdmin implements OnInit {
  categorias = signal<Categoria[]>([]);
  subcategorias = signal<Subcategoria[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal de categoría
  mostrarModalCategoria = signal(false);
  categoriaEditando = signal<Categoria | null>(null);
  formCategoria = signal({
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0,
    activo: true
  });

  // Modal de subcategoría
  mostrarModalSubcategoria = signal(false);
  subcategoriaEditando = signal<Subcategoria | null>(null);
  categoriaSeleccionada = signal<Categoria | null>(null);
  formSubcategoria = signal({
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0,
    activo: true
  });

  constructor(
    private readonly categoriasService: CategoriasService,
    private readonly modalService: ModalService
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      this.loading.set(true);
      const data = await this.categoriasService.getCategoriasAdmin();
      this.categorias.set(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      this.error.set('Error al cargar las categorías');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarSubcategorias(categoriaId: string) {
    try {
      const data = await this.categoriasService.getSubcategoriasAdmin(categoriaId);
      this.subcategorias.set(data);
    } catch (err) {
      console.error('Error al cargar subcategorías:', err);
    }
  }

  // ==================== CATEGORÍAS ====================

  abrirModalNuevaCategoria() {
    this.categoriaEditando.set(null);
    this.formCategoria.set({
      nombre: '',
      descripcion: '',
      icono: '',
      orden: this.categorias().length,
      activo: true
    });
    this.mostrarModalCategoria.set(true);
  }

  abrirModalEditarCategoria(categoria: Categoria) {
    this.categoriaEditando.set(categoria);
    this.formCategoria.set({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      icono: categoria.icono || '',
      orden: categoria.orden,
      activo: categoria.activo
    });
    this.mostrarModalCategoria.set(true);
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria.set(false);
    this.categoriaEditando.set(null);
  }

  async guardarCategoria() {
    const form = this.formCategoria();

    if (!form.nombre.trim()) {
      await this.modalService.warning('El nombre es obligatorio');
      return;
    }

    try {
      this.loading.set(true);
      const esEdicion = !!this.categoriaEditando();

      if (esEdicion) {
        await this.categoriasService.updateCategoria(this.categoriaEditando()!.id, form);
      } else {
        await this.categoriasService.createCategoria(form);
      }

      await this.cargarCategorias();
      this.loading.set(false);
      this.cerrarModalCategoria();

      // Mostrar éxito después de cerrar el modal
      const mensaje = esEdicion ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente';
      await this.modalService.success(mensaje);
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      this.loading.set(false);
      await this.modalService.error('Error al guardar la categoría');
    }
  }

  async eliminarCategoria(categoria: Categoria) {
    try {
      this.loading.set(true);

      // Verificar si puede eliminarse
      const validacion = await this.categoriasService.categoriaPuedeEliminar(categoria.id);

      if (!validacion.puedeEliminar) {
        let mensaje = `La categoría "${categoria.nombre}" no se puede eliminar porque:`;
        const razones: string[] = [];

        if (validacion.tieneSubcategorias) {
          razones.push(`• Tiene ${validacion.cantidadSubcategorias} subcategoría${validacion.cantidadSubcategorias > 1 ? 's' : ''} asociada${validacion.cantidadSubcategorias > 1 ? 's' : ''}`);
        }

        if (validacion.tieneProductos) {
          razones.push(`• Tiene ${validacion.cantidadProductos} producto${validacion.cantidadProductos > 1 ? 's' : ''} asignado${validacion.cantidadProductos > 1 ? 's' : ''}`);
        }

        mensaje += '\n\n' + razones.join('\n');

        await this.modalService.alert('No se puede eliminar', mensaje);
        return;
      }

      const confirmar = await this.modalService.confirm(
        '¿Eliminar categoría?',
        `Se eliminará permanentemente "${categoria.nombre}" de la base de datos.`
      );

      if (!confirmar) return;

      await this.categoriasService.deleteCategoriaHard(categoria.id);
      await this.modalService.success('Categoría eliminada permanentemente');
      await this.cargarCategorias();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      await this.modalService.error('Error al eliminar la categoría');
    } finally {
      this.loading.set(false);
    }
  }

  // ==================== SUBCATEGORÍAS ====================

  async toggleSubcategorias(categoria: Categoria) {
    if (this.categoriaSeleccionada()?.id === categoria.id) {
      this.categoriaSeleccionada.set(null);
      this.subcategorias.set([]);
    } else {
      this.categoriaSeleccionada.set(categoria);
      await this.cargarSubcategorias(categoria.id);
    }
  }

  abrirModalNuevaSubcategoria(categoria: Categoria) {
    this.categoriaSeleccionada.set(categoria);
    this.subcategoriaEditando.set(null);
    this.formSubcategoria.set({
      nombre: '',
      descripcion: '',
      icono: '',
      orden: this.subcategorias().length,
      activo: true
    });
    this.mostrarModalSubcategoria.set(true);
  }

  abrirModalEditarSubcategoria(subcategoria: Subcategoria) {
    this.subcategoriaEditando.set(subcategoria);
    this.formSubcategoria.set({
      nombre: subcategoria.nombre,
      descripcion: subcategoria.descripcion || '',
      icono: subcategoria.icono || '',
      orden: subcategoria.orden,
      activo: subcategoria.activo
    });
    this.mostrarModalSubcategoria.set(true);
  }

  cerrarModalSubcategoria() {
    this.mostrarModalSubcategoria.set(false);
    this.subcategoriaEditando.set(null);
  }

  async guardarSubcategoria() {
    const form = this.formSubcategoria();

    if (!form.nombre.trim()) {
      await this.modalService.warning('El nombre es obligatorio');
      return;
    }

    if (!this.categoriaSeleccionada()) {
      await this.modalService.error('No hay categoría seleccionada');
      return;
    }

    try {
      this.loading.set(true);
      const esEdicion = !!this.subcategoriaEditando();

      if (esEdicion) {
        await this.categoriasService.updateSubcategoria(this.subcategoriaEditando()!.id, form);
      } else {
        await this.categoriasService.createSubcategoria({
          ...form,
          categoria_id: this.categoriaSeleccionada()!.id
        });
      }

      await this.cargarSubcategorias(this.categoriaSeleccionada()!.id);
      this.loading.set(false);
      this.cerrarModalSubcategoria();

      // Mostrar éxito después de cerrar el modal
      const mensaje = esEdicion ? 'Subcategoría actualizada correctamente' : 'Subcategoría creada correctamente';
      await this.modalService.success(mensaje);
    } catch (err) {
      console.error('Error al guardar subcategoría:', err);
      this.loading.set(false);
      await this.modalService.error('Error al guardar la subcategoría');
    }
  }

  async eliminarSubcategoria(subcategoria: Subcategoria) {
    try {
      this.loading.set(true);

      // Verificar si tiene productos asignados
      const { tieneProductos, cantidad } = await this.categoriasService.subcategoriaTieneProductos(subcategoria.id);

      if (tieneProductos) {
        await this.modalService.alert(
          'No se puede eliminar',
          `La subcategoría "${subcategoria.nombre}" tiene ${cantidad} producto${cantidad > 1 ? 's' : ''} asignado${cantidad > 1 ? 's' : ''}. No se puede eliminar.`
        );
        return;
      }

      const confirmar = await this.modalService.confirm(
        '¿Eliminar subcategoría?',
        `Se eliminará permanentemente "${subcategoria.nombre}" de la base de datos.`
      );

      if (!confirmar) return;

      await this.categoriasService.deleteSubcategoriaHard(subcategoria.id);
      await this.modalService.success('Subcategoría eliminada permanentemente');

      if (this.categoriaSeleccionada()) {
        await this.cargarSubcategorias(this.categoriaSeleccionada()!.id);
      }
    } catch (err) {
      console.error('Error al eliminar subcategoría:', err);
      await this.modalService.error('Error al eliminar la subcategoría');
    } finally {
      this.loading.set(false);
    }
  }
}
