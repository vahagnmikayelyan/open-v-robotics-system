import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import EventEmitter from 'events';
import { defineModule, IModuleDeps } from '../types/module.js';
import { Logger } from '../services/logger.js';

export default defineModule({
  id: 'camera',
  name: 'Camera',
  description: 'Enables using Camera.',
  category: 'media',

  tools: [
    {
      module: 'camera',
      name: 'camera_takePhoto',
      description:
        'Capture a still JPEG photo using camera module. Default resolution is 1280x720. Maximum resolution is 4608x2592 (12MP). Omit width/height or use 0 for defaults.',
      parameters: [
        {
          name: 'width',
          type: 'integer',
          description: 'Photo width in pixels (default 1280, max 4608); omit or 0 for default',
          isRequired: false,
        },
        {
          name: 'height',
          type: 'integer',
          description: 'Photo height in pixels (default 720, max 2592); omit or 0 for default',
          isRequired: false,
        },
      ],
    },
  ],

  create(_deps: IModuleDeps) {
    return new CameraController();
  },
});

const SOI = Buffer.from([0xff, 0xd8]); // Start JPEG
const EOI = Buffer.from([0xff, 0xd9]); // End JPEG

class CameraController extends EventEmitter {
  private videoWidth: number = 1280;
  private videoHeight: number = 720;
  private videoFramerate: number = 30;
  private photoWidth: number = 1280;
  private photoHeight: number = 720;
  private videoProcess: ChildProcessWithoutNullStreams | null = null;
  private isBusy: boolean = false;
  private buffer: Buffer<ArrayBuffer> = Buffer.alloc(0);

  constructor() {
    super();
  }

  startStream() {
    if (this.isBusy || this.videoProcess) return;

    Logger.debugLog('Starting stream', 'Camera');

    this.videoProcess = spawn('rpicam-vid', [
      '--codec',
      'mjpeg',
      '--width',
      this.videoWidth.toString(),
      '--height',
      this.videoHeight.toString(),
      '--framerate',
      this.videoFramerate.toString(),
      '--autofocus-mode',
      'continuous', // Need for Arducam 3
      '--nopreview',
      '--timeout',
      '0',
      '--output',
      '-',
    ]);

    this.videoProcess.stdout.on('data', (chunk: Buffer) => this.handleData(chunk));

    this.videoProcess.stderr.on('data', () => {
      // Ignoring libcamera logs
    });

    this.videoProcess.on('close', (_) => {
      // maybe need restart
    });
  }

  stopStream() {
    return new Promise((resolve) => {
      if (this.videoProcess) {
        Logger.debugLog('Stoping stream', 'Camera');
        this.videoProcess.kill();
        this.videoProcess = null;
        this.buffer = Buffer.alloc(0); // Clear buffer
        setTimeout(resolve, 200);
      } else {
        resolve(true);
      }
    });
  }

  private handleData(chunk: Buffer) {
    if (this.isBusy) return;

    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (true) {
      const start = this.buffer.indexOf(SOI);
      const end = this.buffer.indexOf(EOI, start);

      if (start !== -1 && end !== -1 && end > start) {
        const frame = this.buffer.subarray(start, end + 2);
        this.emit('frame', frame); // Send frame
        this.buffer = this.buffer.subarray(end + 2);
      } else {
        break;
      }
    }
  }

  async takePhoto({ width = 0, height = 0 }: { width: number; height: number }) {
    const videoProcessing = !!this.videoProcess;

    Logger.debugLog('Take photo', 'Camera');

    await this.stopStream();
    this.isBusy = true;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const photoProcess = spawn('rpicam-still', [
        '--width',
        (width || this.photoWidth).toString(),
        '--height',
        (height || this.photoHeight).toString(),
        '--autofocus-on-capture',
        '-t',
        '2000',
        '--encoding',
        'jpg',
        '--output',
        '-',
      ]);

      photoProcess.stdout.on('data', (chunk) => chunks.push(chunk));

      photoProcess.on('close', () => {
        const fullPhoto = Buffer.concat(chunks);

        this.isBusy = false;
        videoProcessing && this.startStream();

        if (fullPhoto.length > 0) {
          this.emit('frame', fullPhoto);
          resolve(fullPhoto);
        } else {
          reject(new Error('Photo is empty, camera problem'));
        }
      });

      photoProcess.on('error', (err) => {
        this.isBusy = false;
        videoProcessing && this.startStream();
        reject(err);
      });
    });
  }
}
