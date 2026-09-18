import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from './components/sidebar/sidebar';
import { MapComponent } from './components/map/map';
import { DispatchTableComponent } from './components/dispatch-table/dispatch-table';
import { FleetService, KpiStats } from './services/fleet';

@Component({
  selector: 'app-root',
  imports: [CommonModule, SidebarComponent, MapComponent, DispatchTableComponent],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('logistic-app');

  kpiStats?: KpiStats;
  searchQuery = '';
  currentDate = new Date();

  readonly kpiCards = signal<Array<{
    label: string; value: string; sub: string; icon: string; color: string; trend: string; trendUp: boolean;
  }>>([]);

  constructor(private fleetService: FleetService) {}

  ngOnInit(): void {
    this.fleetService.getKpiStats().subscribe(stats => {
      this.kpiStats = stats;
      this.kpiCards.set([
        {
          label: 'Active Loads',
          value: stats.activeLoads.toString(),
          sub: '+12 from yesterday',
          icon: '📦',
          color: '#16a34a',
          trend: '↑ 10.4%',
          trendUp: true
        },
        {
          label: 'On-Time Rate',
          value: stats.onTimeRate.toFixed(1) + '%',
          sub: 'Last 7 days avg.',
          icon: '⏱️',
          color: '#3b82f6',
          trend: '↑ 2.1%',
          trendUp: true
        },
        {
          label: 'Today\'s Revenue',
          value: stats.totalRevenue,
          sub: 'vs. $248K yesterday',
          icon: '💰',
          color: '#f59e0b',
          trend: '↑ 14.7%',
          trendUp: true
        },
        {
          label: 'Active Drivers',
          value: stats.activeDrivers.toString(),
          sub: `${stats.criticalAlerts} critical alerts`,
          icon: '👤',
          color: '#8b5cf6',
          trend: '↓ 3 offline',
          trendUp: false
        },
      ]);
    });
  }
}
