import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DispatchJob {
  id: string;
  vehicleId: string;
  origin: string;
  destination: string;
  driver: string;
  cargo: string;
  distance: string;
  eta: string;
  status: 'On Time' | 'Delayed' | 'Critical' | 'Loading' | 'Delivered' | 'Assigned' | 'Unassigned';
  lat: number;
  lng: number;
}

export interface KpiStats {
  activeLoads: number;
  onTimeRate: number;
  totalRevenue: string;
  activeDrivers: number;
  deliveredToday: number;
  criticalAlerts: number;
}

@Injectable({ providedIn: 'root' })
export class FleetService {

  private readonly jobs = new BehaviorSubject<DispatchJob[]>([
    {
      id: 'LD-2024-001847',
      vehicleId: 'IL-5629',
      origin: 'Chicago',
      destination: 'Phoenix',
      driver: 'Mike Rodriguez',
      cargo: 'Electronics',
      distance: '1,751 mi',
      eta: '09:45 AM',
      status: 'On Time',
      lat: 41.8781,
      lng: -87.6298
    },
    {
      id: 'LD-2024-001848',
      vehicleId: 'CO-4022',
      origin: 'Denver',
      destination: 'Omaha',
      driver: 'Brooke Owen',
      cargo: 'Furniture',
      distance: '542 mi',
      eta: '02:15 PM',
      status: 'Assigned',
      lat: 39.7392,
      lng: -104.9903
    },
    {
      id: 'LD-2024-001849',
      vehicleId: 'CA-3962',
      origin: 'Los Angeles',
      destination: 'Seattle',
      driver: 'Brad Thompson',
      cargo: 'Auto Parts',
      distance: '1,137 mi',
      eta: '06:30 PM',
      status: 'Loading',
      lat: 34.0522,
      lng: -118.2437
    },
    {
      id: 'LD-2024-001850',
      vehicleId: 'TX-7341',
      origin: 'Dallas',
      destination: 'Houston',
      driver: 'Maria Santos',
      cargo: 'Food & Bev.',
      distance: '239 mi',
      eta: '11:00 AM',
      status: 'Delayed',
      lat: 32.7767,
      lng: -96.7970
    },
    {
      id: 'LD-2024-001851',
      vehicleId: 'MI-4471',
      origin: 'Detroit',
      destination: 'Kansas City',
      driver: 'Robert Wilson',
      cargo: 'Machinery',
      distance: '680 mi',
      eta: '08:20 AM',
      status: 'Critical',
      lat: 42.3314,
      lng: -83.0458
    },
    {
      id: 'LD-2024-001852',
      vehicleId: 'GA-8821',
      origin: 'Atlanta',
      destination: 'Nashville',
      driver: 'Diane Moore',
      cargo: 'Medical Supplies',
      distance: '248 mi',
      eta: '10:30 AM',
      status: 'On Time',
      lat: 33.7490,
      lng: -84.3880
    },
    {
      id: 'LD-2024-001853',
      vehicleId: 'WA-5510',
      origin: 'Seattle',
      destination: 'Portland',
      driver: 'James Carter',
      cargo: 'Retail Goods',
      distance: '174 mi',
      eta: '12:45 PM',
      status: 'Delivered',
      lat: 47.6062,
      lng: -122.3321
    },
    {
      id: 'LD-2024-001854',
      vehicleId: 'MO-9934',
      origin: 'Kansas City',
      destination: 'St. Louis',
      driver: 'Unassigned',
      cargo: 'Textiles',
      distance: '248 mi',
      eta: 'TBD',
      status: 'Unassigned',
      lat: 39.0997,
      lng: -94.5786
    }
  ]);

  private readonly kpi = new BehaviorSubject<KpiStats>({
    activeLoads: 127,
    onTimeRate: 94.2,
    totalRevenue: '$284,500',
    activeDrivers: 43,
    deliveredToday: 18,
    criticalAlerts: 3
  });

  getJobs(): Observable<DispatchJob[]> {
    return this.jobs.asObservable();
  }

  getKpiStats(): Observable<KpiStats> {
    return this.kpi.asObservable();
  }
}
