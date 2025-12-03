import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ProductosService } from '../../../../core/services/productos.service';
import { CarritoService } from '../../../../core/services/carrito.service';
import { Producto, ProductoTalle } from '../../../../core/models';
import { Breadcrumbs, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-detalle-producto',
  imports: [CommonModule, RouterLink, Breadcrumbs],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit, OnDestroy {
  producto = signal<Producto | null>(null);
  imagenSeleccionada = signal<string>('');
  loading = signal(true);
  error = signal<string | null>(null);
  cantidad = signal(1);
  lightboxAbierto = signal(false);
  indiceImagenActual = signal(0);
  agregando = signal(false);

  // Signals para talles
  talleSeleccionado = signal<ProductoTalle | null>(null);

  // Computed para obtener stock disponible según talle
  stockDisponible = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;

    const talle = this.talleSeleccionado();
    if (talle) {
      return talle.stock;
    }

    return prod.stock;
  });

  // Computed para obtener precio según talle
  precioActual = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;

    const talle = this.talleSeleccionado();
    if (talle && talle.precio !== undefined && talle.precio !== null) {
      return talle.precio;
    }

    return prod.precio;
  });

  // Computed para obtener cantidad ya en el carrito
  cantidadEnCarrito = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;

    const talle = this.talleSeleccionado();

    // Forzar suscripción al signal de items del carrito
    const items = this.carritoService.items();

    // Buscar la cantidad en el carrito
    if (talle?.id) {
      // IMPORTANTE: En el carrito guardamos talle.talle (objeto Talle), no talle (ProductoTalle)
      // Por eso debemos comparar contra talle.talle.id
      const talleIdABuscar = talle.talle?.id;
      const item = items.find(item =>
        item.producto.id === prod.id && item.talle?.id === talleIdABuscar
      );



      return item?.cantidad || 0;
    } else {
      const item = items.find(item =>
        item.producto.id === prod.id && !item.talle
      );



      return item?.cantidad || 0;
    }
  });

  // Computed para obtener stock restante (stock disponible - cantidad en carrito)
  stockRestante = computed(() => {
    const stock = this.stockDisponible();
    const enCarrito = this.cantidadEnCarrito();
    const restante = Math.max(0, stock - enCarrito);



    return restante;
  });

  // Computed para verificar si el producto tiene talles
  tieneTalles = computed(() => {
    const prod = this.producto();
    return prod?.talles && prod.talles.length > 0;
  });

  // Breadcrumbs dinámicos
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Inicio', url: '/' }
    ];

    const prod = this.producto();
    if (prod) {
      if (prod.categoria) {
        items.push({
          label: prod.categoria,
          url: '/productos',
          queryParams: { categoria: prod.categoria }
        });

        if (prod.subcategoria) {
          items.push({
            label: prod.subcategoria,
            url: '/productos',
            queryParams: { categoria: prod.categoria, subcategoria: prod.subcategoria }
          });
        }
      }

      items.push({
        label: prod.nombre
      });
    } else {
      items.push({
        label: 'Producto'
      });
    }

    return items;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productosService: ProductosService,
    public carritoService: CarritoService,
    private readonly titleService: Title
  ) {}

  ngOnInit() {
    // Scroll al inicio cuando se carga el componente
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarProducto(id);
      }
    });
  }

  ngOnDestroy() {
    // Restaurar título original al salir
    this.titleService.setTitle('Tienda Online de Sublisa');
  }

  async cargarProducto(id: string) {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.productosService.getProductoById(id);

      if (!data) {
        this.error.set('Producto no encontrado');
        this.titleService.setTitle('Producto no encontrado | Sublisa');
        return;
      }

      // Actualizar título de la página
      this.titleService.setTitle(`${data.nombre} | Sublisa`);

      this.producto.set(data);

      // Si tiene talles, seleccionar el primero por defecto
      if (data.talles && data.talles.length > 0) {
        this.talleSeleccionado.set(data.talles[0]);
      }

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

  seleccionarTalle(talle: ProductoTalle) {
    this.talleSeleccionado.set(talle);

    // Esperar a que los computed se actualicen
    setTimeout(() => {
      // Resetear cantidad a 1 si hay stock restante, o 0 si no hay
      const stockRestanteNuevoTalle = this.stockRestante();
      this.cantidad.set(stockRestanteNuevoTalle > 0 ? 1 : 0);
    }, 0);
  }

  onTalleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const talleId = select.value;
    const prod = this.producto();

    if (prod?.talles) {
      const talle = prod.talles.find(t => t.id === talleId);
      if (talle) {
        this.seleccionarTalle(talle);
      }
    }
  }

  aumentarCantidad() {
    const stockMax = this.stockRestante();
    const cantidadActual = this.cantidad();
    // Solo aumentar si hay stock restante Y la cantidad actual es menor
    if (stockMax > 0 && cantidadActual < stockMax) {
      this.cantidad.update(c => c + 1);
    }
  }

  disminuirCantidad() {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  async agregarAlCarrito() {
    const prod = this.producto();
    if (!prod) return;

    // Si tiene talles, validar que haya uno seleccionado
    if (this.tieneTalles() && !this.talleSeleccionado()) {
      alert('Por favor selecciona un talle');
      return;
    }

    this.agregando.set(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const talle = this.talleSeleccionado();
    const precio = this.precioActual();
    const talleStock = talle?.stock;

    this.carritoService.agregarProducto(
      prod,
      this.cantidad(),
      talle?.talle,
      precio,
      talleStock
    );

    // Esperar un momento para que el signal se actualice
    await new Promise(resolve => setTimeout(resolve, 50));

    // Resetear cantidad: si hay stock restante, poner 1, si no hay, poner 0
    const nuevoStockRestante = this.stockRestante();
    this.cantidad.set(nuevoStockRestante > 0 ? 1 : 0);

    await new Promise(resolve => setTimeout(resolve, 150));
    this.agregando.set(false);
    this.carritoService.abrirCarrito();
  }

  get puedeAgregar(): boolean {
    const prod = this.producto();
    if (!prod) return false;

    // Si tiene talles, debe haber uno seleccionado
    if (this.tieneTalles() && !this.talleSeleccionado()) {
      return false;
    }

    // Validar que haya stock restante Y que la cantidad sea válida
    const stockRestanteValue = this.stockRestante();
    const cantidadValue = this.cantidad();
    return stockRestanteValue > 0 && cantidadValue > 0 && cantidadValue <= stockRestanteValue;
  }

  // Métodos del Lightbox
  abrirLightbox() {
    const prod = this.producto();
    if (prod?.imagenes) {
      this.indiceImagenActual.set(
        prod.imagenes.findIndex(img => img.url === this.imagenSeleccionada())
      );
    }
    this.lightboxAbierto.set(true);
    document.body.style.overflow = 'hidden'; // Bloquear scroll
  }

  cerrarLightbox() {
    this.lightboxAbierto.set(false);
    document.body.style.overflow = 'auto'; // Restaurar scroll
  }

  imagenAnterior() {
    const prod = this.producto();
    if (!prod?.imagenes) return;

    let nuevoIndice = this.indiceImagenActual() - 1;
    if (nuevoIndice < 0) {
      nuevoIndice = prod.imagenes.length - 1;
    }

    this.indiceImagenActual.set(nuevoIndice);
    this.imagenSeleccionada.set(prod.imagenes[nuevoIndice].url);
  }

  imagenSiguiente() {
    const prod = this.producto();
    if (!prod?.imagenes) return;

    let nuevoIndice = this.indiceImagenActual() + 1;
    if (nuevoIndice >= prod.imagenes.length) {
      nuevoIndice = 0;
    }

    this.indiceImagenActual.set(nuevoIndice);
    this.imagenSeleccionada.set(prod.imagenes[nuevoIndice].url);
  }
}
