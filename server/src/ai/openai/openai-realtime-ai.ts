import { WebSocket } from 'ws';
import EventEmitter from 'events';
import { IAIControllerParams, IAIModelController } from '../../types/ai.js';
import { IToolDeclaration } from '../../types/tool.js';
import { Logger } from '../../services/logger.js';

class OpenAIRealtimeAI extends EventEmitter implements IAIModelController {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly voice: string;
  private readonly systemInstruction: string;
  private readonly tools: IToolDeclaration[];

  private isConnected: boolean = false;
  private isReconnecting: boolean = false;
  private isManualDisconnect: boolean = false;

  private ws: WebSocket | null = null;

  private connectResolve: ((value: boolean) => void) | null = null;
  private connectReject: ((reason: unknown) => void) | null = null;

  constructor({ model, apiKey, voice, systemInstruction, tools }: IAIControllerParams) {
    super();

    this.apiKey = apiKey;
    this.model = model;
    this.voice = voice;
    this.systemInstruction = systemInstruction;
    this.tools = tools;
  }

  private convertToTools() {
    return this.tools.map((tool) => ({
      type: 'function' as const,
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc: Record<string, any>, param) => {
          acc[param.name] = { type: param.type, description: param.description };
          return acc;
        }, {}),
        required: tool.parameters.filter((p) => p.isRequired).map((p) => p.name),
      },
    }));
  }

  private getSessionUpdateEvent() {
    return {
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: this.systemInstruction,
        output_modalities: ['audio'],
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            turn_detection: { type: 'semantic_vad' },
          },
          output: {
            format: { type: 'audio/pcm', rate: 24000 },
            voice: this.voice,
          },
        },
        tools: this.tools.length > 0 ? this.convertToTools() : [],
        tool_choice: this.tools.length > 0 ? 'auto' : 'none',
      },
    };
  }

  private sendData(data: object) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.isManualDisconnect = false;

      const url = `wss://api.openai.com/v1/realtime?model=${this.model}`;

      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isReconnecting = false;

        Logger.debugLog('OpenAI Realtime API connected', 'OpenAIRealtime');
        this.emit('systemMessage', { event: 'open' });
      });

      this.ws.on('message', (data: string) => {
        this.handleResponse(data);
      });

      this.ws.on('close', (code, reason) => {
        this.isConnected = false;
        Logger.debugLog('OpenAI Realtime API connection closed', 'OpenAIRealtime', {
          code,
          reason: reason.toString(),
        });
        this.emit('systemMessage', { event: 'close', code, reason: reason.toString() });

        if (!this.isManualDisconnect && !this.isReconnecting) {
          this.triggerReconnect();
        }
      });

      this.ws.on('error', (error) => {
        Logger.errorLog('WebSocket error', 'OpenAIRealtime', error);

        if (this.connectReject) {
          this.connectReject(error);
          this.connectResolve = null;
          this.connectReject = null;
        }
      });
    });
  }

  sendText(text: string) {
    this.sendData({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });

    this.sendData({ type: 'response.create' });
  }

  sendAudio(pcmOrBase64: Buffer | string) {
    const base64 = typeof pcmOrBase64 === 'string' ? pcmOrBase64 : pcmOrBase64.toString('base64');

    this.sendData({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  sendImage(imageBytesOrBase64: Buffer | string, mimeType = 'image/jpeg') {
    const base64 =
      typeof imageBytesOrBase64 === 'string' ? imageBytesOrBase64 : imageBytesOrBase64.toString('base64');

    const format = mimeType.split('/')[1] || 'jpeg';

    this.sendData({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: `data:image/${format};base64,${base64}`,
          },
        ],
      },
    });

    this.sendData({ type: 'response.create' });
  }

  sendToolResponses(responsesArray: unknown[]) {
    if (responsesArray.length === 0) return;

    for (const resp of responsesArray as Array<{ id: string; name: string; response: unknown }>) {
      this.sendData({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: resp.id,
          output: JSON.stringify(resp.response),
        },
      });
    }

    this.sendData({ type: 'response.create' });
  }

  private handleResponse(data: string) {
    try {
      const event = JSON.parse(data.toString());

      Logger.debugLog('OpenAI handleResponse', 'OpenAIRealtime', event.type);

      switch (event.type) {
        case 'session.created':
          this.sendData(this.getSessionUpdateEvent());
          break;

        case 'session.updated':
          this.emit('systemMessage', { event: 'ready' });

          if (this.connectResolve) {
            this.connectResolve(true);
            this.connectResolve = null;
            this.connectReject = null;
          }
          break;

        case 'response.output_audio.delta':
          if (event.delta) {
            this.emit('audio', { mimeType: 'audio/pcm', base64Data: event.delta });
          }
          break;

        case 'response.output_audio_transcript.delta':
          if (event.delta) {
            this.emit('textMessage', event.delta);
          }
          break;

        case 'response.output_text.delta':
          if (event.delta) {
            this.emit('textMessage', event.delta);
          }
          break;

        case 'response.done': {
          const output = event.response?.output;

          if (output && Array.isArray(output)) {
            const functionCalls = output
              .filter((item: any) => item.type === 'function_call')
              .map((item: any) => ({
                id: item.call_id,
                name: item.name,
                args: JSON.parse(item.arguments || '{}'),
              }));

            if (functionCalls.length > 0) {
              this.emit('systemMessage', { event: 'FunctionCall', count: functionCalls.length });
              this.emit('functionCalls', functionCalls);
            }
          }

          this.emit('systemMessage', { event: 'turnComplete' });
          break;
        }

        case 'input_audio_buffer.speech_started':
          this.emit('systemMessage', { event: 'speechStarted' });
          break;

        case 'input_audio_buffer.speech_stopped':
          this.emit('systemMessage', { event: 'speechStopped' });
          break;

        case 'error': {
          const errorMessage = event.error?.message || 'Unknown error';
          Logger.errorLog('API error', 'OpenAIRealtime', event.error);
          this.emit('systemMessage', { event: 'error', message: errorMessage });

          if (this.connectReject) {
            this.connectReject(new Error(errorMessage));
            this.connectResolve = null;
            this.connectReject = null;
          }
          break;
        }
      }
    } catch (error) {
      Logger.errorLog('Response parsing error', 'OpenAIRealtime', error);
      this.emit('systemMessage', { event: 'error', message: error });
    }
  }

  private triggerReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.isConnected = false;

    Logger.debugLog('Reconnecting to OpenAI Realtime...', 'OpenAIRealtime');

    setTimeout(async () => {
      try {
        await this.connect();
        Logger.debugLog('Reconnected', 'OpenAIRealtime');
        this.emit('systemMessage', { event: 'reconnected' });
      } catch (error) {
        Logger.errorLog('Reconnecting problem', 'OpenAIRealtime', error);
        this.emit('systemMessage', { event: 'error', message: 'Reconnecting problem' });
        this.isReconnecting = false;
      }
    }, 2000);
  }

  destroy() {
    this.isManualDisconnect = true;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default OpenAIRealtimeAI;
