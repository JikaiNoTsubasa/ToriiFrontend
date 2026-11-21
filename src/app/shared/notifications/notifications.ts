import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/notifications/notification.service';

/**
 * Conteneur global de toasts. À monter une seule fois (dans app.html) : il
 * affiche les notifications empilées par le NotificationService.
 */
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
})
export class Notifications {
  private readonly service = inject(NotificationService);

  protected readonly items = this.service.items;

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
