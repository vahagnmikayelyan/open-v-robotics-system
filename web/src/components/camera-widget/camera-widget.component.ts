import { Component, signal, computed, ChangeDetectionStrategy, OnInit, output } from '@angular/core';
import { UiSocketService } from '../../services/ui-socket.service';
import { NgIf } from '@angular/common';
import { IModuleCommand } from '../../models/models';

@Component({
  selector: 'camera-widget',
  standalone: true,
  imports: [NgIf],
  templateUrl: './camera-widget.component.html',
  styleUrl: './camera-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraWidgetComponent implements OnInit {
  imageSrc = signal<string | null>(null);
  isStreaming = signal<boolean>(false);

  command = output<IModuleCommand>();

  constructor(private uiSocketService: UiSocketService) {}

  ngOnInit() {
    this.uiSocketService.onCameraData.subscribe((data) => {
      this.imageSrc.set(data);
    });
  }

  toggleStream() {
    this.isStreaming.update((v) => !v);
    this.command.emit({ module: 'camera', action: this.isStreaming() ? 'startStream' : 'stopStream', params: null });
    if (!this.isStreaming()) {
      this.imageSrc.set(null);
    }
  }

  takePhoto() {
    this.command.emit({ module: 'camera', action: 'takePhoto', params: null });
  }

  statusText = computed(() => {
    if (!this.isStreaming()) return 'OFFLINE';
    if (this.isStreaming()) return 'LIVE FEED';
    if (this.imageSrc()) return 'SNAPSHOT';
    return 'STANDBY';
  });
}
