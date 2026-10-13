import { routingService } from './routing.service.js';

export class RoutingController {
  async optimizeRoute(req, res, next) {
    try {
      const result = await routingService.optimizeRoute(req.body, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async confirmRoute(req, res, next) {
    try {
      const { routeId } = req.params;
      const result = await routingService.confirmRoute(routeId, req.body, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getRoute(req, res, next) {
    try {
      const { routeId } = req.params;
      const route = routingService.getRoute(routeId);
      if (!route) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Route with id "${routeId}" not found.`,
            requestId: req.id,
            retryable: false,
          },
        });
      }
      res.json(route);
    } catch (err) {
      next(err);
    }
  }
}

export const routingController = new RoutingController();
