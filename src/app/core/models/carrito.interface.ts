import { Producto } from './producto.interface';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
