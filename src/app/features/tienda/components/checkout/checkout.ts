import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CarritoService } from '../../../../core/services/carrito.service';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Cliente, UserProfile } from '../../../../core/models';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
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

  // Sistema de teléfono con código de área
  codigoArea = signal('11');
  numeroTelefono = signal('');

  // Códigos de área de Argentina con longitud de número local
  codigosArea = [
    { codigo: '11', nombre: 'Buenos Aires (CABA y GBA)', digitos: 8 },
    { codigo: '220', nombre: 'San Pedro, Baradero, Ramallo', digitos: 7 },
    { codigo: '221', nombre: 'La Plata', digitos: 7 },
    { codigo: '223', nombre: 'Mar del Plata', digitos: 7 },
    { codigo: '230', nombre: 'Campana, Escobar, Pilar', digitos: 7 },
    { codigo: '236', nombre: 'Junín, Chacabuco', digitos: 7 },
    { codigo: '237', nombre: 'Pehuajó', digitos: 7 },
    { codigo: '249', nombre: 'Tandil', digitos: 7 },
    { codigo: '260', nombre: 'San Luis', digitos: 7 },
    { codigo: '261', nombre: 'Mendoza', digitos: 7 },
    { codigo: '263', nombre: 'San Rafael', digitos: 7 },
    { codigo: '264', nombre: 'San Juan', digitos: 7 },
    { codigo: '266', nombre: 'San Luis (Villa Mercedes)', digitos: 7 },
    { codigo: '280', nombre: 'Viedma, Carmen de Patagones', digitos: 7 },
    { codigo: '291', nombre: 'Bahía Blanca', digitos: 7 },
    { codigo: '294', nombre: 'Río Gallegos', digitos: 7 },
    { codigo: '297', nombre: 'Comodoro Rivadavia', digitos: 7 },
    { codigo: '299', nombre: 'Neuquén', digitos: 7 },
    { codigo: '341', nombre: 'Rosario', digitos: 7 },
    { codigo: '342', nombre: 'Santa Fe', digitos: 7 },
    { codigo: '343', nombre: 'Paraná', digitos: 7 },
    { codigo: '351', nombre: 'Córdoba', digitos: 7 },
    { codigo: '358', nombre: 'Río Cuarto', digitos: 7 },
    { codigo: '370', nombre: 'Formosa', digitos: 7 },
    { codigo: '376', nombre: 'Oberá', digitos: 7 },
    { codigo: '379', nombre: 'Corrientes', digitos: 7 },
    { codigo: '380', nombre: 'La Rioja', digitos: 7 },
    { codigo: '381', nombre: 'San Miguel de Tucumán', digitos: 7 },
    { codigo: '383', nombre: 'Catamarca', digitos: 7 },
    { codigo: '385', nombre: 'Santiago del Estero', digitos: 7 },
    { codigo: '387', nombre: 'Salta', digitos: 7 },
    { codigo: '388', nombre: 'Jujuy', digitos: 7 },
    { codigo: '2202', nombre: 'San Nicolás', digitos: 6 },
    { codigo: '2241', nombre: 'Azul', digitos: 6 },
    { codigo: '2243', nombre: 'Necochea', digitos: 6 },
    { codigo: '2254', nombre: 'Carmen de Areco', digitos: 6 },
    { codigo: '2257', nombre: 'Chivilcoy', digitos: 6 },
    { codigo: '2262', nombre: 'Chascomús', digitos: 6 },
    { codigo: '2266', nombre: 'Dolores', digitos: 6 },
    { codigo: '2267', nombre: 'Las Flores', digitos: 6 },
    { codigo: '2271', nombre: 'Ayacucho', digitos: 6 },
    { codigo: '2281', nombre: 'Tres Arroyos', digitos: 6 },
    { codigo: '2284', nombre: 'Olavarría', digitos: 6 },
    { codigo: '2286', nombre: 'Balcarce', digitos: 6 },
    { codigo: '2296', nombre: 'Mercedes (Buenos Aires)', digitos: 6 },
    { codigo: '2297', nombre: 'Luján', digitos: 6 },
    { codigo: '2314', nombre: 'Pergamino', digitos: 6 },
    { codigo: '2323', nombre: 'Lincoln', digitos: 6 },
    { codigo: '2324', nombre: 'Bragado', digitos: 6 },
    { codigo: '2325', nombre: 'Nueve de Julio', digitos: 6 },
    { codigo: '2331', nombre: 'Trenque Lauquen', digitos: 6 },
    { codigo: '2333', nombre: 'General Villegas', digitos: 6 },
    { codigo: '2336', nombre: 'Bolívar', digitos: 6 },
    { codigo: '2337', nombre: 'Daireaux', digitos: 6 },
    { codigo: '2338', nombre: 'Henderson', digitos: 6 },
    { codigo: '2342', nombre: 'Venado Tuerto', digitos: 6 },
    { codigo: '2352', nombre: 'Rafaela', digitos: 6 },
    { codigo: '2354', nombre: 'Reconquista', digitos: 6 },
    { codigo: '2357', nombre: 'San Cristóbal', digitos: 6 },
    { codigo: '2395', nombre: 'Concepción del Uruguay', digitos: 6 },
    { codigo: '2396', nombre: 'Gualeguaychú', digitos: 6 },
    { codigo: '2464', nombre: 'Mercedes (Corrientes)', digitos: 6 },
    { codigo: '2474', nombre: 'Goya', digitos: 6 },
    { codigo: '2477', nombre: 'Curuzú Cuatiá', digitos: 6 },
    { codigo: '2652', nombre: 'Villa María', digitos: 6 },
    { codigo: '2901', nombre: 'Ushuaia', digitos: 6 },
    { codigo: '2902', nombre: 'Río Grande', digitos: 6 },
    { codigo: '2920', nombre: 'San Carlos de Bariloche', digitos: 6 },
    { codigo: '2944', nombre: 'Puerto Madryn', digitos: 6 },
    { codigo: '2945', nombre: 'Trelew', digitos: 6 },
    { codigo: '2952', nombre: 'Caleta Olivia', digitos: 6 },
    { codigo: '2962', nombre: 'Río Turbio', digitos: 6 },
    { codigo: '2964', nombre: 'El Calafate', digitos: 6 },
    { codigo: '2966', nombre: 'Pico Truncado', digitos: 6 },
    { codigo: '3382', nombre: 'Termas de Río Hondo', digitos: 6 },
    { codigo: '3435', nombre: 'Ceres', digitos: 6 },
    { codigo: '3446', nombre: 'Gálvez', digitos: 6 },
    { codigo: '3454', nombre: 'Villa Ocampo', digitos: 6 },
    { codigo: '3456', nombre: 'Vera', digitos: 6 },
    { codigo: '3543', nombre: 'San Francisco', digitos: 6 },
    { codigo: '3571', nombre: 'Bell Ville', digitos: 6 },
    { codigo: '3731', nombre: 'Santo Tomé', digitos: 6 },
    { codigo: '3755', nombre: 'Apóstoles', digitos: 6 },
    { codigo: '3772', nombre: 'Paso de los Libres', digitos: 6 },
    { codigo: '3774', nombre: 'Esquina', digitos: 6 },
    { codigo: '3777', nombre: 'Monte Caseros', digitos: 6 }
  ];

  get digitosPermitidos(): number {
    const area = this.codigosArea.find(a => a.codigo === this.codigoArea());
    return area?.digitos || 8;
  }

  get telefonoCompleto(): string {
    if (!this.numeroTelefono()) return '';
    return `+549${this.codigoArea()}${this.numeroTelefono()}`;
  }

  constructor(
    public carritoService: CarritoService,
    private readonly pedidosService: PedidosService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly titleService: Title
  ) {}

  abrirCarrito() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.carritoService.abrirCarrito();
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.titleService.setTitle('Finalizar Compra | Sublisa');

    // Redirigir si el carrito está vacío
    if (this.carritoService.items().length === 0) {
      void this.router.navigate(['/']);
    }

    // Autocompletar datos si el usuario está autenticado
    this.cargarDatosUsuario();
  }

  /**
   * Carga los datos del usuario autenticado en el formulario
   */
  private cargarDatosUsuario() {
    const user = this.authService.getCurrentUser();
    const profile = this.authService.getUserProfile();

    if (user && profile) {
      // Autocompletar nombre completo
      const nombreCompleto = `${profile.nombre} ${profile.apellido}`.trim();
      if (nombreCompleto) {
        this.cliente.nombre = nombreCompleto;
      }

      // Autocompletar teléfono
      if (profile.telefono) {
        this.parsearYAutocompletarTelefono(profile.telefono);
      }

      // Autocompletar email
      if (user.email) {
        this.cliente.email = user.email;
      }

      console.log('✅ Datos de usuario autocompletos:', this.cliente);
    }
  }

  private parsearYAutocompletarTelefono(telefono: string) {
    // Formato esperado: +549{codigo_area}{numero}
    // Ejemplo: +5491138824544 (11 = código, 38824544 = número)

    if (!telefono.startsWith('+549')) {
      console.warn('Formato de teléfono no reconocido:', telefono);
      return;
    }

    // Remover el prefijo +549
    const sinPrefijo = telefono.substring(4);

    // Intentar encontrar el código de área
    for (const area of this.codigosArea) {
      if (sinPrefijo.startsWith(area.codigo)) {
        const numero = sinPrefijo.substring(area.codigo.length);

        // Verificar que el número tenga la longitud correcta
        if (numero.length === area.digitos) {
          this.codigoArea.set(area.codigo);
          this.numeroTelefono.set(numero);
          this.cliente.telefono = telefono;
          console.log('✅ Teléfono parseado:', { codigo: area.codigo, numero });
          return;
        }
      }
    }

    console.warn('No se pudo parsear el teléfono:', telefono);
  }

  onCodigoAreaChange() {
    // Limpiar el número si excede los dígitos permitidos
    const maxDigits = this.digitosPermitidos;
    if (this.numeroTelefono().length > maxDigits) {
      this.numeroTelefono.set(this.numeroTelefono().slice(0, maxDigits));
    }
    this.actualizarTelefonoCliente();
  }

  onNumeroChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); // Solo dígitos

    // Limitar a la cantidad de dígitos permitidos
    if (valor.length > this.digitosPermitidos) {
      valor = valor.slice(0, this.digitosPermitidos);
    }

    this.numeroTelefono.set(valor);
    input.value = valor;
    this.actualizarTelefonoCliente();
  }

  private actualizarTelefonoCliente() {
    if (this.numeroTelefono().length === this.digitosPermitidos) {
      this.cliente.telefono = this.telefonoCompleto;
    } else {
      this.cliente.telefono = '';
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
