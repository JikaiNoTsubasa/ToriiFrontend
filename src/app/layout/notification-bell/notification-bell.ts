import { Component, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InboxNotification, notificationAction, notificationTarget } from '../../core/services/inbox.models';
import { InboxService } from '../../core/services/inbox.service';
import { timeAgo } from '../../shared/time-ago/time-ago';

/**
 * Bell of the sidebar: unread badge, and a panel listing the latest notifications (loaded
 * when opened). Clicking one marks it read and opens its channel. Closes on outside click
 * or Escape.
 */
@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.html',
  host: {
    class: 'notification-bell',
    '(document:click)': 'closeOnOutsideClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class NotificationBell {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inbox = inject(InboxService);
  private readonly router = inject(Router);

  protected readonly unreadCount = this.inbox.unreadCount;
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<InboxNotification[]>([]);
  protected readonly timeAgo = timeAgo;
  protected readonly action = notificationAction;

  protected async toggle(): Promise<void> {
    if (this.open()) {
      this.open.set(false);
      return;
    }
    this.open.set(true);
    await this.load();
  }

  protected async openNotification(notification: InboxNotification): Promise<void> {
    this.open.set(false);
    const target = notificationTarget(notification);
    this.router.navigate(target.commands, { queryParams: target.queryParams });
    try {
      await this.inbox.markRead(notification);
    } catch {
      // Already notified by errorInterceptor.
    }
  }

  protected async markAllRead(): Promise<void> {
    try {
      await this.inbox.markAllRead();
      const now = new Date().toISOString();
      this.items.update((items) => items.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    } catch {
      // Already notified by errorInterceptor.
    }
  }

  protected closeOnOutsideClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set((await firstValueFrom(this.inbox.list())).items);
    } catch {
      // Already notified by errorInterceptor; the panel shows what it had.
    } finally {
      this.loading.set(false);
    }
  }
}
