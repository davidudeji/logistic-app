import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { ExceptionService } from '../../core/services/exception.service';
import { LoadService } from '../../core/services/load.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { MapComponent } from '../../components/map/map';
import { DashboardKpi, DeliveryException, Load } from '../../shared/models';
import {
  exceptionSeverityBadge, exceptionTypeLabel, loadStatusBadge, loadStatusLabel
} from '../../shared/utils/status.utils';

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  colorVar: string;
  trend: string;
  trendUp: boolean | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private exceptionService = inject(ExceptionService);
  private loadService      = inject(LoadService);
  private vehicleService   = inject(VehicleService);

  readonly kpi            = this.dashboardService.kpi;
  readonly exceptions     = this.exceptionService.exceptions;
  readonly activeLoads    = computed(() => this.loadService.loads().filter(
    l => l.status === 'IN_TRANSIT' || l.status === 'DISPATCHED'
  ));
  readonly kpiCards       = signal<KpiCard[]>([]);

  readonly currentDate    = new Date();
  readonly searchQuery    = signal('');

  // Expose badge helpers to template
  readonly exceptionSeverityBadge = exceptionSeverityBadge;
  readonly exceptionTypeLabel     = exceptionTypeLabel;
  readonly loadStatusBadge        = loadStatusBadge;
  readonly loadStatusLabel        = loadStatusLabel;

  ngOnInit(): void {
    const kpi = this.kpi();
    this.kpiCards.set([
      {
        label: 'Active Loads',
        value: kpi.activeLoads.toString(),
        sub: 'Loads currently in transit or dispatched',
        icon: 'loads',
        colorVar: '--brand',
        trend: '+12 from yesterday',
        trendUp: true,
      },
      {
        label: 'Active Vehicles',
        value: kpi.activeVehicles.toString(),
        sub: `${this.vehicleService.getMetrics().available} available`,
        icon: 'fleet',
        colorVar: '--info',
        trend: '↑ 8%',
        trendUp: true,
      },
      {
        label: 'On-Time Delivery',
        value: kpi.onTimeDeliveryPct + '%',
        sub: 'Last 7-day rolling average',
        icon: 'ontime',
        colorVar: '--success',
        trend: '↑ 2.1%',
        trendUp: true,
      },
      {
        label: 'At-Risk',
        value: kpi.atRiskDeliveries.toString(),
        sub: 'Deliveries near SLA breach',
        icon: 'risk',
        colorVar: '--warning',
        trend: '↑ 2 from yesterday',
        trendUp: false,
      },
      {
        label: 'Failed Deliveries',
        value: kpi.failedDeliveries.toString(),
        sub: 'Today — requires attention',
        icon: 'failed',
        colorVar: '--error',
        trend: '↓ 1 from yesterday',
        trendUp: null,
      },
      {
        label: 'Fuel Cost',
        value: kpi.fuelCostToday,
        sub: 'Today\'s total fuel spend',
        icon: 'fuel',
        colorVar: '--text-secondary',
        trend: '₦0.18M over budget',
        trendUp: false,
      },
    ]);
  }

  openExceptionCount(): number {
    return this.exceptions().filter(e => e.status !== 'RESOLVED').length;
  }

  getLoadProgress(load: Load): number {
    if (load.totalStops === 0) return 0;
    return Math.round((load.completedStops / load.totalStops) * 100);
  }

  getProgressClass(pct: number): string {
    if (pct >= 80) return 'success';
    if (pct >= 40) return '';
    return 'warning';
  }

  acknowledgeException(exc: DeliveryException): void {
    this.exceptionService.acknowledge(exc.id, 'Dispatcher').subscribe();
  }
}
