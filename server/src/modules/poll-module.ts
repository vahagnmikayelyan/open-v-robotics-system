import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'poll',
  name: 'Poll',
  description: 'Displays multiple-choice answer buttons on the screen',
  category: 'service',

  programConfigs: [
    {
      key: 'answers_count',
      label: 'Answers Count',
      type: 'number',
      defaultValue: 4,
    },
  ],

  getTools: (programConfigs?: Record<string, unknown>) => [
    {
      module: 'poll',
      name: 'poll_showPoll',
      description: 'Shows answer buttons on the screen WITHOUT displaying a text question',
      parameters: [
        {
          name: 'options',
          description:
            `An array of ${programConfigs?.poll_answers_count || 4} answer options to display as buttons. Each option should be a short word or phrase`,
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
    {
      module: 'poll',
      name: 'poll_showPollWithQuestion',
      description: 'Shows a text question AND answer buttons on the screen.',
      parameters: [
        {
          name: 'question',
          description: 'The question text to display on screen above the answer buttons.',
          type: 'string',
          isRequired: true,
        },
        {
          name: 'options',
          description:
            `An array of ${programConfigs?.poll_answers_count || 4} answer options to display as buttons. Each option should be a short word or phrase`,
          type: 'array',
          items: { type: 'string' },
          isRequired: true,
        },
      ],
    },
  ],

  create(deps: IModuleDeps) {
    return new PollModule(deps);
  },
});

class PollModule {

  constructor(private deps: IModuleDeps) { }

  async showPoll(params: { options: string[] }): Promise<{ message: string }> {
    this.deps.emitToUI('showPoll', params);
    return Promise.resolve({ message: 'Poll sent' });
  }

  async showPollWithQuestion(params: { question: string; options: string[] }): Promise<{ message: string }> {
    this.deps.emitToUI('showPoll', params);
    return Promise.resolve({ message: 'Poll sent' });
  }

  handleAnswer({ answer }: { answer: string }): Promise<{ success: boolean }> {
    this.deps.emitToAI(`Poll answer: ${answer}`);
    return Promise.resolve({ success: true });
  }
}
