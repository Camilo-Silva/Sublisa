import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../../core/services/productos.service';
import { CarritoService } from '../../../../core/services/carrito.service';
import { Producto } from '../../../../core/models';

@Component({
  selector: 'app-detalle-producto',
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit {
  producto = signal<Producto | null>(null);
  imagenSeleccionada = signal<string>('');
  loading = signal(true);
  error = signal<string | null>(null);
  cantidad = signal(1);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    public carritoService: CarritoService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarProducto(id);
      }
    });
  }

  async cargarProducto(id: string) {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.productosService.getProductoById(id);

      if (!data) {
        this.error.set('Producto no encontrado');
        return;
      }

      this.producto.set(data);

      // Establecer imagen principal
      const imagenPrincipal = data.imagenes?.find(img => img.es_principal);
      this.imagenSeleccionada.set(
        imagenPrincipal?.url || data.imagenes?.[0]?.url || 'https://via.placeholder.com/600x600?text=Sin+Imagen'
      );
    } catch (err) {
      console.error('Error al cargar producto:', err);
      this.error.set('Error al cargar el producto');
    } finally {
      this.loading.set(false);
    }
  }

  seleccionarImagen(url: string) {
    this.imagenSeleccionada.set(url);
  }

  aumentarCantidad() {
    const prod = this.producto();
    if (prod && this.cantidad() < prod.stock) {
      this.cantidad.update(c => c + 1);
    }
  }

  disminuirCantidad() {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  agregarAlCarrito() {
    const prod = this.producto();
    if (prod) {
      this.carritoService.agregarProducto(prod, this.cantidad());
      // Opcional: redirigir al carrito o mostrar notificación
      this.router.navigate(['/carrito']);
    }
  }

  get puedeAgregar(): boolean {
    const prod = this.producto();
    return prod !== null && prod.stock >= this.cantidad();
  }
}
