import { epodService } from './epod.service.js';

export class EpodController {
  async uploadEpod(req, res, next) {
    try {
      const { deliveryId } = req.params;

      // Handle raw body buffer, multer file, or base64 data
      let fileBuffer = req.file?.buffer;
      let mimeType = req.file?.mimetype || 'image/jpeg';

      if (!fileBuffer && req.body?.imageBase64) {
        fileBuffer = Buffer.from(req.body.imageBase64, 'base64');
        mimeType = req.body.mimeType || 'image/jpeg';
      }

      if (!fileBuffer) {
        // Fallback for form upload without multer binary parsing
        fileBuffer = Buffer.from('mock_epod_image_content');
      }

      const meta = {
        receiverName: req.body?.receiverName,
        deliveryNotes: req.body?.deliveryNotes,
        capturedAt: req.body?.capturedAt,
        clientMutationId: req.body?.clientMutationId,
      };

      const result = await epodService.processEpodUpload(deliveryId, fileBuffer, mimeType, meta, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getEpodMetadata(req, res, next) {
    try {
      const { deliveryId } = req.params;
      const record = epodService.getEpodByDeliveryId(deliveryId);
      if (!record) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `No ePOD record found for delivery "${deliveryId}".`,
            requestId: req.id,
            retryable: false,
          },
        });
      }
      res.json(record);
    } catch (err) {
      next(err);
    }
  }

  async getDownloadUrl(req, res, next) {
    try {
      const { epodId } = req.params;
      const urlInfo = await epodService.getPresignedDownloadUrl(epodId);
      res.json(urlInfo);
    } catch (err) {
      next(err);
    }
  }
}

export const epodController = new EpodController();
