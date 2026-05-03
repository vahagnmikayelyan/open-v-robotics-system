import { ChildProcessWithoutNullStreams, exec, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { defineModule, IModuleDeps } from '../types/module.js';
import config from '../config.js';
import { Logger } from '../services/logger.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineModule({
  id: 'speaker',
  name: 'Speakers',
  description: 'Allows the AI to speak using stereo speakers.',
  category: 'media',

  getTools: () => [],

  create(_deps: IModuleDeps) {
    return new SpeakerController();
  },
});

class SpeakerController {
  private playerProcess: ChildProcessWithoutNullStreams | null = null;

  constructor() { }

  startStream() {
    if (this.playerProcess) {
      return null;
    }

    Logger.debugLog('Starting stream', 'Speaker');

    this.playerProcess = spawn('pw-play', [
      '--target',
      'robot_echo_cancel_sink',
      '--playback',
      '--raw',
      '--format',
      's16',
      '--rate',
      '24000',
      '--channels',
      '1',
      '-', // Read from stdin
    ]);

    this.playerProcess.stderr.on('data', (data) => {
      Logger.errorLog(`Audio Player Error: ${data.toString()}`, 'Speaker');
    });

    this.playerProcess.on('close', (code) => {
      Logger.debugLog(`Process exited with code ${code}`, 'Speaker');
    });

    this.playerProcess.stdin.on('error', (err) => {
      Logger.debugLog('Error stdin', 'Speaker', err);
    });

    return !!this.playerProcess.stdin;
  }

  playStream(buffer: Buffer) {
    if (!this.playerProcess) {
      return null;
    }

    this.playerProcess.stdin.write(buffer);
  }

  stopStream() {
    if (this.playerProcess) {
      Logger.debugLog('Stoping stream', 'Speaker');
      this.playerProcess.kill();
      this.playerProcess = null;
    }
  }

  async testSpeaker({ channel = 'L' }: { channel: string }) {
    const filePath = path.resolve(__dirname, '..', `../audio-test/audio-test-${channel}.wav`);

    if (!fs.existsSync(filePath)) {
      Logger.errorLog(`Error: File not found at ${filePath}`, 'Speaker');
      return;
    }

    return new Promise((resolve, reject) => {
      const play = spawn('pw-play', ['--target', 'robot_echo_cancel_sink', filePath]);

      play.on('close', (code) => {
        if (code === 0) {
          resolve({ m: 'speaker', a: 'testSpeaker', r: 'ok' });
        } else {
          Logger.errorLog(`pw-play exited with code ${code}`, 'Speaker');
          reject(new Error(`pw-play exited with code ${code}`));
        }
      });
    });
  }

  private async getSinkId(): Promise<string> {
    const { stdout } = await execAsync('wpctl status');
    const regex = new RegExp(`(\\d+)\\.\\s+${config.speakerSinkName}`);
    const match = stdout.match(regex);
    if (!match) throw new Error(`Sink "${config.speakerSinkName}" not found in wpctl status`);
    return match[1];
  }

  async getVolume(): Promise<{ module: string; volume: number; muted: boolean }> {
    const id = await this.getSinkId();
    const { stdout } = await execAsync(`wpctl get-volume ${id}`);
    // stdout: "Volume: 0.80" or "Volume: 0.80 [MUTED]"
    const match = stdout.match(/Volume:\s+([\d.]+)/);
    if (!match) throw new Error('Cannot parse volume from wpctl output');
    // Map wpctl range [MIN..MAX] → UI range [0..100]
    const wpctlRaw = parseFloat(match[1]);
    const uiVolume = Math.round(Math.max(0, Math.min(100, (wpctlRaw - config.speakerMinWpctl) / (config.speakerMaxWpctl - config.speakerMinWpctl) * 100)));
    const muted = stdout.includes('[MUTED]');
    Logger.debugLog(`Current volume: wpctl=${wpctlRaw} → ui=${uiVolume}% muted=${muted}`, 'Speaker');
    return { module: 'speaker', volume: uiVolume, muted };
  }

  async setVolume({ volume }: { volume: number }): Promise<{ module: string; volume: number; muted: boolean }> {
    const id = await this.getSinkId();
    // Map UI range [0..100] → wpctl range [MIN..MAX]
    const uiClamped = Math.max(0, Math.min(100, volume));
    const wpctlValue = (config.speakerMinWpctl + (uiClamped / 100) * (config.speakerMaxWpctl - config.speakerMinWpctl)).toFixed(2);
    await execAsync(`wpctl set-volume ${id} ${wpctlValue}`);
    Logger.debugLog(`Volume set: ui=${uiClamped}% → wpctl=${wpctlValue}`, 'Speaker');
    return { module: 'speaker', volume: uiClamped, muted: false };
  }

  async toggleMute(): Promise<{ module: string; volume: number; muted: boolean }> {
    const id = await this.getSinkId();
    await execAsync(`wpctl set-mute ${id} toggle`);
    return this.getVolume();
  }
}
