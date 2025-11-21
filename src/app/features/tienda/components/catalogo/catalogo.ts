import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../../../core/services/productos.service';
import { Producto } from '../../../../core/models';
import { ProductoCard } from '../producto-card/producto-card';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  categoriaSeleccionada = signal<string>('TODAS');
  categorias = signal<string[]>(['TODAS']);

  constructor(private readonly productosService: ProductosService) {}

  ngOnInit() {
    this.cargarProductos();
  }

  async cargarProductos() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.productosService.getProductos();
      this.productos.set(data);
      this.productosFiltrados.set(data);
      
      // Extraer categorías únicas
      const categoriasUnicas = ['TODAS', ...new Set(data.map(p => p.categoria).filter(Boolean))];
      this.categorias.set(categoriasUnicas as string[]);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      this.error.set('Error al cargar los productos. Por favor, intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async buscarProductos(event: Event) {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    this.busqueda.set(query);

    if (query.length === 0) {
      await this.cargarProductos();
      return;
    }

    try {
      this.loading.set(true);
      const data = await this.productosService.searchProductos(query);
      this.productos.set(data);
      this.aplicarFiltros();
    } catch (err) {
      console.error('Error al buscar productos:', err);
      this.error.set('Error al buscar productos.');
    } finally {
      this.loading.set(false);
    }
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    let filtrados = [...this.productos()];

    // Filtrar por categoría
    if (this.categoriaSeleccionada() !== 'TODAS') {
      filtrados = filtrados.filter(p => p.categoria === this.categoriaSeleccionada());
    }

    this.productosFiltrados.set(filtrados);
  }
}
