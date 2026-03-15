import { Component, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { UiSocketService } from '../../services/ui-socket.service';
import { NgIf } from '@angular/common';

enum CameraCommands {
  takePhoto = 'takePhoto',
  startStream = 'startStream',
  stopStream = 'stopStream'
}

@Component({
  selector: 'camera-widget',
  standalone: true,
  imports: [NgIf],
  templateUrl: './camera-widget.component.html',
  styleUrl: './camera-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CameraWidgetComponent implements OnInit {
  imageSrc = signal<string | null>(null);
  isStreaming = signal<boolean>(false);

  constructor(private uiSocketService: UiSocketService) {
  }

  ngOnInit() {
    this.uiSocketService.onCameraData.subscribe((data) => {
      this.imageSrc.set(data);
    });
  }

  toggleStream() {
    this.isStreaming.update(v => !v);
    this.uiSocketService.sendCameraCommand(this.isStreaming() ? CameraCommands.startStream : CameraCommands.stopStream);
    if (!this.isStreaming()) {
      this.imageSrc.set(null);
    }
  }

  takePhoto() {
    this.uiSocketService.sendCameraCommand(CameraCommands.takePhoto);
  }

  statusText = computed(() => {
    if (!this.isStreaming()) return 'OFFLINE';
    if (this.isStreaming()) return 'LIVE FEED';
    if (this.imageSrc()) return 'SNAPSHOT';
    return 'STANDBY';
  });
}
