import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiSocketService } from '../services/ui-socket.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less'
})
export class AppComponent implements OnInit {
    private uiSocketService = inject(UiSocketService);

    ngOnInit() {
        this.uiSocketService.init();
    }
}
