import { IHardwareController } from '../types/hardware.js';
import { ISystemController } from '../types/system.js';
import { IProgramController } from '../types/program.js';
import SqliteClient from '../database/sqlite-client.js';
import ProgramController from './program-controller.js';
import ProgramRepository from '../repositories/sqlite/program-repository.js';
import { IAIModelController } from '../types/ai.js';
import { IToolDeclaration } from '../types/tool.js';
import { toolsDeclarations } from '../configs/tools-declarations.js';
import { Logger } from './logger.js';
import GeminiLiveAI from '../ai/gemini/gemini-live-ai.js';
import EventEmitter from 'events';
import { IConfigController } from '../types/config.js';
import ConfigController from './config-controller.js';
import ConfigRepository from '../repositories/sqlite/config-repository.js';
import { availableAIModels } from '../configs/ai-models.js';

class SystemController extends EventEmitter implements ISystemController {
  private hardwareController: IHardwareController;
  private programController: IProgramController;
  private configController: IConfigController;
  private aiController: IAIModelController | null = null;
  private allowedModules: Set<string> = new Set();

  constructor(dbClient: SqliteClient['db'], hardwareController: IHardwareController) {
    super();

    this.hardwareController = hardwareController;
    this.programController = new ProgramController(new ProgramRepository(dbClient));
    this.configController = new ConfigController(new ConfigRepository(dbClient));
  }

  async runProgram(programId: number) {
    Logger.debugLog(`Starting program - ${programId}`, 'System');

    if (this.aiController) {
      this.aiController.destroy();
      this.hardwareController.modules['microphone'].stopStream();
      this.hardwareController.modules['speaker'].stopStream();
    }

    try {
      const program = this.programController.getProgram(programId);

      Logger.debugLog('Program', 'System', program);

      this.allowedModules = new Set<string>(program.modules);
      const aiModel = availableAIModels.find((model) => model.id === program.aiModel);

      if (!aiModel) {
        Logger.errorLog('AI model not found', 'System');
        return Promise.reject('AI model not found');
      }

      const tools: IToolDeclaration[] = toolsDeclarations.filter((tool) => this.allowedModules.has(tool.module));

      const apiKeyConfig = this.configController.getConfig(aiModel.apiKeySetting, '');

      if (!apiKeyConfig) {
        Logger.errorLog('AI model not configured', 'System');
        return Promise.reject('AI model not configured');
      }

      this.aiController = new GeminiLiveAI({
        model: aiModel.model,
        apiKey: apiKeyConfig as string,
        systemInstruction: program.systemInstruction,
        language: '',
        voice: program.voice,
        tools,
      });

      this.aiController.on('systemMessage', (data) => this.onAISystemMessage(data));
      this.aiController.on('textMessage', (data) => this.onAITextMessage(data));
      this.aiController.on('functionCalls', (data) => this.onAIFunctionCalls(data));
      this.aiController.on('image', (data) => this.onAIImageData(data));
      this.aiController.on('audio', (data) => this.onAIAudioData(data));

      // Enable speaker if program allowed use speaker
      if (this.allowedModules.has('speaker')) {
        this.hardwareController.modules['speaker'].startStream();
      }

      // Enable microphone if program allowed use microphone
      if (this.allowedModules.has('microphone')) {
        this.hardwareController.modules['microphone'].on('audioChunk', (audioChunk: Buffer) => {
          this.aiController && this.aiController.sendAudio(audioChunk);
        });

        this.hardwareController.modules['microphone'].startStream();
      }

      await this.aiController.connect();
    } catch (e) {
      Logger.errorLog('Program not found', 'System');
    }
  }

  sendText(text: string) {
    this.aiController && this.aiController.sendText(text);
  }

  private onAISystemMessage(message: unknown) {
    this.emit('AISystemMessage', JSON.stringify(message));
  }

  private onAITextMessage(text: string) {
    this.emit('AITextMessage', text);
  }

  private onAIFunctionCalls(calls: Array<{ id: string; name: string; args: Record<string, unknown> }>) {
    Logger.debugLog('onAIFunctionCall', 'System', calls.length);

    const executePromises = calls.map(async (call) => {
      let executionResult;

      const parts = call.name.split('_');

      this.onAISystemMessage({ event: 'functionCall', name: call.name, args: call.args });

      if (parts.length === 2) {
        // Check module execution permission
        if (!this.allowedModules.has(parts[0])) {
          executionResult = { status: 'error', error: 'Access denied' };
        } else {
          try {
            const result = (await this.hardwareController.runCommand(
              parts[0],
              parts[1],
              call.args ?? {},
            )) as Promise<object>;
            executionResult = { ...result, status: 'success' };
          } catch (e) {
            executionResult = { status: 'error', error: 'Error in execution command' };
          }
        }
      } else {
        executionResult = { status: 'error', error: 'Unknown command' };
      }

      return {
        name: call.name,
        id: call.id,
        response: { result: executionResult },
      };
    });

    // Collecting all responses from tools and sending
    Promise.all(executePromises).then((finalResponses) => {
      this.aiController?.sendToolResponses(finalResponses);
    });
  }

  private onAIImageData(_: { mimeType: string; base64Data: Buffer }) {
    Logger.debugLog('onAIImageData', 'System');
  }

  private onAIAudioData(data: { mimeType: string; base64Data: string | Buffer }) {
    const buffer = typeof data.base64Data === 'string' ? Buffer.from(data.base64Data, 'base64') : data.base64Data;

    // Writing audio data to PipeWire
    this.hardwareController.modules['speaker'].playStream(buffer);
  }
}

export default SystemController;
