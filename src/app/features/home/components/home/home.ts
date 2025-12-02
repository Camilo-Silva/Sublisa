import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Catalogo } from '../../../tienda/components/catalogo/catalogo';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Catalogo],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  // Carrousel - Banners principales (se cargan desde BD)
  imagenes = signal<string[]>([]);
  imagenActual = signal(0);
  private intervalId?: number;
  loadingCarousel = signal(true);

  // Variables para drag/swipe
  private isDragging = false;
  private startX = 0;
  private currentX = 0;
  private readonly threshold = 50; // Píxeles mínimos para cambiar de slide

  // Categorías destacadas - Usar las imágenes proporcionadas
  categorias = [
    {
      nombre: 'PARA SUBLIMAR',
      imagen: '/images/parasublimar.png', // Reemplazar con la imagen real
      descripcion: 'Productos en blanco listos para personalizar',
      ruta: '/productos?categoria=Para Sublimar'
    },
    {
      nombre: 'SUBLIMADOS',
      imagen: '/images/sublimados.png', // Reemplazar con la imagen real
      descripcion: 'Productos ya personalizados y listos para usar',
      ruta: '/productos?categoria=Sublimado'
    },
    {
      nombre: 'DTF',
      imagen: '/images/dtf.png', // Reemplazar con la imagen real
      descripcion: 'Diseños de transferencia directa a tela',
      ruta: '/productos?categoria=DTF'
    }
    // {
    //   nombre: 'Otros',
    //   imagen: '/images/otros.png', // Reemplazar con la imagen real
    //   descripcion: 'Productos variados y especiales',
    //   ruta: '/productos?categoria=Otros'
    // }
  ];

  constructor(
    private readonly titleService: Title,
    private readonly configuracionService: ConfiguracionService
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Tienda Online de Sublisa');
    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cargar imágenes del carousel desde BD
    void this.cargarImagenesCarousel();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async cargarImagenesCarousel() {
    try {
      this.loadingCarousel.set(true);
      const imagenesDB = await this.configuracionService.getImagenesCarousel();
      const urls = imagenesDB.map((img: any) => img.url);
      this.imagenes.set(urls);

      // Precargar las imágenes del carousel
      this.precargarImagenes(urls);
    } catch (error) {
      console.error('Error al cargar imágenes del carousel:', error);
      // Fallback a imágenes por defecto si falla
      this.imagenes.set([
        '/images/1.png',
        '/images/2.png',
        '/images/3.png',
        '/images/4.png'
      ]);
    } finally {
      this.loadingCarousel.set(false);

      // Iniciar carousel solo si hay imágenes
      if (this.imagenes().length > 0) {
        this.iniciarCarrousel();
      }
    }
  }

  /**
   * Precarga imágenes en el navegador para cargarlas instantáneamente
   */
  private precargarImagenes(urls: string[]): void {
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  iniciarCarrousel() {
    this.intervalId = globalThis.setInterval(() => {
      this.siguiente();
    }, 5000); // Cambiar cada 5 segundos
  }

  siguiente() {
    const totalImagenes = this.imagenes().length;
    if (totalImagenes === 0) return;

    this.imagenActual.update(actual =>
      actual === totalImagenes - 1 ? 0 : actual + 1
    );
  }

  anterior() {
    const totalImagenes = this.imagenes().length;
    if (totalImagenes === 0) return;

    this.imagenActual.update(actual =>
      actual === 0 ? totalImagenes - 1 : actual - 1
    );
  }

  irAImagen(index: number) {
    this.imagenActual.set(index);
  }

  pausarCarrousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  reanudarCarrousel() {
    if (!this.intervalId && this.imagenes().length > 0) {
      this.iniciarCarrousel();
    }
  }

  // Métodos para arrastrar con mouse
  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.pausarCarrousel();
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.currentX = event.clientX;
  }

  onDragEnd() {
    if (!this.isDragging) return;

    const diff = this.startX - this.currentX;

    if (Math.abs(diff) > this.threshold) {
      if (diff > 0) {
        this.siguiente();
      } else {
        this.anterior();
      }
    }

    this.isDragging = false;
    this.reanudarCarrousel();
  }

  // Métodos para arrastrar con touch (móvil)
  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.pausarCarrousel();
  }

  onTouchMove(event: TouchEvent) {
    this.currentX = event.touches[0].clientX;
  }

  onTouchEnd() {
    const diff = this.startX - this.currentX;

    if (Math.abs(diff) > this.threshold) {
      if (diff > 0) {
        this.siguiente();
      } else {
        this.anterior();
      }
    }

    this.reanudarCarrousel();
  }
}
