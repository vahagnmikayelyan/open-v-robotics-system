import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import EventEmitter from 'node:events';
import path from 'path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { Logger } from '../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MicrophoneController extends EventEmitter {
  private recordProcess: ChildProcessWithoutNullStreams | null = null;

  constructor() {
    super();
  }

  startStream() {
    if (this.recordProcess) {
      return;
    }

    Logger.debugLog('Starting stream', 'Microphone');

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

    this.recordProcess.on('close', (_) => {
      this.recordProcess = null;
    });
  }

  stop() {
    if (this.recordProcess) {
      Logger.debugLog('Stoping stream', 'Microphone');
      this.recordProcess.kill();
      this.recordProcess = null;
    }
  }

  async testMicrophone({ duration = 5 }: { duration: number }): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, '..', `../audio-test/audio-test-T.wav`);

      Logger.debugLog(`Starting test recording (${duration} seconds): ${filePath}`, 'Microphone');

      const recordingProcess = spawn('pw-record', [
        '--target',
        'robot_echo_cancel_source',
        '--format',
        's16', // 16-bit (signed integer)
        '--rate',
        '16000', // 16 kHz
        '--channels',
        '1', // Mono
        filePath,
      ]);

      let errorOutput = '';

      recordingProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timer = setTimeout(() => {
        // SIGINT lets pw-record flush and finalize the WAV header before exiting
        recordingProcess.kill('SIGINT');
      }, duration * 1000);

      recordingProcess.on('close', (_) => {
        clearTimeout(timer);

        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
          Logger.debugLog(`Recorded file saved: ${filePath}`, 'Microphone');
          resolve({ m: 'microphone', a: 'testMicrophone', r: 'ok' });
        } else {
          Logger.errorLog(`Recording failed — pw-record output: ${errorOutput || '(none)'}`, 'Microphone');
          reject(new Error(`Recording failed — pw-record output: ${errorOutput || '(none)'}`));
        }
      });

      recordingProcess.on('error', (err) => {
        clearTimeout(timer);
        Logger.errorLog(`Can't start pw-record: ${err.message}`, 'Microphone');
        reject(new Error(`Can't start pw-record: ${err.message}`));
      });
    });
  }
}

export default MicrophoneController;
