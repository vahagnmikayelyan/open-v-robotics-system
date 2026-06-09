import { WebSocket } from 'ws';
import EventEmitter from 'events';
import { IAIControllerParams, IAIModelController } from '../../types/ai.js';
import { IToolDeclaration } from '../../types/tool.js';
import { Logger } from '../../services/logger.js';

class GeminiLiveAI extends EventEmitter implements IAIModelController {
  private readonly url: string;
  private readonly model: string;
  private readonly voice: string;
  private readonly language: string;
  private readonly systemInstruction: string;
  private readonly tools: IToolDeclaration[];
  private readonly isGemini3: boolean;

  private isConnected: boolean = false;
  private isReconnecting: boolean = false;
  private isManualDisconnect: boolean = false;
  private sessionHandle: string | null = null;
  private hasTriggeredInitialResponse: boolean = false;

  private ws: WebSocket | null = null;

  constructor({ model, apiKey, voice, language, systemInstruction, tools }: IAIControllerParams) {
    super();

    this.url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    this.ws = null;

    this.model = model;
    this.voice = voice;
    this.language = language ?? '';
    this.systemInstruction = systemInstruction;
    this.tools = tools;
    this.isGemini3 = model.includes('gemini-3');
  }

  private convertToTools() {
    return this.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT',
          properties: tool.parameters.reduce((acc: Record<string, any>, parameter) => {
            const prop: Record<string, any> = {
              type: parameter.type.toUpperCase(),
              description: parameter.description,
            };
            if (parameter.type.toUpperCase() === 'ARRAY') {
              prop['items'] = { type: (parameter.items?.type ?? 'string').toUpperCase() };
            }
            acc[parameter.name] = prop;
            return acc;
          }, {}),
          required: tool.parameters.filter((parameter) => parameter.isRequired).map((parameter) => parameter.name),
        },
      };
    });
  }

  private getSetupMessage() {
    const hasSearch = !this.isGemini3;

    const tools: any[] = [];
    if (hasSearch) {
      tools.push({ googleSearch: {} });
    }
    if (this.tools && this.tools.length > 0) {
      tools.push({ functionDeclarations: this.convertToTools() });
    }

    return {
      setup: {
        model: `models/${this.model}`,
        systemInstruction: {
          parts: [{ text: this.systemInstruction }],
        },
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: this.language,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voice,
              },
            },
          },
        },
        // Enabling unlimit context window
        contextWindowCompression: {
          slidingWindow: {},
        },
        // If exists stored session id, restoring
        sessionResumption: this.sessionHandle ? { handle: this.sessionHandle } : {},
        // Adding tools conditionally inline if available
        ...(tools.length > 0 ? { tools } : {}),
      },
    };
  }

  private sendData(data: object) {
    this.isConnected && this.ws?.send(JSON.stringify(data));
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isReconnecting = false;

        Logger.debugLog('Gemini Live API connected', 'GeminiLiveAPI');
        this.emit('systemMessage', { event: 'open' });

        // Sending system instructions and other setup
        this.sendData(this.getSetupMessage());
        resolve(true);
      });

      this.ws.on('message', (data: string) => {
        this.handleResponse(data);
      });

      this.ws.on('close', (code, reason) => {
        this.isConnected = false;
        Logger.debugLog('Gemini Live API connection closed', 'GeminiLiveAPI', { code, reason: reason.toString() });
        this.emit('systemMessage', { event: 'close', code, reason: reason.toString() });

        if (!this.isManualDisconnect && !this.isReconnecting) {
          this.triggerReconnect();
        }
      });

      this.ws.on('error', (error) => {
        Logger.errorLog('WebSocket error', 'GeminiLiveAPI', error);
        reject(error);
      });
    });
  }

  sendText(text: string) {
    if (this.isGemini3) {
      this.sendData({
        realtimeInput: {
          text: text,
        },
      });
    } else {
      this.sendData({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: text }] }],
          turnComplete: true,
        },
      });
    }
  }

  sendAudio(pcmOrBase64: Buffer | string, mimeType = 'audio/pcm;rate=16000') {
    const base64Data = Buffer.isBuffer(pcmOrBase64) ? pcmOrBase64.toString('base64') : pcmOrBase64;

    if (this.isGemini3) {
      this.sendData({
        realtimeInput: {
          audio: { mimeType: mimeType, data: base64Data },
        },
      });
    } else {
      this.sendData({
        realtimeInput: {
          mediaChunks: [{ mimeType: mimeType, data: base64Data }],
        },
      });
    }
  }

  sendImage(imageBytesOrBase64: Buffer | string, mimeType = 'image/jpeg') {
    const base64Data = Buffer.isBuffer(imageBytesOrBase64) ? imageBytesOrBase64.toString('base64') : imageBytesOrBase64;

    if (this.isGemini3) {
      this.sendData({
        realtimeInput: {
          video: { mimeType: mimeType, data: base64Data },
        },
      });
    } else {
      this.sendData({
        clientContent: {
          turns: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
          turnComplete: true,
        },
      });
    }
  }

  sendToolResponses(responsesArray: unknown[]) {
    if (responsesArray.length === 0) return;

    this.sendData({
      toolResponse: {
        functionResponses: responsesArray,
      },
    });
  }

  private handleResponse(data: string) {
    try {
      const response = JSON.parse(data.toString());

      Logger.debugLog('Gemini handleResponse', 'GeminiLiveAPI', response);

      // Session token update event
      if (response.sessionResumptionUpdate) {
        const update = response.sessionResumptionUpdate;
        if (update.resumable && update.newHandle) {
          this.sessionHandle = update.newHandle;
          Logger.debugLog('Session new handle token', 'GeminiLiveAPI');
          this.emit('systemMessage', { event: 'sessionResumptionUpdate', id: this.sessionHandle });
        }
      }

      // Warning about session timeout
      if (response.goAway) {
        Logger.debugLog(`Closing soon connection warning: ${response.goAway.timeLeft}`, 'GeminiLiveAPI');
        this.emit('systemMessage', { event: 'goAway', time: response.goAway.timeLeft });

        if (!this.isReconnecting && this.ws) {
          this.ws.close();
        }
      }

      if (response.serverContent && response.serverContent.modelTurn) {
        const parts = response.serverContent.modelTurn.parts;

        for (const part of parts) {
          // Text event
          if (part.text) {
            this.emit('textMessage', part.text);
          }

          // Media event
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'audio/pcm;rate=24000';
            const base64Data = part.inlineData.data;

            if (mimeType.startsWith('image/')) {
              this.emit('image', { mimeType, base64Data });
            } else if (mimeType.startsWith('audio/')) {
              this.emit('audio', { mimeType, base64Data });
            }
          }
        }
      }

      // Grounding / Google Search Metadata
      if (response.serverContent && response.serverContent.groundingMetadata) {
        const metadata = response.serverContent.groundingMetadata;
        const queries = metadata.webSearchQueries || [];
        const chunks = metadata.groundingChunks || [];

        const sources = chunks
          .map((chunk: any) => {
            const web = chunk.web;
            if (web) {
              return {
                title: web.title || '',
                uri: web.uri || '',
              };
            }
            if (chunk.uri || chunk.title) {
              return {
                title: chunk.title || '',
                uri: chunk.uri || '',
              };
            }
            return null;
          })
          .filter(Boolean);

        this.emit('systemMessage', {
          event: 'googleSearch',
          queries,
          sources,
        });
      }

      // Tools call
      if (response.toolCall && response.toolCall.functionCalls) {
        const functionCalls = response.toolCall.functionCalls;
        this.emit('systemMessage', { event: 'FunctionCall', count: functionCalls.length });
        this.emit('functionCalls', functionCalls);
      }

      // Setup complete
      if (response.setupComplete) {
        this.emit('systemMessage', { event: 'ready' });

        if (!this.hasTriggeredInitialResponse && !this.sessionHandle) {
          if (this.isGemini3) {
            // For Gemini 3 we send an empty text space to trigger generation
            this.sendData({ realtimeInput: { text: ' ' } });
          } else {
            this.sendData({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: ' ' }] }],
                turnComplete: true,
              },
            });
          }
          this.hasTriggeredInitialResponse = true;
        }
      }

      // Complete response generation
      if (response.serverContent && response.serverContent.turnComplete) {
        this.emit('systemMessage', { event: 'turnComplete' });
      }
    } catch (error) {
      Logger.errorLog('Gemini response parsing error', 'GeminiLiveAPI', error);
      this.emit('systemMessage', { event: 'error', message: error });
    }
  }

  private triggerReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.isConnected = false;

    Logger.debugLog(`Reconnecting to Gemini, saved handle token: ${this.sessionHandle}`, 'GeminiLiveAPI');

    setTimeout(async () => {
      try {
        await this.connect();
        Logger.debugLog('Reconnected', 'GeminiLiveAPI');
        this.emit('systemMessage', { event: 'reconnected' });
      } catch (error) {
        Logger.errorLog('Reconnecting problem', 'GeminiLiveAPI', error);
        this.emit('systemMessage', { event: 'error', message: 'Reconnecting problem' });
        this.isReconnecting = false;
      }
    }, 2000);
  }

  destroy() {
    this.isManualDisconnect = true;
    this.ws && this.ws.close();
  }
}

export default GeminiLiveAI;
