import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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

  // Rutas de administración
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/admin/components/login/login').then(m => m.Login)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/components/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/admin/components/productos-list/productos-list').then(m => m.ProductosList),
        canActivate: [authGuard]
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./features/admin/components/producto-form/producto-form').then(m => m.ProductoForm),
        canActivate: [authGuard]
      },
      {
        path: 'productos/editar/:id',
        loadComponent: () => import('./features/admin/components/producto-form/producto-form').then(m => m.ProductoForm),
        canActivate: [authGuard]
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/admin/components/pedidos-list/pedidos-list').then(m => m.PedidosList),
        canActivate: [authGuard]
      },
      {
        path: 'pedidos/:id',
        loadComponent: () => import('./features/admin/components/pedido-detalle/pedido-detalle').then(m => m.PedidoDetalle),
        canActivate: [authGuard]
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
