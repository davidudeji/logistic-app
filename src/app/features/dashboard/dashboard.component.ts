import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { ExceptionService } from '../../core/services/exception.service';
import { LoadService } from '../../core/services/load.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { MapComponent } from '../../components/map/map';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
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
  color: string;
  trend: string;
  trendUp: boolean | null;
  sparkData: number[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapComponent, SparklineComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private exceptionService = inject(ExceptionService);
  private loadService      = inject(LoadService);
  private vehicleService   = inject(VehicleService);

  readonly kpi         = this.dashboardService.kpi;
  readonly exceptions  = this.exceptionService.exceptions;
  readonly activeLoads = computed(() => this.loadService.loads().filter(
    l => l.status === 'IN_TRANSIT' || l.status === 'DISPATCHED'
  ));
  readonly kpiCards    = signal<KpiCard[]>([]);
  readonly currentDate = new Date();
  readonly searchQuery = signal('');

  readonly exceptionSeverityBadge = exceptionSeverityBadge;
  readonly exceptionTypeLabel     = exceptionTypeLabel;
  readonly loadStatusBadge        = loadStatusBadge;
  readonly loadStatusLabel        = loadStatusLabel;

  ngOnInit(): void {
    const kpi = this.kpi();
    this.kpiCards.set([
      {
        label: 'Active Loads', value: kpi.activeLoads.toString(),
        sub: 'In transit or dispatched', icon: 'loads',
        colorVar: '--brand', color: '#2563EB',
        trend: '+12 from yesterday', trendUp: true,
        sparkData: [98, 105, 112, 108, 120, 135, 128, 142],
      },
      {
        label: 'Active Vehicles', value: kpi.activeVehicles.toString(),
        sub: `${this.vehicleService.getMetrics().available} available`,
        icon: 'fleet', colorVar: '--info', color: '#0284C7',
        trend: '↑ 8% utilisation', trendUp: true,
        sparkData: [48, 52, 58, 54, 60, 63, 59, 61],
      },
      {
        label: 'On-Time Rate', value: kpi.onTimeDeliveryPct + '%',
        sub: '7-day rolling average', icon: 'ontime',
        colorVar: '--success', color: '#059669',
        trend: '↑ 2.1% vs last week', trendUp: true,
        sparkData: [86, 88, 87, 90, 89, 91, 90, 91],
      },
      {
        label: 'At-Risk', value: kpi.atRiskDeliveries.toString(),
        sub: 'Near SLA breach', icon: 'risk',
        colorVar: '--warning', color: '#D97706',
        trend: '↑ 2 from yesterday', trendUp: false,
        sparkData: [3, 4, 5, 3, 4, 6, 5, 7],
      },
      {
        label: 'Failed Today', value: kpi.failedDeliveries.toString(),
        sub: 'Requires attention', icon: 'failed',
        colorVar: '--error', color: '#DC2626',
        trend: '↓ 1 vs yesterday', trendUp: null,
        sparkData: [6, 5, 3, 4, 5, 4, 5, 4],
      },
      {
        label: 'Fuel Spend', value: kpi.fuelCostToday,
        sub: "Today's total fuel cost", icon: 'fuel',
        colorVar: '--text-secondary', color: '#64748B',
        trend: '₦0.18M over budget', trendUp: false,
        sparkData: [0.9, 1.0, 1.1, 1.05, 1.15, 1.2, 1.18, 1.24],
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
