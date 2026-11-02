import { Routes } from '@angular/router';

export const almRoutes: Routes = [
  {
    path: 'fleet',
    loadComponent: () =>
      import('../tracking/dispatcher-tracking.component').then(
        (m) => m.DispatcherTrackingComponent
      ),
  },
  {
    path: 'operations',
    loadComponent: () =>
      import('./pages/logistics-operations-page/logistics-operations-page.component').then(
        (m) => m.LogisticsOperationsPageComponent
      ),
  },
  {
    path: 'routes',
    loadComponent: () =>
      import('./pages/route-planning-page/route-planning-page.component').then(
        (m) => m.RoutePlanningPageComponent
      ),
  },
  {
    path: 'deliveries/:id',
    loadComponent: () =>
      import('./pages/delivery-detail-page/delivery-detail-page.component').then(
        (m) => m.DeliveryDetailPageComponent
      ),
  },
  {
    path: '',
    redirectTo: 'operations',
    pathMatch: 'full',
  },
];
