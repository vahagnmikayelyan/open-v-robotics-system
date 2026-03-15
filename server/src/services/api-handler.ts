import cors from 'cors';
import express from 'express';
import type { Express } from 'express';

import ApiConfigController from '../api/api-config-controller.js';
import ConfigRepository from '../repositories/sqlite/config-repository.js';
import ConfigController from './config-controller.js';

const ApiHandler = (app: Express, dbClient: any) => {
  const configRepo = new ConfigRepository(dbClient);
  const configController = new ConfigController(configRepo);
  const apiConfigController = ApiConfigController(configController);

  const router = express.Router();

  app.use(cors());
  app.use(express.json());

  // Configs
  router.get('/config', apiConfigController.getConfigs);
  router.get('/config/:key', apiConfigController.getConfig);
  router.put('/config/:key', apiConfigController.updateConfig);
  router.put('/config', apiConfigController.updateConfigs);

  app.use('/api', router);
};

export default ApiHandler;
