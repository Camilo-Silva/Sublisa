import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'logout-confirm' | 'logout-success';
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface ModalState extends ModalConfig {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  modalState = signal<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  private showModal(config: ModalConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalState.set({
        ...config,
        isOpen: true,
        resolve
      });

      // Auto-cerrar si está configurado
      if (config.autoClose && config.autoCloseDelay) {
        setTimeout(() => {
          this.close(true);
        }, config.autoCloseDelay);
      }
    });
  }

  alert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<boolean> {
    return this.showModal({
      title,
      message,
      type,
      confirmText: 'Aceptar'
    });
  }

  confirm(title: string, message: string): Promise<boolean> {
    return this.showModal({
      title,
      message,
      type: 'confirm',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  }

  success(message: string): Promise<boolean> {
    return this.alert('Éxito', message, 'success');
  }

  error(message: string): Promise<boolean> {
    return this.alert('Error', message, 'error');
  }

  warning(message: string): Promise<boolean> {
    return this.alert('Advertencia', message, 'warning');
  }

  logoutConfirm(): Promise<boolean> {
    return this.showModal({
      title: '¿Cerrar sesión?',
      message: '¿Estás seguro que deseas cerrar tu sesión?',
      type: 'logout-confirm',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Cancelar'
    });
  }

  logoutSuccess(): Promise<boolean> {
    return this.showModal({
      title: 'Sesión cerrada exitosamente',
      message: 'Hasta pronto, te esperamos de vuelta',
      type: 'logout-success',
      autoClose: true,
      autoCloseDelay: 1500
    });
  }

  close(result: boolean = false) {
    const state = this.modalState();
    if (state.resolve) {
      state.resolve(result);
    }
    this.modalState.set({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  }
}
