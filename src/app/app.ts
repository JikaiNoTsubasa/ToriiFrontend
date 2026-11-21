import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notifications } from './shared/notifications/notifications';
import { RadialMenu } from './shared/radial-menu/radial-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Notifications, RadialMenu],
  templateUrl: './app.html',
})
export class App {}
