import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Route } from '../../shared/models';
import { MOCK_ROUTES } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly _routes = signal<Route[]>([...MOCK_ROUTES]);

  readonly routes = this._routes.asReadonly();

  getRoutes(): Observable<Route[]> {
    return of(this._routes()).pipe(delay(200));
  }

  getRoute(id: string): Observable<Route | undefined> {
    return of(this._routes().find(r => r.id === id)).pipe(delay(150));
  }

  getRouteForLoad(loadId: string): Route | undefined {
    return this._routes().find(r => r.loadId === loadId);
  }

  /**
   * Simulated route optimization — in production calls POST /api/routes/optimize.
   */
  optimizeRoute(loadId: string): Observable<Route | undefined> {
    const route = this._routes().find(r => r.loadId === loadId);
    if (route) {
      const optimized = { ...route, optimized: true };
      this._routes.update(routes => routes.map(r => r.loadId === loadId ? optimized : r));
      return of(optimized).pipe(delay(800)); // simulate network call
    }
    return of(undefined).pipe(delay(200));
  }
}
