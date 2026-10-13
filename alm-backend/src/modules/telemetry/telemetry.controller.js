import { telemetryService } from './telemetry.service.js';

export class TelemetryController {
  async getFleetTelemetry(req, res, next) {
    try {
      const records = telemetryService.getFleetTelemetry();
      res.json(records);
    } catch (err) {
      next(err);
    }
  }

  async getVehicleTelemetryHistory(req, res, next) {
    try {
      const { assetId } = req.params;
      const history = telemetryService.getVehicleHistory(assetId);
      res.json(history);
    } catch (err) {
      next(err);
    }
  }
}

export const telemetryController = new TelemetryController();
