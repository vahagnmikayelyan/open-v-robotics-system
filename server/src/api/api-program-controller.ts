import { z } from 'zod';
import { Request, Response } from 'express';
import { IProgram, IProgramController } from '../types/program.js';
import { getAllModuleMetadata } from '../modules/module-registry.js';
import { availableAIModels } from '../configs/ai-models.js';

const programSchema = z
  .object({
    name: z.string().min(1, "Field 'name' is required"),
    aiModel: z.string().min(1, "Field 'aiModel' is required"),
    systemInstruction: z.string(),
    voice: z.string().default(''),
    modules: z
      .array(
        z.string().superRefine((val, ctx) => {
          if (!getAllModuleMetadata().some((module) => module.id === val)) {
            ctx.addIssue(`Module '${val}' is not a supported module`);
          }
        }),
      )
      .default([]),
    moduleConfigs: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((data, ctx) => {
    const model = availableAIModels.find((m) => m.id === data.aiModel);
    if (!model) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown AI model '${data.aiModel}'`,
        path: ['aiModel'],
      });
      return;
    }
    if (model.voices.length > 0) {
      if (!data.voice || !model.voices.includes(data.voice)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a voice from the list for this AI model',
          path: ['voice'],
        });
      }
    }
  });

const ApiProgramController = (programsController: IProgramController) => {
  const handleError = (res: Response, error: any) => {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ errors: formattedErrors });
    }

    if (error.message === 'Program not found') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(400).json({ error: error.message || 'Bad Request' });
  };

  return {
    getPrograms: async (_: Request, res: Response) => {
      try {
        const programs = programsController.getPrograms();
        res.status(200).json(programs);
      } catch (error) {
        handleError(res, error);
      }
    },

    getProgram: async (req: Request, res: Response) => {
      try {
        const id = z.coerce.number().int().positive().parse(req.params.id);

        const program = programsController.getProgram(id);

        res.status(200).json(program);
      } catch (error) {
        handleError(res, error);
      }
    },

    addProgram: async (req: Request, res: Response) => {
      try {
        const validData = programSchema.parse(req.body) as IProgram;
        const newProgram = programsController.createProgram(validData);

        res.status(201).json(newProgram);
      } catch (error) {
        handleError(res, error);
      }
    },

    updateProgram: async (req: Request, res: Response) => {
      try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const validData = programSchema.parse(req.body) as IProgram;

        const updated = programsController.updateProgram(id, validData);

        res.status(200).json(updated);
      } catch (error) {
        handleError(res, error);
      }
    },

    removeProgram: async (req: Request, res: Response) => {
      try {
        const id = z.coerce.number().int().positive().parse(req.params.id);

        const result = programsController.deleteProgram(id);
        res.status(200).json(result);
      } catch (error) {
        handleError(res, error);
      }
    },
  };
};

export default ApiProgramController;
