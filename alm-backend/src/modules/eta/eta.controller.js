import { etaService } from './eta.service.js';
import { isValidCoordinatePair } from '../../middleware/validate-request.js';

export class EtaController {
  async predictEta(req, res, next) {
    try {
      const { assetId, deliveryId, origin, destination } = req.body;

      if (!assetId || !deliveryId) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'assetId and deliveryId are required.',
            requestId: req.id,
            retryable: false,
          },
        });
      }

      if (!isValidCoordinatePair(origin) || !isValidCoordinatePair(destination)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'origin and destination must be valid [longitude, latitude] arrays.',
            requestId: req.id,
            retryable: false,
          },
        });
      }

      const result = await etaService.predictEta(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const etaController = new EtaController();
