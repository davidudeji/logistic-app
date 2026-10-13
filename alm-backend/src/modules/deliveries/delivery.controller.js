import { deliveryService } from './delivery.service.js';

export class DeliveryController {
  async updateStatus(req, res, next) {
    try {
      const { deliveryId } = req.params;
      const result = deliveryService.updateDeliveryStatus(deliveryId, req.body, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getDelivery(req, res, next) {
    try {
      const { deliveryId } = req.params;
      const del = deliveryService.getDeliveryById(deliveryId);
      if (!del) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Delivery ${deliveryId} not found.`,
            requestId: req.id,
            retryable: false,
          },
        });
      }
      res.json(del);
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryController = new DeliveryController();
