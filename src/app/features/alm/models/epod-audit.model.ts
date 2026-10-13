export interface EpodAudit {
  receiverName: string;
  deliveryDate: string;
  damagedCargo: boolean;
  manifestAuditNotes: string;
  confidenceScore?: number;
  flaggedReasons?: string[];
}

export type EpodAuditStatus = 'submitted' | 'audit_pending' | 'review_required' | 'approved' | 'rejected';

export interface EpodSubmissionResponse {
  epodId: string;
  deliveryId: string;
  status: EpodAuditStatus;
  audit?: EpodAudit;
  imageUrl?: string;
  fileSize?: number;
  mimeType?: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface EpodUploadPayload {
  image: File | Blob;
  receiverName?: string;
  deliveryNotes?: string;
  capturedAt: string;
  clientMutationId: string;
}
