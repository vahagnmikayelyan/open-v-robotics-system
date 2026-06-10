import { defineModule, IModuleDeps } from '../types/module.js';
import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '../services/logger.js';

export default defineModule({
  id: 'telegram',
  name: 'Telegram Bot',
  description: 'Integrates Telegram Bot for two-way communication with AI',
  category: 'service',

  moduleConfigs: [
    {
      key: 'bot_token',
      label: 'Bot Token',
      hint: 'API Token from @BotFather',
      type: 'password',
      defaultValue: '',
    },
    {
      key: 'allowed_chat_id',
      label: 'Allowed Chat ID',
      hint: 'Your Telegram Chat ID',
      type: 'text',
      defaultValue: '',
    },
  ],

  getTools: () => [
    {
      module: 'telegram',
      name: 'telegram_sendMessage',
      description: 'Send a text message to the authorized Telegram user',
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'The message text to send',
          isRequired: true,
        },
      ],
    },
    {
      module: 'telegram',
      name: 'telegram_sendLocation',
      description: 'Send a location to the authorized Telegram user',
      parameters: [
        {
          name: 'latitude',
          type: 'number',
          description: 'Latitude of the location',
          isRequired: true,
        },
        {
          name: 'longitude',
          type: 'number',
          description: 'Longitude of the location',
          isRequired: true,
        },
      ],
    },
  ],

  create(deps: IModuleDeps) {
    return new TelegramModule(deps);
  },
});

class TelegramModule {
  private bot: TelegramBot | null = null;

  constructor(private deps: IModuleDeps) {}

  start() {
    const token = this.deps.getConfig('bot_token') as string;
    const allowedChatIdStr = this.deps.getConfig('allowed_chat_id') as string;

    if (!token) {
      Logger.errorLog('Telegram token is not configured', 'Telegram');
      this.deps.emitSystemError('Telegram token is not configured in Settings');
      return;
    }

    if (this.bot) {
      this.stop();
    }

    Logger.debugLog('Starting Telegram Bot...', 'Telegram');
    try {
      this.bot = new TelegramBot(token, { polling: true });

      // Handle text messages and photos
      this.bot.on('message', async (msg) => {
        const chatId = msg.chat.id.toString();

        if (allowedChatIdStr && chatId !== allowedChatIdStr.trim()) {
          Logger.debugLog(`Ignored message from unauthorized chat: ${chatId}`, 'Telegram');
          return;
        }

        if (msg.text) {
          Logger.debugLog(`Received text from Telegram: ${msg.text}`, 'Telegram');
          this.deps.emitTextToAI(msg.text);
        } else if (msg.photo && msg.photo.length > 0) {
          try {
            Logger.debugLog('Received photo from Telegram', 'Telegram');
            const photo = msg.photo[msg.photo.length - 1]; // Largest photo
            const fileId = photo.file_id;

            if (this.bot) {
              const fileLink = await this.bot.getFileLink(fileId);
              const response = await fetch(fileLink);
              if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
              
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              this.deps.emitImageToAI(buffer, 'image/jpeg');
              Logger.debugLog('Photo successfully downloaded and sent to AI', 'Telegram');
            }
          } catch (e) {
            Logger.errorLog('Failed to process photo from Telegram', 'Telegram', e);
            this.deps.emitSystemError('Failed to process photo from Telegram');
          }
        }
      });

      this.bot.on('polling_error', (error) => {
        Logger.errorLog('Telegram Polling Error', 'Telegram', error);
      });
    } catch (e) {
      Logger.errorLog('Failed to initialize Telegram Bot', 'Telegram', e);
      this.deps.emitSystemError('Failed to initialize Telegram Bot');
    }
  }

  stop() {
    if (this.bot) {
      Logger.debugLog('Stopping Telegram Bot...', 'Telegram');
      try {
        this.bot.stopPolling();
      } catch (e) {
        Logger.errorLog('Error stopping Telegram Bot polling', 'Telegram', e);
      }
      this.bot = null;
    }
  }

  async sendMessage(params: { text: string }): Promise<{ success: boolean }> {
    const allowedChatIdStr = this.deps.getConfig('allowed_chat_id') as string;
    if (!this.bot || !allowedChatIdStr) {
      Logger.errorLog('Cannot send message: bot not started or chat ID not set', 'Telegram');
      return { success: false };
    }

    try {
      await this.bot.sendMessage(allowedChatIdStr.trim(), params.text);
      return { success: true };
    } catch (error) {
      Logger.errorLog('Failed to send message to Telegram', 'Telegram', error);
      return { success: false };
    }
  }

  async sendLocation(params: { latitude: number; longitude: number }): Promise<{ success: boolean }> {
    const allowedChatIdStr = this.deps.getConfig('allowed_chat_id') as string;
    if (!this.bot || !allowedChatIdStr) {
      Logger.errorLog('Cannot send location: bot not started or chat ID not set', 'Telegram');
      return { success: false };
    }

    try {
      await this.bot.sendLocation(allowedChatIdStr.trim(), params.latitude, params.longitude);
      return { success: true };
    } catch (error) {
      Logger.errorLog('Failed to send location to Telegram', 'Telegram', error);
      return { success: false };
    }
  }
}
