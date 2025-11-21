import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface FormData {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  sku: string;
  categoria: string;
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
    categoria: ''
  });

  imagenes = signal<{id: string, url: string, es_principal: boolean}[]>([]);
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    private readonly supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode.set(true);
        this.productoId.set(id);
        this.cargarProducto(id);
      }
    });
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
        categoria: producto.categoria || ''
      });

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
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      await this.productosService.deleteImagenProducto(imagenId, url);
      this.imagenes.set(this.imagenes().filter(img => img.id !== imagenId));
      alert('✅ Imagen eliminada');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      alert('❌ Error al eliminar la imagen');
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

      alert('✅ Imagen principal actualizada');
    } catch (err) {
      console.error('Error al cambiar imagen principal:', err);
      alert('❌ Error al cambiar imagen principal');
    }
  }

  async onSubmit() {
    const data = this.formData();

    // Validación
    if (!data.nombre.trim()) {
      alert('❌ El nombre es obligatorio');
      return;
    }

    if (data.precio < 0) {
      alert('❌ El precio debe ser mayor o igual a 0');
      return;
    }

    if (data.stock < 0) {
      alert('❌ El stock debe ser mayor o igual a 0');
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
          categoria: data.categoria || undefined
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

      alert(`✅ Producto ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`);
      this.router.navigate(['/admin/productos']);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      this.error.set('Error al guardar el producto');
      alert('❌ Error al guardar el producto');
    } finally {
      this.loading.set(false);
    }
  }
}
