import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ModalService } from '../../../../core/services/modal.service';
import { CategoriasService } from '../../../../core/services/categorias.service';

interface FormData {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  sku: string;
  categoria: string;
  subcategoria: string;
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
    } catch (err) {
      console.error('Error al cargar producto:', err);
      this.error.set('Error al cargar el producto');
    } finally {
      this.loading.set(false);
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

  async onSubmit() {
    const data = this.formData();

    // Validación
    if (!data.nombre.trim()) {
      await this.modalService.warning('El nombre es obligatorio');
      return;
    }

    if (data.precio < 0) {
      await this.modalService.warning('El precio debe ser mayor o igual a 0');
      return;
    }

    if (data.stock < 0) {
      await this.modalService.warning('El stock debe ser mayor o igual a 0');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      let productoId = this.productoId();

      if (this.isEditMode() && productoId) {
        // Actualizar producto existente
        await this.productosService.updateProducto(productoId, {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          precio: data.precio,
          stock: data.stock,
          sku: data.sku || undefined,
          categoria: data.categoria || undefined,
          subcategoria: data.subcategoria || undefined
        });
      } else {
        // Crear nuevo producto
        const nuevoProducto = await this.productosService.createProducto({
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio,
          stock: data.stock,
          sku: data.sku || undefined,
          categoria: data.categoria || undefined,
          subcategoria: data.subcategoria || undefined,
          activo: true
        });
        productoId = nuevoProducto.id;
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
    } catch (err) {
      console.error('Error al guardar producto:', err);
      this.error.set('Error al guardar el producto');
      await this.modalService.error('Error al guardar el producto');
    } finally {
      this.loading.set(false);
    }
  }
}
