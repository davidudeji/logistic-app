import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  Load, Driver, Vehicle, Order
} from '../../shared/models';
import { LoadService } from './load.service';
import { DriverService } from './driver.service';
import { VehicleService } from './vehicle.service';
import { OrderService } from './order.service';
import { RouteService } from './route.service';

export interface DispatchValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DispatchRequest {
  loadId: string;
  driverId: string;
  vehicleId: string;
  orderIds: string[];
}

@Injectable({ providedIn: 'root' })
export class DispatchService {
  constructor(
    private loadService: LoadService,
    private driverService: DriverService,
    private vehicleService: VehicleService,
    private orderService: OrderService,
    private routeService: RouteService,
  ) {}

  /**
   * Validates a dispatch request before committing.
   */
  validate(req: DispatchRequest): DispatchValidation {
    const errors: string[]   = [];
    const warnings: string[] = [];

    const driver  = this.driverService.drivers().find(d => d.id === req.driverId);
    const vehicle = this.vehicleService.vehicles().find(v => v.id === req.vehicleId);
    const orders  = this.orderService.orders().filter(o => req.orderIds.includes(o.id));

    if (!driver) { errors.push('Driver not found.'); }
    else if (driver.status !== 'AVAILABLE' && driver.status !== 'ASSIGNED') {
      errors.push(`Driver ${driver.name} is not available (${driver.status}).`);
    }

    if (!vehicle) { errors.push('Vehicle not found.'); }
    else {
      if (vehicle.status !== 'AVAILABLE' && vehicle.status !== 'ASSIGNED') {
        errors.push(`Vehicle ${vehicle.registrationNumber} is not available (${vehicle.status}).`);
      }
      const totalWeight = orders.reduce(
        (sum, o) => sum + o.packages.reduce((s, p) => s + p.weight, 0), 0
      );
      if (vehicle && totalWeight > vehicle.capacity) {
        errors.push(
          `Total weight (${totalWeight}kg) exceeds vehicle capacity (${vehicle.capacity}kg).`
        );
      } else if (vehicle && totalWeight > vehicle.capacity * 0.9) {
        warnings.push(`Load is near vehicle capacity (${Math.round(totalWeight / vehicle.capacity * 100)}%).`);
      }
    }

    if (orders.length === 0) {
      errors.push('No valid orders selected for this load.');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Commits a validated dispatch.
   */
  dispatch(req: DispatchRequest): Observable<boolean> {
    const validation = this.validate(req);
    if (!validation.valid) {
      return of(false).pipe(delay(100));
    }

    // Update load status
    this.loadService.dispatchLoad(req.loadId).subscribe();

    // Update driver and vehicle
    this.driverService.updateStatus(req.driverId, 'ASSIGNED').subscribe();
    this.vehicleService.updateStatus(req.vehicleId, 'ASSIGNED').subscribe();

    // Update orders
    req.orderIds.forEach(id => {
      this.orderService.updateStatus(id, 'ASSIGNED').subscribe();
    });

    return of(true).pipe(delay(500));
  }
}
