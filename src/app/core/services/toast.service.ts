import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  productName: string;
  productImage: string;
  cantidad: number;
  precio: number;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);

  toasts = this.toastsSignal.asReadonly();

  showProductAdded(productName: string, productImage: string, cantidad: number, precio: number) {
    const toast: Toast = {
      id: Date.now().toString(),
      message: '¡Agregado al carrito!',
      productName,
      productImage,
      cantidad,
      precio,
      type: 'success'
    };

    const currentToasts = this.toastsSignal();
    this.toastsSignal.set([...currentToasts, toast]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      this.remove(toast.id);
    }, 5000);
  }

  remove(id: string) {
    const currentToasts = this.toastsSignal();
    this.toastsSignal.set(currentToasts.filter(t => t.id !== id));
  }
}
