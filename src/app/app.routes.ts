import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/order-detail.component').then(m => m.OrderDetailComponent),
  },
  {
    path: 'loads',
    loadComponent: () =>
      import('./features/loads/loads-list.component').then(m => m.LoadsListComponent),
  },
  {
    path: 'loads/:id',
    loadComponent: () =>
      import('./features/loads/load-detail.component').then(m => m.LoadDetailComponent),
  },
  {
    path: 'dispatch',
    loadComponent: () =>
      import('./features/dispatch/dispatch-wizard.component').then(m => m.DispatchWizardComponent),
  },
  {
    path: 'fleet',
    loadComponent: () =>
      import('./features/fleet/fleet-list.component').then(m => m.FleetListComponent),
  },
  {
    path: 'fleet/:id',
    loadComponent: () =>
      import('./features/fleet/vehicle-detail.component').then(m => m.VehicleDetailComponent),
  },
  {
    path: 'drivers',
    loadComponent: () =>
      import('./features/drivers/drivers-list.component').then(m => m.DriversListComponent),
  },
  {
    path: 'drivers/:id',
    loadComponent: () =>
      import('./features/drivers/driver-detail.component').then(m => m.DriverDetailComponent),
  },
  {
    path: 'tracking',
    loadComponent: () =>
      import('./features/tracking/tracking-map.component').then(m => m.TrackingMapComponent),
  },
  {
    path: 'routes',
    loadComponent: () =>
      import('./features/routes/routes-list.component').then(m => m.RoutesListComponent),
  },
  {
    path: 'deliveries',
    loadComponent: () =>
      import('./features/deliveries/deliveries-list.component').then(m => m.DeliveriesListComponent),
  },
  {
    path: 'exceptions',
    loadComponent: () =>
      import('./features/exceptions/exceptions-list.component').then(m => m.ExceptionsListComponent),
  },
  {
    path: 'carriers',
    loadComponent: () =>
      import('./features/carriers/carriers-list.component').then(m => m.CarriersListComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
