import { Producto } from './producto.interface';

export interface Pedido {
  id?: string;
  numero_pedido?: string;
  cliente_id: string;
  estado: EstadoPedido;
  subtotal: number;
  total: number;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  cliente?: Cliente;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talle_id?: string;
  talle_codigo?: string;
  producto?: Producto;
}

export interface Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  email?: string;
}

export type EstadoPedido =
  | 'PENDIENTE_CONTACTO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_ENTREGA'
  | 'ENTREGADO'
  | 'CANCELADO';
