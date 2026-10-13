import crypto from 'node:crypto';
import { s3StorageClient } from '../../config/s3.js';
import { openAiVisionClient } from '../../config/openai.js';

export class EpodService {
  constructor() {
    this.epodRecords = new Map();
  }

  async processEpodUpload(deliveryId, fileBuffer, mimeType, meta = {}, authenticatedUser = null) {
    const epodId = `epod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const submittedAt = new Date().toISOString();

    // 1. Persist image in private S3 storage
    const s3Result = await s3StorageClient.uploadObject(fileBuffer, mimeType, `epod/${deliveryId}`);

    // 2. Initial record persistence (ensures document is safely retained even if AI call fails)
    const record = {
      epodId,
      deliveryId,
      objectKey: s3Result.objectKey,
      checksum: s3Result.checksum,
      contentType: mimeType,
      fileSize: s3Result.fileSize,
      submittedAt,
      submittedBy: authenticatedUser?.id || 'Driver',
      receiverName: meta.receiverName,
      deliveryNotes: meta.deliveryNotes,
      status: 'audit_pending',
      audit: null,
    };

    this.epodRecords.set(epodId, record);

    // 3. Submit image to OpenAI GPT-4o vision analysis
    try {
      const base64Data = fileBuffer.toString('base64');
      const auditResult = await openAiVisionClient.auditDocumentImage(base64Data, mimeType);

      record.audit = auditResult;
      record.status = auditResult.damagedCargo ? 'review_required' : 'approved';
    } catch (err) {
      console.warn(`[EpodService] Vision audit failed for ${epodId}, retaining document as review_required:`, err.message);
      record.status = 'review_required';
      record.audit = {
        receiverName: meta.receiverName || 'Unverified',
        deliveryDate: new Date().toISOString().split('T')[0],
        damagedCargo: false,
        manifestAuditNotes: 'AI Vision analysis unavailable at submission time. Flagged for manual audit review.',
      };
    }

    this.epodRecords.set(epodId, record);

    return {
      epodId,
      deliveryId,
      status: record.status,
      audit: record.audit,
      submittedAt,
    };
  }

  getEpodByDeliveryId(deliveryId) {
    for (const record of this.epodRecords.values()) {
      if (record.deliveryId === deliveryId) {
        return record;
      }
    }
    return null;
  }

  getEpodById(epodId) {
    return this.epodRecords.get(epodId) || null;
  }

  async getPresignedDownloadUrl(epodId) {
    const record = this.getEpodById(epodId);
    if (!record) {
      throw new Error(`ePOD document with ID "${epodId}" not found.`);
    }

    return s3StorageClient.generatePresignedDownloadUrl(record.objectKey);
  }
}

export const epodService = new EpodService();
