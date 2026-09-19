import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { LoadService } from '../../core/services/load.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { DriverService } from '../../core/services/driver.service';
import { CarrierService } from '../../core/services/carrier.service';
import { BarChartComponent, BarChartItem } from '../../shared/components/bar-chart/bar-chart.component';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, BarChartComponent, SparklineComponent],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.css',
})
export class AnalyticsDashboardComponent {
  readonly orderService   = inject(OrderService);
  readonly loadService    = inject(LoadService);
  readonly vehicleService = inject(VehicleService);
  readonly driverService  = inject(DriverService);
  readonly carrierService = inject(CarrierService);

  readonly analyticsKpis = computed(() => {
    const orders  = this.orderService.orders();
    const loads   = this.loadService.loads();
    const drivers = this.driverService.drivers();
    const total   = orders.length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const failed    = orders.filter(o => o.status === 'FAILED').length;
    const onTimePct = total > 0 ? Math.round(((total - failed) / total) * 100) : 0;
    return [
      { label: 'Total Orders',    value: total.toString(),       sub: 'All time',               spark: [42,55,48,60,58,63,70,66], color: '#2563EB' },
      { label: 'Delivered',       value: delivered.toString(),   sub: 'Successfully completed', spark: [30,38,35,42,40,48,55,51], color: '#059669' },
      { label: 'On-Time Rate',    value: onTimePct + '%',        sub: 'Last 7 days',            spark: [84,85,87,86,88,90,89,91], color: '#059669' },
      { label: 'Failed',          value: failed.toString(),      sub: 'Requires review',        spark: [6,5,4,5,6,4,5,4],         color: '#DC2626' },
      { label: 'Active Drivers',  value: drivers.filter(d => d.status !== 'OFFLINE').length.toString(), sub: 'On shift', spark: [8,9,8,10,9,10,9,10], color: '#0284C7' },
      { label: 'Active Loads',    value: loads.filter(l => l.status === 'IN_TRANSIT').length.toString(), sub: 'In transit', spark: [12,14,16,15,18,20,18,22], color: '#D97706' },
    ];
  });

  readonly orderStatusBars = computed((): BarChartItem[] => {
    const orders = this.orderService.orders();
    const statuses: { label: string; key: string; color: string }[] = [
      { label: 'Delivered',  key: 'DELIVERED',  color: '#059669' },
      { label: 'In Transit', key: 'IN_TRANSIT', color: '#2563EB' },
      { label: 'Assigned',   key: 'ASSIGNED',   color: '#0284C7' },
      { label: 'Pending',    key: 'PENDING',     color: '#94A3B8' },
      { label: 'Failed',     key: 'FAILED',      color: '#DC2626' },
      { label: 'Cancelled',  key: 'CANCELLED',   color: '#CBD5E1' },
    ];
    return statuses.map(s => ({
      label: s.label,
      value: orders.filter(o => o.status === s.key).length,
      color: s.color,
    }));
  });

  readonly carrierBars = computed((): BarChartItem[] =>
    this.carrierService.carriers()
      .filter(c => c.onTimeRate != null)
      .map(c => ({
        label: c.name,
        value: c.onTimeRate!,
        color: c.onTimeRate! >= 90 ? '#059669' : c.onTimeRate! >= 75 ? '#D97706' : '#DC2626',
      }))
      .sort((a, b) => b.value - a.value)
  );

  readonly vehicleUtilBars = computed((): BarChartItem[] =>
    this.vehicleService.vehicles().map(v => ({
      label: v.registrationNumber,
      value: v.fuelLevel ?? 0,
      color: (v.fuelLevel ?? 0) <= 20 ? '#DC2626' : (v.fuelLevel ?? 0) <= 40 ? '#D97706' : '#059669',
    }))
  );

  fuelClass(l: number): string {
    return l <= 20 ? 'error' : l <= 40 ? 'warning' : 'success';
  }

  vBadge(s: string): string {
    const m: Record<string, string> = {
      AVAILABLE: 'badge-success', IN_TRANSIT: 'badge-info',
      ASSIGNED: 'badge-brand', MAINTENANCE: 'badge-warning', OFFLINE: 'badge-neutral'
    };
    return m[s] ?? 'badge-neutral';
  }
}
