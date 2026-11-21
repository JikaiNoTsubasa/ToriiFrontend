import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/notifications/notification.service';

/**
 * Global toast container. Mount it only once (in app.html): it shows
 * the notifications queued by the NotificationService.
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
