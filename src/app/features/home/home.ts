import { DatePipe, PercentPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { InboxNotification } from '../../core/services/inbox.models';
import { InboxService } from '../../core/services/inbox.service';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_META,
  TICKET_TYPE_META,
  TicketPriority,
} from '../../core/services/ticket-classification';
import { TicketListItem } from '../../core/services/ticket.models';
import { TicketService } from '../../core/services/ticket.service';
import { DONE_TICKET_STATUSES, TICKET_STATUS_META } from '../../core/services/ticket-status';
import { timeAgo } from '../../shared/time-ago/time-ago';

/** Notifications shown on the dashboard. */
const NOTIFICATION_COUNT = 5;

/** One bar of the activity chart. */
interface ActivityBar {
  date: string;
  count: number;
  /** Height in % of the tallest bar. */
  height: number;
  /** Axis label, e.g. "17" (and the month under the first day / the 1st). */
  day: string;
  month: string | null;
  weekend: boolean;
  isToday: boolean;
}

/**
 * Home dashboard: greeting + quick actions, KPI tiles, what needs an answer, the latest
 * notifications and tickets, the message activity of the last 14 days and the breakdowns of
 * open tickets by priority and channels by status. Refreshes itself when a notification
 * arrives.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, PercentPipe],
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly inbox = inject(InboxService);

  protected readonly dashboard = inject(DashboardService).dashboard();
  protected readonly sendOptions = inject(TicketService).sendOptions();
  protected readonly canCreate = computed(() => this.sendOptions.value().length > 0);

  protected readonly statusMeta = TICKET_STATUS_META;
  protected readonly typeMeta = TICKET_TYPE_META;
  protected readonly priorityMeta = TICKET_PRIORITY_META;
  protected readonly timeAgo = timeAgo;

  protected readonly firstName = computed(() => this.auth.user()?.displayName.split(/\s+/)[0] ?? '');
  protected readonly greeting = greetingFor(new Date().getHours());
  protected readonly today = new Date();

  // --- Notifications ---
  protected readonly unreadCount = this.inbox.unreadCount;
  protected readonly notifications = signal<InboxNotification[]>([]);
  protected readonly notificationsLoaded = signal(false);

  // --- Activity (messages per day) ---
  protected readonly activity = computed<ActivityBar[]>(() => {
    const days = this.dashboard.value()?.messagesPerDay ?? [];
    const max = Math.max(1, ...days.map((d) => d.count));
    const todayIso = new Date().toISOString().slice(0, 10);
    return days.map((d, i) => {
      const date = new Date(`${d.date}T00:00:00Z`);
      const dayOfMonth = date.getUTCDate();
      return {
        date: d.date,
        count: d.count,
        height: (d.count / max) * 100,
        day: String(dayOfMonth),
        month: i === 0 || dayOfMonth === 1 ? date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) : null,
        weekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
        isToday: d.date === todayIso,
      };
    });
  });
  protected readonly activityMax = computed(() => Math.max(0, ...this.activity().map((b) => b.count)));

  // --- Open tickets by priority (one segmented bar, most urgent first) ---
  protected readonly priorities = computed(() => {
    const counts = this.dashboard.value()?.openTicketsByPriority ?? [];
    const total = counts.reduce((sum, p) => sum + p.count, 0);
    return {
      total,
      items: TICKET_PRIORITIES.map((priority: TicketPriority) => {
        const count = counts.find((p) => p.priority === priority)?.count ?? 0;
        return { priority, count, share: total ? count / total : 0 };
      }),
    };
  });

  // --- Channels by status (open statuses first, then the final ones) ---
  protected readonly statuses = computed(() => {
    const rows = this.dashboard.value()?.channelsByStatus ?? [];
    const max = Math.max(1, ...rows.map((r) => r.count));
    return rows.map((r) => ({
      ...r,
      width: (r.count / max) * 100,
      done: DONE_TICKET_STATUSES.includes(r.status),
    }));
  });

  constructor() {
    this.loadNotifications();

    // Live: a new notification refreshes the counters, lists and charts.
    effect(() => {
      if (this.inbox.arrivals().length) {
        untracked(() => {
          this.dashboard.reload();
          this.loadNotifications();
        });
      }
    });
  }

  protected counterpart(ticket: TicketListItem): string {
    const participants = ticket.channels.flatMap((ch) => ch.participants);
    const others = participants.filter((p) => !p.isOwn);
    return [...new Set((others.length ? others : participants).map((p) => p.customerName))].sort().join(', ');
  }

  protected async markAllRead(): Promise<void> {
    try {
      await this.inbox.markAllRead();
      const now = new Date().toISOString();
      this.notifications.update((items) => items.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    } catch {
      // Already notified by errorInterceptor.
    }
  }

  protected openNotification(notification: InboxNotification): void {
    this.inbox.markRead(notification).catch(() => {});
  }

  private async loadNotifications(): Promise<void> {
    try {
      this.notifications.set((await firstValueFrom(this.inbox.list(false, NOTIFICATION_COUNT))).items);
    } catch {
      // Already notified by errorInterceptor.
    } finally {
      this.notificationsLoaded.set(true);
    }
  }
}

function greetingFor(hour: number): string {
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
