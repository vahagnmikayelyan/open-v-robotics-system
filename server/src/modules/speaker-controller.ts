import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SpeakerController {
  private playerProcess: ChildProcessWithoutNullStreams | null;

  constructor() {
    this.playerProcess = null;
  }

  async testSpeaker(channel = 'L') {
    const filePath = path.resolve(__dirname, '..', `../audio-test/audio-test-${channel}.ogg`);

    if (!fs.existsSync(filePath)) {
      console.error(`[Speaker] Error: File not found at ${filePath}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const play = spawn('pw-play', ['--target', 'echo_cancel_sink', filePath]);

      play.on('close', (code) => {
        if (code === 0) {
          resolve({ m: 'speaker', a: 'testSpeaker', r: 'ok' });
        } else {
          reject(new Error(`pw-play exited with code ${code}`));
        }
      });
    });
  }

  startLiveStream() {
    // Config: --format s16 (16-bit), --rate 24000 (standard for Gemini), --channels 1 (mono)
    this.playerProcess = spawn('pw-play', [
      '--target',
      'echo_cancel_sink',
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
      console.error(`[pw-play] Audio Player Error: ${data.toString()}`);
    });

    this.playerProcess.on('close', (code) => {
      console.log(`[pw-play] Process exited with code ${code}`);
    });

    this.playerProcess.stdin.on('error', (err) => {
      console.error('[Speaker] Error stdin:', err);
    });

    return this.playerProcess.stdin;
  }

  stop() {
    if (this.playerProcess) {
      this.playerProcess.kill();
      this.playerProcess = null;
    }
  }
}

export default SpeakerController;
