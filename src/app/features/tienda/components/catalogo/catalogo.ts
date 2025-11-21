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
  loading = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

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
    } catch (err) {
      console.error('Error al buscar productos:', err);
      this.error.set('Error al buscar productos.');
    } finally {
      this.loading.set(false);
    }
  }
}
