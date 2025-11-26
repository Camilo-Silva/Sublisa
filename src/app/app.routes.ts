import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Rutas públicas (Tienda)
  {
    path: '',
    loadComponent: () => import('./features/tienda/components/catalogo/catalogo').then(m => m.Catalogo)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./features/tienda/components/detalle-producto/detalle-producto').then(m => m.DetalleProducto)
  },
  {
    path: 'carrito',
    loadComponent: () => import('./features/tienda/components/carrito/carrito').then(m => m.Carrito)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/tienda/components/checkout/checkout').then(m => m.Checkout)
  },
  {
    path: 'confirmacion',
    loadComponent: () => import('./features/tienda/components/confirmacion/confirmacion').then(m => m.Confirmacion)
  },

  // Rutas de autenticación
  {
    path: 'login',
    loadComponent: () => import('./features/admin/components/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/components/registro/registro').then(m => m.Registro)
  },
  {
    path: 'mi-cuenta',
    loadComponent: () => import('./features/auth/components/mi-cuenta/mi-cuenta').then(m => m.MiCuenta),
    canActivate: [authGuard]
  },

  // Rutas de administración (protegidas con adminGuard)
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/components/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [adminGuard]
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/admin/components/productos-list/productos-list').then(m => m.ProductosList),
        canActivate: [adminGuard]
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./features/admin/components/producto-form/producto-form').then(m => m.ProductoForm),
        canActivate: [adminGuard]
      },
      {
        path: 'productos/editar/:id',
        loadComponent: () => import('./features/admin/components/producto-form/producto-form').then(m => m.ProductoForm),
        canActivate: [adminGuard]
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/admin/components/pedidos-list/pedidos-list').then(m => m.PedidosList),
        canActivate: [adminGuard]
      },
      {
        path: 'pedidos/:id',
        loadComponent: () => import('./features/admin/components/pedido-detalle/pedido-detalle').then(m => m.PedidoDetalle),
        canActivate: [adminGuard]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Ruta 404
  {
    path: '**',
    redirectTo: ''
  }
];
