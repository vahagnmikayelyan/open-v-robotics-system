import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import EventEmitter from 'events';

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

  startVideo() {
    if (this.isBusy || this.videoProcess) return;

    console.log('Running Camera');

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

    this.videoProcess.on('close', (code) => {
      // maybe need restart
    });
  }

  stopVideo() {
    return new Promise((resolve) => {
      if (this.videoProcess) {
        this.videoProcess.kill();
        this.videoProcess = null;
        this.buffer = Buffer.alloc(0); // Clear buffer
        setTimeout(resolve, 200);
      } else {
        resolve(true);
      }
    });
  }

  handleData(chunk: Buffer) {
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

  async takePhoto(width = 0, height = 0) {
    const videoProcessing = !!this.videoProcess;

    await this.stopVideo();
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
        videoProcessing && this.startVideo();

        if (fullPhoto.length > 0) {
          resolve(fullPhoto);
        } else {
          reject(new Error('Photo is empty, camera problem'));
        }
      });

      photoProcess.on('error', (err) => {
        this.isBusy = false;
        videoProcessing && this.startVideo();
        reject(err);
      });
    });
  }
}

export default CameraController;
