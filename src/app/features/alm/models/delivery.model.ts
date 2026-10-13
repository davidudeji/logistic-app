import { EpodSubmissionResponse } from './epod-audit.model';
import { DeliveryETA } from '../../../shared/models';

export type AlmDeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface AlmTimelineEvent {
  title: string;
  timestamp: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
  actor?: string;
  location?: string;
}

export interface AlmDeliveryDetail {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  destinationCoordinates: [number, number]; // [lng, lat]
  city: string;
  state: string;
  status: AlmDeliveryStatus;
  assignedAssetId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  scheduledWindow: string;
  timeline: AlmTimelineEvent[];
  eta?: DeliveryETA;
  epod?: EpodSubmissionResponse;
  offlineQueued?: boolean;
}
