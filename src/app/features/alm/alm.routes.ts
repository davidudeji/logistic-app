import { Routes } from '@angular/router';

export const almRoutes: Routes = [
  {
    path: 'fleet',
    loadComponent: () =>
      import('./pages/fleet-monitoring-page/fleet-monitoring-page.component').then(
        (m) => m.FleetMonitoringPageComponent
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
    redirectTo: 'fleet',
    pathMatch: 'full',
  },
];
