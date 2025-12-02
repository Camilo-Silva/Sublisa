import { Producto, Talle } from './producto.interface';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
  talle?: Talle; // Talle seleccionado (si aplica)
  talle_stock?: number; // Stock disponible del talle específico
  precio_unitario?: number; // Precio específico del talle (si tiene precio diferenciado)
}
