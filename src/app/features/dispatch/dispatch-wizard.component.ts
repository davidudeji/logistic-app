import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { LoadService } from '../../core/services/load.service';
import { DriverService } from '../../core/services/driver.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { DispatchService } from '../../core/services/dispatch.service';
import { Order, Driver, Vehicle } from '../../shared/models';

type Step = 'orders' | 'driver' | 'vehicle' | 'review' | 'done';

@Component({
  selector: 'app-dispatch-wizard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dispatch-wizard.component.html',
  styleUrl: './dispatch-wizard.component.css',
})
export class DispatchWizardComponent {
  private orderService    = inject(OrderService);
  private loadService     = inject(LoadService);
  private driverService   = inject(DriverService);
  private vehicleService  = inject(VehicleService);
  private dispatchService = inject(DispatchService);

  readonly step            = signal<Step>('orders');
  readonly selectedOrders  = signal<Order[]>([]);
  readonly selectedDriver  = signal<Driver | null>(null);
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly dispatchedLoadId = signal<string | null>(null);
  readonly isDispatching   = signal(false);

  readonly validationResult = computed(() => {
    const drv = this.selectedDriver();
    const veh = this.selectedVehicle();
    const ords = this.selectedOrders();
    if (!drv || !veh || ords.length === 0) return null;
    return this.dispatchService.validate({
      loadId: 'PENDING',
      driverId: drv.id,
      vehicleId: veh.id,
      orderIds: ords.map(o => o.id),
    });
  });

  // Available ready orders
  readonly readyOrders = computed(() =>
    this.orderService.orders().filter(o => o.status === 'READY' || o.status === 'CONFIRMED' || o.status === 'PENDING')
  );
  readonly availableDrivers  = computed(() => this.driverService.getAvailableDrivers());
  readonly availableVehicles = computed(() => this.vehicleService.getAvailableVehicles());

  readonly steps: { key: Step; label: string }[] = [
    { key: 'orders',  label: 'Select Orders' },
    { key: 'driver',  label: 'Select Driver' },
    { key: 'vehicle', label: 'Select Vehicle' },
    { key: 'review',  label: 'Review & Dispatch' },
  ];

  stepIndex = computed(() => this.steps.findIndex(s => s.key === this.step()));

  isOrderSelected(order: Order): boolean {
    return this.selectedOrders().some(o => o.id === order.id);
  }

  toggleOrder(order: Order) {
    this.selectedOrders.update(orders => {
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx >= 0) return orders.filter(o => o.id !== order.id);
      return [...orders, order];
    });
  }

  totalWeight(): number {
    return this.selectedOrders().reduce((sum, o) =>
      sum + o.packages.reduce((s, p) => s + p.weight, 0), 0);
  }

  capacityPct(): number {
    const v = this.selectedVehicle();
    if (!v || !v.capacity) return 0;
    return Math.min(100, Math.round((this.totalWeight() / v.capacity) * 100));
  }

  goTo(step: Step) { this.step.set(step); }
  next() {
    const idx = this.stepIndex();
    if (idx < this.steps.length - 1) this.step.set(this.steps[idx + 1].key);
  }
  back() {
    const idx = this.stepIndex();
    if (idx > 0) this.step.set(this.steps[idx - 1].key);
  }

  dispatch() {
    const drv = this.selectedDriver();
    const veh = this.selectedVehicle();
    if (!drv || !veh || this.selectedOrders().length === 0) return;

    this.isDispatching.set(true);
    // Create the load first
    this.loadService.createLoad({
      orderIds: this.selectedOrders().map(o => o.id),
      driverId: drv.id,
      vehicleId: veh.id,
      status: 'READY',
      scheduledDate: new Date().toISOString().slice(0, 10),
      totalStops: this.selectedOrders().length + 1,
      completedStops: 0,
      totalWeight: this.totalWeight(),
    }).subscribe(load => {
      this.dispatchService.dispatch({
        loadId: load.id,
        driverId: drv.id,
        vehicleId: veh.id,
        orderIds: this.selectedOrders().map(o => o.id),
      }).subscribe(ok => {
        this.isDispatching.set(false);
        if (ok) {
          this.dispatchedLoadId.set(load.id);
          this.step.set('done');
        }
      });
    });
  }

  reset() {
    this.selectedOrders.set([]);
    this.selectedDriver.set(null);
    this.selectedVehicle.set(null);
    this.dispatchedLoadId.set(null);
    this.step.set('orders');
  }

  totalPkgWeight(order: Order): number {
    return order.packages.reduce((s, p) => s + p.weight, 0);
  }

  capacityPctFor(vehicle: Vehicle): number {
    if (!vehicle.capacity) return 0;
    return Math.min(100, Math.round((this.totalWeight() / vehicle.capacity) * 100));
  }

  fuelClass(level: number): string {
    if (level <= 20) return 'error';
    if (level <= 40) return 'warning';
    return 'success';
  }

  priorityBadge(p: string): string {
    const m: Record<string, string> = {
      LOW: 'badge-neutral', NORMAL: 'badge-info', HIGH: 'badge-warning', URGENT: 'badge-error'
    };
    return m[p] ?? 'badge-neutral';
  }
}
