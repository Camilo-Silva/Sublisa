import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../core/services/carrito.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Cliente } from '../../../../core/models';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  cliente: Omit<Cliente, 'id'> = {
    nombre: '',
    telefono: '',
    email: ''
  };

  notas = '';
  procesando = false;
  error: string | null = null;

  constructor(
    public carritoService: CarritoService,
    private readonly pedidosService: PedidosService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    // Redirigir si el carrito está vacío
    if (this.carritoService.items().length === 0) {
      void this.router.navigate(['/']);
    }
  }

  async finalizarPedido() {
    if (!this.validarFormulario()) {
      return;
    }

    try {
      this.procesando = true;
      this.error = null;

      // Crear el pedido
      const pedido = await this.pedidosService.crearPedido(
        this.cliente,
        this.carritoService.items(),
        this.notas || undefined
      );

      // Limpiar el carrito
      this.carritoService.vaciarCarrito();

      // Redirigir a confirmación
      this.router.navigate(['/confirmacion'], {
        state: { pedido }
      });
    } catch (err) {
      console.error('Error al crear pedido:', err);
      this.error = 'Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.';
    } finally {
      this.procesando = false;
    }
  }

  private validarFormulario(): boolean {
    if (!this.cliente.nombre.trim()) {
      this.error = 'Por favor, ingresa tu nombre.';
      return false;
    }

    if (!this.cliente.telefono.trim()) {
      this.error = 'Por favor, ingresa tu número de teléfono/WhatsApp.';
      return false;
    }

    // Limpiar el teléfono (remover espacios, guiones, paréntesis)
    const telefonoLimpio = this.cliente.telefono.replaceAll(/[\s\-()]/g, '');

    // Validar formato argentino: +54 seguido de 10-11 dígitos (9 + código de área + número)
    // Formato esperado: +5491138824544 (Buenos Aires) o +543512345678 (Córdoba)
    const telefonoRegex = /^\+54\d{10,11}$/;

    if (!telefonoRegex.test(telefonoLimpio)) {
      this.error = '📱 Formato de teléfono inválido. Debe ser: +5491138824544 (con + y sin espacios)';
      return false;
    }

    // Guardar el teléfono limpio
    this.cliente.telefono = telefonoLimpio;

    // Validación opcional de email
    if (this.cliente.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.cliente.email)) {
        this.error = 'Por favor, ingresa un email válido.';
        return false;
      }
    }

    return true;
  }
}
