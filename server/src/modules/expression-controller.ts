import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'expression',
  name: 'Expression Controller',
  description: "Controls the robot's facial expressions and eye emotions.",
  category: 'actuator',

  getTools: () => [
    {
      module: 'expression',
      name: 'expression_setEmotion',
      description: "Sets the robot's active eye facial expression / emotion.",
      parameters: [
        {
          name: 'emotion',
          description: "The emotion to display. Supported: 'neutral' (default), 'happy', 'sad', 'angry', 'surprised', 'thinking', 'excited', 'sleeping', 'love', 'scanning', 'bored', 'cute'.",
          type: 'string',
          isRequired: true,
        },
      ],
    },
    {
      module: 'expression',
      name: 'expression_wink',
      description: 'Causes the robot to wink with the specified eye for a given duration.',
      parameters: [
        {
          name: 'eye',
          description: "Which eye to wink: 'left' or 'right'.",
          type: 'string',
          isRequired: true,
        },
        {
          name: 'duration',
          description: 'The duration of the wink in milliseconds. Default is 400ms.',
          type: 'integer',
          isRequired: false,
        },
      ],
    },
    {
      module: 'expression',
      name: 'expression_getEmotions',
      description: 'Returns the list of supported eye facial expressions / emotions.',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new ExpressionControllerModule(deps);
  },
});

class ExpressionControllerModule {
  private currentEmotion: string = 'neutral';

  constructor(private deps: IModuleDeps) {}

  async setEmotion({ emotion }: { emotion: string }) {
    const validEmotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'excited', 'sleeping', 'love', 'scanning', 'bored', 'cute'];
    if (!validEmotions.includes(emotion)) {
      throw new Error(`Invalid emotion: ${emotion}. Supported: ${validEmotions.join(', ')}`);
    }

    this.currentEmotion = emotion;
    this.deps.emitToUI('setEmotion', { emotion });
    
    return { success: true, message: `Robot eye expression changed to ${emotion}.` };
  }

  async wink({ eye, duration = 400 }: { eye: string; duration?: number }) {
    if (eye !== 'left' && eye !== 'right') {
      throw new Error("Invalid eye parameter. Must be either 'left' or 'right'.");
    }

    this.deps.emitToUI('wink', { eye, duration });
    return { success: true, message: `Winked ${eye} eye for ${duration}ms.` };
  }

  async getEmotions() {
    return {
      emotions: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'excited', 'sleeping', 'love', 'scanning', 'bored', 'cute'],
    };
  }
}
