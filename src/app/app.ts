import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notifications } from './shared/notifications/notifications';
import { RadialMenu } from './shared/radial-menu/radial-menu';
import { SidePanel } from './shared/side-panel/side-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Notifications, RadialMenu, SidePanel],
  templateUrl: './app.html',
})
export class App {}
