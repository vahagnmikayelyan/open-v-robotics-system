import cors from 'cors';
import express from 'express';
import type { Express } from 'express';

import ApiConfigController from '../api/api-config-controller.js';
import ConfigRepository from '../repositories/sqlite/config-repository.js';
import ConfigController from './config-controller.js';
import ApiUtilsController from '../api/api-utils-controller.js';
import ProgramRepository from '../repositories/sqlite/program-repository.js';
import ProgramController from './program-controller.js';
import ApiProgramController from '../api/api-program-controller.js';

const ApiHandler = (app: Express, dbClient: any) => {
  const configRepo = new ConfigRepository(dbClient);
  const configController = new ConfigController(configRepo);
  const apiConfigController = ApiConfigController(configController);

  const apiUtilsController = ApiUtilsController();

  const programRepo = new ProgramRepository(dbClient);
  const programController = new ProgramController(programRepo);
  const apiProgramController = ApiProgramController(programController);

  const router = express.Router();

  app.use(cors());
  app.use(express.json());

  // Configs
  router.get('/config', apiConfigController.getConfigs);
  router.get('/config/:key', apiConfigController.getConfig);
  router.put('/config/:key', apiConfigController.updateConfig);
  router.put('/config', apiConfigController.updateConfigs);

  // Utils
  router.get('/utils/connection', apiUtilsController.getConnectionInfo);
  router.get('/models', apiUtilsController.getAiModels);
  router.get('/modules', apiUtilsController.getAvailableModules);
  router.get('/categories', apiUtilsController.getModuleCategories);

  // Programs
  router.get('/programs', apiProgramController.getPrograms);
  router.get('/programs/:id', apiProgramController.getProgram);
  router.post('/programs', apiProgramController.addProgram);
  router.put('/programs/:id', apiProgramController.updateProgram);
  router.delete('/programs/:id', apiProgramController.removeProgram);

  app.use('/api', router);
};

export default ApiHandler;
