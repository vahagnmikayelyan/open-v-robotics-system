import os from 'os';
import { Request, Response } from 'express';

import config from '../config.js';
import { Logger } from '../services/logger.js';

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
        const models = config.availableAIModels || [];
        res.status(200).json(models);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get AI models' });
      }
    },

    getAvailableModules: async (_: Request, res: Response) => {
      try {
        const modules = config.availableModules || [];
        res.status(200).json(modules);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get available modules' });
      }
    },
  };
};

export default ApiUtilsController;
