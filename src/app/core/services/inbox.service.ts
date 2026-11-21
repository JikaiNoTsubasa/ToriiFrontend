import { HttpClient } from '@angular/common/http';
import { DestroyRef, DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { skipErrorNotification } from '../http/problem-details';
import { NotificationService } from '../notifications/notification.service';
import { InboxList, InboxNotification, UnreadSummary } from './inbox.models';

/** Polling period of the unread summary (ms). */
const POLL_MS = 30_000;
/** At most this many toasts for one batch of new notifications. */
const MAX_TOASTS = 3;
/** `(3) Torii`: unread count prefix of the browser tab title. */
const TITLE_PREFIX = /^\(\d+\)\s/;

/**
 * In-app notifications of the signed-in user (`/api/notifications`): polls the unread summary
 * while signed in (and when the tab comes back to the foreground), shows a toast — with a
 * link to the channel — for each new reply, mirrors the unread count in the tab title, and
 * publishes the new arrivals so an open ticket can refresh itself.
 */
@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(NotificationService);
  private readonly title = inject(Title);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  private readonly _arrivals = signal<readonly InboxNotification[]>([]);
  /** Latest batch of notifications that arrived since the previous poll (for live refreshes). */
  readonly arrivals = this._arrivals.asReadonly();

  /**
   * Latest unread time already seen (epoch ms, 0 = none); `undefined` until the first poll, so
   * the backlog found at sign-in is counted but not toasted. Compared as numbers: the API's
   * ISO strings trim trailing zeros, so they do not sort as text.
   */
  private latestSeen: number | undefined;
  private polling = false;

  constructor() {
    const document = inject(DOCUMENT);

    effect((onCleanup) => {
      if (!this.auth.isAuthenticated()) {
        this.latestSeen = undefined;
        this._unreadCount.set(0);
        return;
      }
      this.refresh();
      const timer = setInterval(() => this.refresh(), POLL_MS);
      onCleanup(() => clearInterval(timer));
    });

    // Back to the tab: catch up at once instead of waiting for the next tick.
    const onVisible = () => document.visibilityState === 'visible' && this.refresh();
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', onVisible));

    effect(() => {
      const count = this._unreadCount();
      const base = this.title.getTitle().replace(TITLE_PREFIX, '');
      this.title.setTitle(count > 0 ? `(${count}) ${base}` : base);
    });
  }

  /** Latest notifications, newest first. */
  list(unreadOnly = false, take = 20): Observable<InboxList> {
    return this.http.get<InboxList>(this.baseUrl, { params: { unreadOnly, take } });
  }

  async markRead(notification: InboxNotification): Promise<void> {
    if (notification.readAt) {
      return;
    }
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/${notification.id}/read`, null));
    this._unreadCount.update((n) => Math.max(0, n - 1));
  }

  /**
   * Called when the user views a channel: its notifications are read. Always sent (the count
   * may not be loaded yet when a ticket is opened right after sign-in).
   */
  async markChannelRead(channelId: number): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/channels/${channelId}/read`, null, skipErrorNotification()),
    );
    await this.refresh();
  }

  async markAllRead(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/read-all`, null));
    this._unreadCount.set(0);
  }

  /** Polls the unread summary; announces what is newer than the latest seen. */
  async refresh(): Promise<void> {
    if (this.polling || !this.auth.isAuthenticated()) {
      return;
    }
    this.polling = true;
    try {
      const summary = await firstValueFrom(
        this.http.get<UnreadSummary>(`${this.baseUrl}/unread`, skipErrorNotification()),
      );
      this._unreadCount.set(summary.count);

      const previous = this.latestSeen;
      const latest = summary.latestAt ? Date.parse(summary.latestAt) : 0;
      this.latestSeen = Math.max(latest, previous ?? 0);
      if (previous !== undefined && latest > previous) {
        await this.announceSince(previous);
      }
    } catch {
      // Offline / API restarting: silently retried at the next tick.
    } finally {
      this.polling = false;
    }
  }

  private async announceSince(previous: number): Promise<void> {
    const { items } = await firstValueFrom(this.list(true, 10));
    const fresh = items.filter((n) => Date.parse(n.createdAt) > previous);
    if (!fresh.length) {
      return;
    }
    this._arrivals.set(fresh);
    for (const n of fresh.slice(0, MAX_TOASTS)) {
      const action = n.isForward ? 'forwarded a message' : 'replied';
      this.toasts.info(`${n.actor.displayName} ${action} — ${n.ticketNumber}`, n.preview || n.ticketTitle, {
        label: 'Open',
        commands: ['/tickets', n.ticketNumber],
        queryParams: { channel: n.channelId },
      });
    }
    if (fresh.length > MAX_TOASTS) {
      this.toasts.info(`${fresh.length - MAX_TOASTS} more new notification(s)`);
    }
  }
}
