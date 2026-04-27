import { fal } from '@fal-ai/client';
import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'imageGenerator',
  name: 'Fal AI Image Generator',
  description: "Generates images from text prompts using FLUX.1 [schnell] and displays them on the robot's screen.",
  category: 'service',
  moduleConfigs: [
    {
      key: 'fal_ai_api_key',
      label: 'Fal AI API Key',
      hint: 'fal.ai / API Keys',
      type: 'text',
    },
  ],

  tools: [
    {
      module: 'imageGenerator',
      name: 'imageGenerator_generateImage',
      description: 'Generates an image from a text description.',
      parameters: [
        {
          name: 'prompt',
          description:
            "The text prompt for image generation. CRITICAL RULES: 1) MUST be strictly in English. Translate any concepts from other languages. 2) Must be highly detailed. Specify the subject, style, and background (e.g., 'A cute golden retriever puppy. Simple flat vector illustration for kids, bright colors, solid white background.').",
          type: 'string',
          isRequired: true,
        },
      ],
    },
    {
      module: 'imageGenerator',
      name: 'imageGenerator_clearScreen',
      description: "Clears the screen, hiding the currently displayed image and showing the robot's standard eyes.",
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new ImageGeneratorModule(deps);
  },
});

class ImageGeneratorModule {
  constructor(private deps: IModuleDeps) {}

  async generateImage({ prompt }: { prompt: string }) {
    if (!prompt) {
      this.deps.emitSystemError('Error: Prompt is empty.');
      throw new Error('Prompt is required');
    }

    const apiKey = this.deps.getConfig('fal_ai_api_key');
    if (!apiKey) {
      this.deps.emitSystemError('Fal AI API key is not configured.');
      throw new Error('Fal AI API key is missing. Please add it in settings.');
    }

    try {
      fal.config({ credentials: apiKey as string });

      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt,
          image_size: 'landscape_4_3',
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS' && update.logs) {
            update.logs.map((log) => log.message).forEach((msg) => console.log('Fal AI:', msg));
          }
        },
      });

      const data = result.data as any;

      if (!data.images || !data.images[0]) {
        throw new Error('No image returned from Fal API.');
      }

      const imageUrl = data.images[0].url;

      this.deps.emitToUI('showImage', { url: imageUrl });

      return { success: true, message: 'Image successfully generated and displayed on the screen.' };
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.deps.emitSystemError(`Image generation failed: ${errorMessage}`);
      throw e;
    }
  }

  async clearScreen() {
    this.deps.emitToUI('clearScreen');
    return { success: true, message: 'Screen cleared.' };
  }
}
