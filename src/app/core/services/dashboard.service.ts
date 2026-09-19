import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DashboardKpi } from '../../shared/models';
import { MOCK_DASHBOARD_KPI, MOCK_EXCEPTIONS, MOCK_LOADS } from '../mock/mock-data';
import { DeliveryException, Load } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly _kpi = signal<DashboardKpi>(MOCK_DASHBOARD_KPI);
  private readonly _criticalExceptions = signal<DeliveryException[]>(
    MOCK_EXCEPTIONS.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH')
  );
  private readonly _activeLoads = signal<Load[]>(
    MOCK_LOADS.filter(l => l.status === 'IN_TRANSIT' || l.status === 'DISPATCHED')
  );

  readonly kpi = this._kpi.asReadonly();
  readonly criticalExceptions = this._criticalExceptions.asReadonly();
  readonly activeLoads = this._activeLoads.asReadonly();

  getKpi(): Observable<DashboardKpi> {
    return of(MOCK_DASHBOARD_KPI).pipe(delay(300));
  }
}
