import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Catalogo } from '../../../tienda/components/catalogo/catalogo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Catalogo],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  // Carrousel - Banners principales
  imagenes = [
    '/images/1.png',
    '/images/2.png',
    '/images/3.png',
    '/images/4.png'
  ];

  imagenActual = signal(0);
  private intervalId?: number;

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
  ];

  constructor(private readonly titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle('Tienda Online de Sublisa');
    this.iniciarCarrousel();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  iniciarCarrousel() {
    this.intervalId = window.setInterval(() => {
      this.siguiente();
    }, 5000); // Cambiar cada 5 segundos
  }

  siguiente() {
    this.imagenActual.update(actual =>
      actual === this.imagenes.length - 1 ? 0 : actual + 1
    );
  }

  anterior() {
    this.imagenActual.update(actual =>
      actual === 0 ? this.imagenes.length - 1 : actual - 1
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
    if (!this.intervalId) {
      this.iniciarCarrousel();
    }
  }
}
