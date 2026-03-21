import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import EventEmitter from 'node:events';
import path from 'path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MicrophoneController extends EventEmitter {
  private recordProcess: ChildProcessWithoutNullStreams | null;

  constructor() {
    super();
    this.recordProcess = null;
  }

  startStream() {
    if (this.recordProcess) {
      console.warn('[Microphone] Streaming already started.');
      return;
    }

    console.log('[Microphone] Initialization streaming');

    this.recordProcess = spawn('pw-record', [
      '--target',
      'robot_echo_cancel_source',
      '--raw', // Raw PCM stream without WAV heders
      '--format',
      's16', // 16-bit (signed integer)
      '--rate',
      '16000', // 16 kHz
      '--channels',
      '1', // Mono
      '-', // stream to stdout
    ]);

    let audioBuffer = Buffer.alloc(0);

    const CHUNK_SIZE = 4000;

    this.recordProcess.stdout.on('data', (chunk) => {
      audioBuffer = Buffer.concat([audioBuffer, chunk]);

      while (audioBuffer.length >= CHUNK_SIZE) {
        const chunkToSend = audioBuffer.subarray(0, CHUNK_SIZE);
        audioBuffer = audioBuffer.subarray(CHUNK_SIZE);
        this.emit('audioChunk', chunkToSend.toString('base64'));
      }
    });

    this.recordProcess.stderr.on('data', (_) => {
      // Ignoring logs
    });

    this.recordProcess.on('close', (code) => {
      console.log(`[Microphone] Streaming stopped (Code: ${code})`);
      this.recordProcess = null;
    });
  }

  stop() {
    if (this.recordProcess) {
      this.recordProcess.kill();
      this.recordProcess = null;
      console.log('[Microphone] Streaming canceled.');
    }
  }

  async testMicrophone(): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, '..', `../audio-test/audio-test-T.wav`);

      console.log(`[Microphone] Starting test recording (5 seconds): ${filePath}`);

      const recordingProcess = spawn('pw-record', [filePath]);

      let errorOutput = '';

      recordingProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timer = setTimeout(() => {
        console.log('[Microphone] Stop recording after 5 second...');
        recordingProcess.kill('SIGTERM');
      }, 5000);

      recordingProcess.on('close', (_) => {
        clearTimeout(timer);

        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
          console.log(`[Microphone] Recorded file saved: ${filePath}`);
          resolve({ m: 'speaker', a: 'testMicrophone', r: 'ok' });
        } else {
          reject(new Error(`Recording error: ${errorOutput}`));
        }
      });

      recordingProcess.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Can't start pw-record: ${err.message}`));
      });
    });
  }
}

export default MicrophoneController;
