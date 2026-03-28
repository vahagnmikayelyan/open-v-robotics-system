import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { Logger } from '../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SpeakerController {
  private playerProcess: ChildProcessWithoutNullStreams | null;

  constructor() {
    this.playerProcess = null;
  }
  startLiveStream() {
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
      Logger.errorLog(`Audio Player Error: ${data.toString()}`, 'Speaker - pw-play');
    });

    this.playerProcess.on('close', (code) => {
      Logger.debugLog(`Process exited with code ${code}`, 'Speaker - pw-play');
    });

    this.playerProcess.stdin.on('error', (err) => {
      Logger.debugLog('Error stdin', 'Speaker - pw-play', err);
    });

    return this.playerProcess.stdin;
  }

  async testSpeaker(channel = 'L') {
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
          reject(new Error(`pw-play exited with code ${code}`));
        }
      });
    });
  }

  stop() {
    if (this.playerProcess) {
      this.playerProcess.kill();
      this.playerProcess = null;
    }
  }
}

export default SpeakerController;
