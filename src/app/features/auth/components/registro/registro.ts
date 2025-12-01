import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro implements OnInit {
  nombre = signal('');
  apellido = signal('');
  email = signal('');
  telefono = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

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
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  onCodigoAreaChange() {
    // Limpiar el número si excede los dígitos permitidos
    const maxDigits = this.digitosPermitidos;
    if (this.numeroTelefono().length > maxDigits) {
      this.numeroTelefono.set(this.numeroTelefono().slice(0, maxDigits));
    }
    this.actualizarTelefono();
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
    this.actualizarTelefono();
  }

  private actualizarTelefono() {
    if (this.numeroTelefono().length === this.digitosPermitidos) {
      this.telefono.set(this.telefonoCompleto);
    } else {
      this.telefono.set('');
    }
  }

  async onSubmit() {
    // Validaciones
    if (!this.nombre() || !this.apellido() || !this.email() || !this.password()) {
      this.error.set('Por favor complete todos los campos obligatorios, nombre, apellido, email y contraseña');
      return;
    }

    if (!this.telefono()) {
      this.error.set('Por favor complete el número de teléfono/WhatsApp');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.error.set('Por favor ingrese un email válido');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      await this.authService.register({
        nombre: this.nombre(),
        apellido: this.apellido(),
        email: this.email(),
        telefono: this.telefono(),
        password: this.password()
      });

      // El AuthService ya redirige a /mi-cuenta
    } catch (err: any) {
      console.error('Error en registro:', err);

      if (err.message.includes('User already registered')) {
        this.error.set('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (err.message.includes('Invalid email')) {
        this.error.set('El email ingresado no es válido');
      } else {
        this.error.set('Error al crear la cuenta. Por favor intenta nuevamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(v => !v);
  }
}
