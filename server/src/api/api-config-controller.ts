import { z } from 'zod';
import { Request, Response } from 'express';
import { IConfig, IConfigController } from '../types/config.js';
import { Logger } from '../services/logger.js';

const ApiConfigController = (configController: IConfigController) => {
  const updateConfigSchema = z.object({
    key: z.string().min(1, 'Ket is required'),
    value: z.any().refine((val) => val !== undefined, {
      message: 'Value is required',
    }),
  });

  const updateConfigsSchema = z.array(
    z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.any().refine((val) => val !== undefined, { message: 'Value is required' }),
    }),
  );

  const handleError = (res: Response, error: any) => {
    if (error instanceof z.ZodError) {
      // @ts-ignore
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }

    Logger.errorLog(error.message, 'Config API');
    return res.status(400).json({ error: 'Wrong request' });
  };

  return {
    getConfigs: async (_: Request, res: Response) => {
      try {
        const configs = configController.getAll();
        res.status(200).json(configs);
      } catch (error) {
        handleError(res, error);
      }
    },

    getConfig: async (req: Request, res: Response) => {
      try {
        const key = req.params.key as string;
        if (!key) return res.status(400).json({ error: 'Key is required' });

        const value = configController.getConfig(key);
        if (value === null) {
          return res.status(404).json({ error: `Config with key '${key}' not found` });
        }

        res.status(200).json({ key, value });
      } catch (error) {
        handleError(res, error);
      }
    },

    updateConfig: async (req: Request, res: Response) => {
      try {
        const validData = updateConfigSchema.parse(req.body);

        const updated = configController.updateConfig({
          key: validData.key,
          value: validData.value,
        });

        res.status(200).json(updated);
      } catch (error) {
        handleError(res, error);
      }
    },

    updateConfigs: async (req: Request, res: Response) => {
      try {
        const validData = updateConfigsSchema.parse(req.body) as IConfig[];

        configController.updateConfigs(validData);

        res.status(200).json({
          success: true,
          updatedCount: validData.length,
        });
      } catch (error) {
        handleError(res, error);
      }
    },
  };
};

export default ApiConfigController;
