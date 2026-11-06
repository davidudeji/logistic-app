import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventory-list.component').then(m => m.InventoryListComponent),
  },
  {
    path: 'grn',
    loadComponent: () =>
      import('./pages/grn/grn-page.component').then(m => m.GrnPageComponent),
  },
  {
    path: 'dispatch-orders',
    loadComponent: () =>
      import('./pages/dispatch-orders/dispatch-orders-page.component').then(m => m.DispatchOrdersPageComponent),
  },
  {
    path: 'transfer',
    loadComponent: () =>
      import('./pages/transfer/transfer-page.component').then(m => m.TransferPageComponent),
  },
  {
    path: 'adjustments',
    loadComponent: () =>
      import('./pages/adjustments/adjustments-page.component').then(m => m.AdjustmentsPageComponent),
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./pages/alerts/alerts-page.component').then(m => m.AlertsPageComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/inventory-reports.component').then(m => m.InventoryReportsComponent),
  },
  {
    path: 'cycle-count',
    loadComponent: () =>
      import('./pages/cycle-count/cycle-count-page.component').then(m => m.CycleCountPageComponent),
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('./pages/returns/returns-page.component').then(m => m.ReturnsPageComponent),
  },
];

