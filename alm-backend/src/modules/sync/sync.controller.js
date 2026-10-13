import { syncService } from './sync.service.js';

export class SyncController {
  async syncMutations(req, res, next) {
    try {
      const { mutations } = req.body;
      const result = syncService.processBatchSync(mutations, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const syncController = new SyncController();
