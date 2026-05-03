import os from 'os';
import { exec } from 'node:child_process';
import { Request, Response } from 'express';

import { Logger } from '../services/logger.js';
import { availableAIModels } from '../configs/ai-models.js';
import { getAllModuleMetadata, moduleCategories } from '../modules/module-registry.js';

const ApiUtilsController = () => {
  const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      if (interfaces[name]) {
        for (const info of interfaces[name]) {
          if (info.family === 'IPv4' && !info.internal) {
            return info.address;
          }
        }
      }
    }
    return '127.0.0.1';
  };

  return {
    getConnectionInfo: async (_: Request, res: Response) => {
      try {
        const ip = getLocalIpAddress();
        res.status(200).json({ ip });
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get connection info' });
      }
    },

    getAiModels: async (_: Request, res: Response) => {
      try {
        const models = availableAIModels || [];
        res.status(200).json(models);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get AI models' });
      }
    },

    getAvailableModules: async (_: Request, res: Response) => {
      try {
        res.status(200).json(getAllModuleMetadata());
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get available modules' });
      }
    },

    getModuleCategories: async (_: Request, res: Response) => {
      try {
        res.status(200).json(moduleCategories);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get module categories' });
      }
    },

    reboot: async (_: Request, res: Response) => {
      Logger.debugLog('Reboot requested from UI', 'Utils API');
      res.status(200).json({ ok: true });
      // Execute after response is sent
      setTimeout(() => exec('sudo shutdown -r now'), 500);
    },

    powerOff: async (_: Request, res: Response) => {
      Logger.debugLog('Power off requested from UI', 'Utils API');
      res.status(200).json({ ok: true });
      // Execute after response is sent
      setTimeout(() => exec('sudo shutdown -h now'), 500);
    },
  };
};

export default ApiUtilsController;
