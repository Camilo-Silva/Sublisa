import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ModalService } from '../../../../core/services/modal.service';
import { CategoriasService } from '../../../../core/services/categorias.service';
import { Talle, ProductoTalle } from '../../../../core/models';

interface FormData {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  sku: string;
  categoria: string;
  subcategoria: string;
}

interface TalleForm {
  talle_id: string;
  stock: number;
  precio: number | null;
}

@Component({
  selector: 'app-producto-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.scss',
})
export class ProductoForm implements OnInit {
  isEditMode = signal(false);
  productoId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  uploadingImages = signal(false);

  formData = signal<FormData>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    sku: '',
    categoria: '',
    subcategoria: ''
  });

  categorias = signal<string[]>([]);
  subcategoriasDisponibles = signal<string[]>([]);
  subcategoriasMap = signal<Map<string, string[]>>(new Map());

  imagenes = signal<{id: string, url: string, es_principal: boolean}[]>([]);
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);

  // Señales para talles
  tieneTalles = signal(false);
  tallesDisponibles = signal<Talle[]>([]);
  tallesProducto = signal<ProductoTalle[]>([]);
  editandoTalle = signal<string | null>(null);
  mostrarModalTalle = signal(false);

  // Signals individuales para el formulario (reactivos)
  talleCampos = {
    talle_id: signal(''),
    stock: signal(0),
    precio: signal<number | null>(null)
  };

  // Computed para verificar si puede agregar talle
  puedeAgregarTalle = computed(() => {
    return this.talleCampos.talle_id() !== '' && this.talleCampos.stock() >= 0;
  });

  // Computed para calcular stock total de todos los talles
  stockTotalTalles = computed(() => {
    return this.tallesProducto().reduce((total, pt) => total + pt.stock, 0);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    private readonly supabaseService: SupabaseService,
    private readonly modalService: ModalService,
    private readonly categoriasService: CategoriasService
  ) {}

  async ngOnInit() {
    window.scrollTo(0, 0);
    // Cargar categorías PRIMERO (para tener el mapa disponible)
    await this.cargarCategorias();

    // Cargar talles disponibles
    await this.cargarTalles();

    // Luego cargar el producto si es modo edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode.set(true);
        this.productoId.set(id);
        this.cargarProducto(id);
      }
    });
  }

  async cargarCategorias() {
    try {
      const categorias = await this.categoriasService.getCategoriasConSubcategorias();
      this.categorias.set(categorias.map(c => c.nombre));

      // Crear mapa de subcategorías
      const map = new Map<string, string[]>();
      for (const cat of categorias) {
        map.set(cat.nombre, cat.subcategorias.map(sub => sub.nombre));
      }
      this.subcategoriasMap.set(map);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  async cargarProducto(id: string) {
    try {
      this.loading.set(true);
      const producto = await this.productosService.getProductoById(id);

      if (!producto) {
        this.error.set('Producto no encontrado');
        return;
      }

      this.formData.set({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        stock: producto.stock,
        sku: producto.sku || '',
        categoria: producto.categoria || '',
        subcategoria: producto.subcategoria || ''
      });

      // Cargar subcategorías si hay categoría (sin resetear la subcategoría actual)
      if (producto.categoria) {
        const subcategorias = this.subcategoriasMap().get(producto.categoria) || [];
        this.subcategoriasDisponibles.set(subcategorias);
      }

      this.imagenes.set(producto.imagenes || []);

      // Cargar talles del producto si tiene
      if (producto.talles && producto.talles.length > 0) {
        this.tieneTalles.set(true);
        this.tallesProducto.set(producto.talles);
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      this.error.set('Error al cargar el producto');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarTalles() {
    try {
      const talles = await this.productosService.getTalles();
      this.tallesDisponibles.set(talles);
    } catch (err) {
      console.error('Error al cargar talles:', err);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.selectedFiles.set([...this.selectedFiles(), ...files]);

    // Crear previews
    const newPreviews: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          this.previewUrls.set([...this.previewUrls(), ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removePreview(index: number) {
    const files = this.selectedFiles();
    const previews = this.previewUrls();

    files.splice(index, 1);
    previews.splice(index, 1);

    this.selectedFiles.set([...files]);
    this.previewUrls.set([...previews]);
  }

  async removeExistingImage(imagenId: string, url: string) {
    const confirmar = await this.modalService.confirm(
      '¿Eliminar esta imagen?',
      'Esta acción no se puede deshacer'
    );
    if (!confirmar) return;

    try {
      await this.productosService.deleteImagenProducto(imagenId, url);
      this.imagenes.set(this.imagenes().filter(img => img.id !== imagenId));
      await this.modalService.success('Imagen eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      await this.modalService.error('Error al eliminar la imagen');
    }
  }

  async setImagenPrincipal(imagenId: string) {
    if (!this.productoId()) return;

    try {
      // Actualizar en base de datos (primero remover principal actual)
      const imagenes = this.imagenes();
      for (const img of imagenes) {
        await this.supabaseService.getClient()
          .from('imagenes_producto')
          .update({ es_principal: img.id === imagenId })
          .eq('id', img.id);
      }

      // Actualizar estado local
      this.imagenes.set(
        imagenes.map(img => ({
          ...img,
          es_principal: img.id === imagenId
        }))
      );

      await this.modalService.success('Imagen principal actualizada');
    } catch (err) {
      console.error('Error al cambiar imagen principal:', err);
      await this.modalService.error('Error al cambiar imagen principal');
    }
  }

  // Helper methods para normalizar valores numéricos
  updatePrecio(value: number | null) {
    this.formData.set({ ...this.formData(), precio: value || 0 });
  }

  updateStock(value: number | null) {
    this.formData.set({ ...this.formData(), stock: value || 0 });
  }

  onCategoriaChange(categoria: string) {
    const subcategorias = this.subcategoriasMap().get(categoria) || [];
    this.subcategoriasDisponibles.set(subcategorias);

    // Resetear subcategoría si cambió la categoría
    const currentData = this.formData();
    this.formData.set({
      ...currentData,
      categoria: categoria,
      subcategoria: ''
    });
  }

  // ============================================
  // MÉTODOS PARA GESTIÓN DE TALLES
  // ============================================

  async toggleTieneTalles() {
    const nuevoValor = !this.tieneTalles();

    // Si se desactiva talles y hay talles configurados, confirmar
    if (!nuevoValor && this.tallesProducto().length > 0) {
      const confirmar = await this.modalService.confirm(
        'Desactivar gestión de talles',
        'Se eliminarán todos los talles configurados y deberás ingresar el stock manualmente. ¿Continuar?'
      );
      if (!confirmar) return;

      // Si es producto existente, eliminar talles de BD
      const productoId = this.productoId();
      if (productoId) {
        try {
          for (const talle of this.tallesProducto()) {
            if (talle.producto_id) {
              await this.productosService.eliminarTalleProducto(talle.id);
            }
          }
        } catch (err) {
          console.error('Error al eliminar talles:', err);
          await this.modalService.error('Error al eliminar los talles');
          return;
        }
      }
    }

    this.tieneTalles.set(nuevoValor);

    // Si se desactiva talles, limpiar los talles del producto
    if (!nuevoValor) {
      this.tallesProducto.set([]);
      this.resetearFormularioTalle();
    }
  }

  getTalleNombre(talleId: string): string {
    const talle = this.tallesDisponibles().find(t => t.id === talleId);
    return talle ? `${talle.codigo} - ${talle.nombre}` : '';
  }

  talleYaAgregado(talleId: string): boolean {
    return this.tallesProducto().some(pt => pt.talle_id === talleId);
  }

  async agregarOActualizarTalle() {
    const talleId = this.talleCampos.talle_id();
    const stock = this.talleCampos.stock();
    const precio = this.talleCampos.precio();

    if (!talleId || stock < 0) return;

    // Confirmación solo para edición
    if (this.editandoTalle()) {
      const talle = this.tallesDisponibles().find(t => t.id === talleId);
      const confirmado = await this.modalService.confirm(
        'Confirmar Actualización',
        `¿Actualizar el talle ${talle?.codigo} con stock: ${stock}${precio ? ` y precio: $${precio}` : ''}?`
      );
      if (!confirmado) return;
    }

    const productoId = this.productoId();
    if (!productoId) {
      // Si es producto nuevo, agregar a la lista temporal
      const talle = this.tallesDisponibles().find(t => t.id === talleId);
      if (!talle) return;

      if (this.editandoTalle()) {
        // Actualizar en lista temporal
        this.tallesProducto.update(talles =>
          talles.map(pt =>
            pt.talle_id === this.editandoTalle()
              ? { ...pt, stock, precio: precio ?? undefined }
              : pt
          )
        );
      } else {
        // Agregar a lista temporal
        this.tallesProducto.update(talles => [
          ...talles,
          {
            id: crypto.randomUUID(), // Temporal
            producto_id: '',
            talle_id: talleId,
            talle,
            stock,
            precio: precio ?? undefined,
            activo: true
          }
        ]);
      }
    } else {
      // Producto existente, guardar en BD
      try {
        if (this.editandoTalle()) {
          // Actualizar talle existente
          const talleProducto = this.tallesProducto().find(
            pt => pt.talle_id === this.editandoTalle()
          );
          if (talleProducto) {
            await this.productosService.actualizarTalleProducto(
              talleProducto.id,
              stock,
              precio ?? undefined
            );

            // Actualizar en lista local
            this.tallesProducto.update(talles =>
              talles.map(pt =>
                pt.id === talleProducto.id
                  ? { ...pt, stock, precio: precio ?? undefined }
                  : pt
              )
            );
          }
        } else {
          // Agregar nuevo talle
          const nuevoTalle = await this.productosService.agregarTalleProducto(
            productoId,
            talleId,
            stock,
            precio ?? undefined
          );
          this.tallesProducto.update(talles => [...talles, nuevoTalle]);
        }

        // Actualizar stock del producto con la suma de todos los talles
        await this.actualizarStockProducto(productoId);

        await this.modalService.success(
          this.editandoTalle() ? 'Talle actualizado' : 'Talle agregado'
        );
      } catch (err) {
        console.error('Error al guardar talle:', err);
        await this.modalService.error('Error al guardar el talle');
        return;
      }
    }

    this.mostrarModalTalle.set(false);
    this.resetearFormularioTalle();
  }

  editarTalle(productoTalle: ProductoTalle) {
    this.editandoTalle.set(productoTalle.talle_id);
    this.talleCampos.talle_id.set(productoTalle.talle_id);
    this.talleCampos.stock.set(productoTalle.stock);
    this.talleCampos.precio.set(productoTalle.precio ?? null);
    this.mostrarModalTalle.set(true);
  }

  async eliminarTalle(productoTalle: ProductoTalle) {
    const confirmar = await this.modalService.confirm(
      '¿Eliminar este talle?',
      'Se eliminará el talle y su stock asociado'
    );
    if (!confirmar) return;

    const productoId = this.productoId();
    if (productoId && productoTalle.producto_id) {
      // Producto existente, eliminar de BD
      try {
        await this.productosService.eliminarTalleProducto(productoTalle.id);
        this.tallesProducto.update(talles =>
          talles.filter(pt => pt.id !== productoTalle.id)
        );

        // Actualizar stock del producto
        await this.actualizarStockProducto(productoId);

        await this.modalService.success('Talle eliminado');
      } catch (err) {
        console.error('Error al eliminar talle:', err);
        await this.modalService.error('Error al eliminar el talle');
      }
    } else {
      // Producto nuevo, eliminar de lista temporal
      this.tallesProducto.update(talles =>
        talles.filter(pt => pt.id !== productoTalle.id)
      );
    }
  }

  // Método auxiliar para actualizar el stock del producto
  private async actualizarStockProducto(productoId: string) {
    const stockTotal = this.stockTotalTalles();
    await this.productosService.updateProducto(productoId, {
      stock: stockTotal
    });
  }

  cancelarEdicionTalle() {
    this.mostrarModalTalle.set(false);
    this.resetearFormularioTalle();
  }

  resetearFormularioTalle() {
    this.talleCampos.talle_id.set('');
    this.talleCampos.stock.set(0);
    this.talleCampos.precio.set(null);
    this.editandoTalle.set(null);
  }

  getPrecioMostrado(productoTalle: ProductoTalle): string {
    if (productoTalle.precio !== null && productoTalle.precio !== undefined) {
      return `$${productoTalle.precio.toFixed(2)}`;
    }
    return `$${this.formData().precio.toFixed(2)} (base)`;
  }

  async onSubmit() {
    const data = this.formData();

    // Normalizar valores vacíos o null a 0
    const precioNormalizado = data.precio || 0;
    const stockNormalizado = data.stock || 0;

    // Validación del nombre
    if (!data.nombre.trim()) {
      await this.modalService.warning('El nombre del producto es obligatorio');
      return;
    }

    // Validar que precio no sea negativo
    if (precioNormalizado < 0) {
      await this.modalService.warning('El precio no puede ser negativo');
      return;
    }

    // Si tiene talles, validar que haya al menos uno
    if (this.tieneTalles()) {
      if (this.tallesProducto().length === 0) {
        await this.modalService.warning('Debes agregar al menos un talle con stock y precio');
        return;
      }
    } else {
      // Si no tiene talles, validar stock normal
      if (stockNormalizado < 0) {
        await this.modalService.warning('El stock no puede ser negativo');
        return;
      }
    }

    // Actualizar formData con valores normalizados
    this.formData.update(fd => ({
      ...fd,
      precio: precioNormalizado,
      stock: stockNormalizado
    }));

    try {
      this.loading.set(true);
      this.error.set(null);

      let productoId = this.productoId();

      // Obtener datos actualizados con valores normalizados
      const dataNormalizada = this.formData();

      // Calcular stock: si tiene talles, sumar todos; sino usar el del formulario
      const stockFinal = this.tieneTalles() ? this.stockTotalTalles() : dataNormalizada.stock;

      if (this.isEditMode() && productoId) {
        // Actualizar producto existente
        await this.productosService.updateProducto(productoId, {
          nombre: dataNormalizada.nombre,
          descripcion: dataNormalizada.descripcion || undefined,
          precio: dataNormalizada.precio,
          stock: stockFinal,
          sku: dataNormalizada.sku || undefined,
          categoria: dataNormalizada.categoria || undefined,
          subcategoria: dataNormalizada.subcategoria || undefined
        });
      } else {
        // Crear nuevo producto
        const nuevoProducto = await this.productosService.createProducto({
          nombre: dataNormalizada.nombre,
          descripcion: dataNormalizada.descripcion,
          precio: dataNormalizada.precio,
          stock: stockFinal,
          sku: dataNormalizada.sku || undefined,
          categoria: dataNormalizada.categoria || undefined,
          subcategoria: dataNormalizada.subcategoria || undefined,
          activo: true
        });
        productoId = nuevoProducto.id;
      }

      // Guardar talles si es producto nuevo y tiene talles temporales
      if (!this.isEditMode() && this.tieneTalles() && this.tallesProducto().length > 0 && productoId) {
        for (const talleTemp of this.tallesProducto()) {
          await this.productosService.agregarTalleProducto(
            productoId,
            talleTemp.talle_id,
            talleTemp.stock,
            talleTemp.precio
          );
        }
      }

      // Subir imágenes nuevas
      if (this.selectedFiles().length > 0 && productoId) {
        this.uploadingImages.set(true);
        const files = this.selectedFiles();
        const esPrimerImagen = this.imagenes().length === 0;

        for (let i = 0; i < files.length; i++) {
          await this.productosService.uploadImagenProducto(
            productoId,
            files[i],
            i,
            i === 0 && esPrimerImagen
          );
        }
        this.uploadingImages.set(false);
      }

      await this.modalService.success(
        `Producto ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`
      );
      this.router.navigate(['/admin/productos']);
    } catch (err: any) {
      console.error('Error al guardar producto:', err);

      // Detectar error de SKU duplicado
      if (err?.message === 'SKU_DUPLICADO') {
        const sku = data.sku || 'sin SKU';
        this.error.set(`El SKU "${sku}" ya existe en otro producto`);
        await this.modalService.error(
          `El SKU "${sku}" ya está registrado en otro producto. Por favor, utiliza un SKU diferente o déjalo vacío.`
        );
      } else {
        this.error.set('Error al guardar el producto');
        await this.modalService.error('Error al guardar el producto');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
