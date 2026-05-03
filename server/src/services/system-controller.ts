import { IModuleController } from '../types/hardware.js';
import { ISystemController } from '../types/system.js';
import { IProgram, IProgramController } from '../types/program.js';
import SqliteClient from '../database/sqlite-client.js';
import ProgramController from './program-controller.js';
import ProgramRepository from '../repositories/sqlite/program-repository.js';
import { IAIModelController } from '../types/ai.js';
import { IToolDeclaration } from '../types/tool.js';
import { getAllToolDeclarations } from '../modules/module-registry.js';
import { Logger } from './logger.js';
import { createAIController } from '../ai/ai-registry.js';
import EventEmitter from 'events';
import { IConfigController } from '../types/config.js';
import ConfigController from './config-controller.js';
import { availableAIModels } from '../configs/ai-models.js';

class SystemController extends EventEmitter implements ISystemController {
  private moduleController: IModuleController;
  private programController: IProgramController;
  private configController: IConfigController;
  private aiController: IAIModelController | null = null;
  private allowedModules: Set<string> = new Set();
  private runningProgram: IProgram | null = null;

  constructor(dbClient: SqliteClient['db'], moduleController: IModuleController, configController: ConfigController) {
    super();

    this.moduleController = moduleController;
    this.configController = configController;
    this.programController = new ProgramController(new ProgramRepository(dbClient));

    this.moduleController.on('moduleAIMessage', (message: string) => {
      this.sendText(message);
    });
  }

  async runProgram(programId: number) {
    Logger.debugLog(`Starting program - ${programId}`, 'System');

    if (this.aiController) {
      this.aiController.destroy();
      this.moduleController.modules['microphone'].stopStream();
      this.moduleController.modules['speaker'].stopStream();
    }

    this.updateProgramState(null);

    try {
      const program = this.programController.getProgram(programId);

      Logger.debugLog('Program', 'System', program);

      this.allowedModules = new Set<string>(program.modules);
      const aiModel = availableAIModels.find((model) => model.id === program.aiModel);

      if (!aiModel) {
        Logger.errorLog('AI model not found', 'System');
        return Promise.reject('AI model not found');
      }

      this.moduleController.setActiveProgramConfigs(program.moduleConfigs || {});

      const tools: IToolDeclaration[] = getAllToolDeclarations(this.allowedModules, program.moduleConfigs || {});

      const apiKeyConfig = this.configController.getConfig(aiModel.apiKeySetting, '');

      if (!apiKeyConfig) {
        Logger.errorLog('AI model not configured', 'System');
        return Promise.reject('AI model not configured');
      }

      this.aiController = createAIController(aiModel.vendor, {
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
        this.moduleController.modules['speaker'].startStream();
      }

      // Enable microphone if program allowed use microphone
      if (this.allowedModules.has('microphone')) {
        this.moduleController.modules['microphone'].on('audioChunk', (audioChunk: Buffer) => {
          this.aiController && this.aiController.sendAudio(audioChunk);
        });

        this.moduleController.modules['microphone'].startStream(aiModel.micSampleRate);
      }

      await this.aiController.connect();

      this.updateProgramState(program);
    } catch (e) {
      Logger.errorLog('Program start failed', 'System', e);

      if (this.aiController) {
        this.aiController.destroy();
        this.aiController = null;
      }

      this.moduleController.modules['microphone'].stopStream();
      this.moduleController.modules['speaker'].stopStream();
      this.updateProgramState(null);

      const errorMessage = e instanceof Error ? e.message : String(e);
      this.emit('systemError', `Program start failed: ${errorMessage}`);
    }
  }

  getRunningProgram(): IProgram | null {
    return this.runningProgram;
  }

  stopRunningProgram() {
    Logger.debugLog('Stopping program', 'System');
    if (this.aiController) {
      this.aiController.destroy();
      this.moduleController.modules['microphone'].stopStream();
      this.moduleController.modules['speaker'].stopStream();
    }
    this.updateProgramState(null);
  }

  sendText(text: string) {
    this.aiController && this.aiController.sendText(text);
  }

  private updateProgramState(program: IProgram | null) {
    this.runningProgram = program;
    this.emit('programChange', program);
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

      Logger.debugLog('onAIFunctionCall', 'System', call);

      this.onAISystemMessage({ event: 'functionCall', name: call.name, args: call.args });

      if (parts.length === 2) {
        // Check module execution permission
        if (!this.allowedModules.has(parts[0])) {
          executionResult = { status: 'error', error: 'Access denied' };
        } else {
          try {
            const result = await this.moduleController.runCommand(parts[0], parts[1], call.args ?? {});

            // Camera returns a Buffer (JPEG) — send it as image to AI separately
            if (parts[0] === 'camera' && parts[1] === 'takePhoto') {
              this.aiController?.sendImage(result as Buffer);
              executionResult = { status: 'success', message: 'Photo captured and sent' };
            } else {
              executionResult = { ...(result as object), status: 'success' };
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error in execution command';
            executionResult = { status: 'error', error: errorMessage };
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
    this.moduleController.modules['speaker'].playStream(buffer);
  }
}

export default SystemController;
