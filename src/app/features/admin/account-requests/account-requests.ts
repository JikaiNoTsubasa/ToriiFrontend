import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AccountRequest } from '../../../core/services/admin-account-request.models';
import { AdminAccountRequestService } from '../../../core/services/admin-account-request.service';
import { InboxService } from '../../../core/services/inbox.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { RadialMenuService } from '../../../shared/radial-menu/radial-menu.service';
import { timeAgo } from '../../../shared/time-ago/time-ago';

/**
 * Accounts requested through the sign-up page. Approving activates the account; declining
 * removes the request and marks the account as declined (it cannot sign in).
 */
@Component({
  selector: 'app-admin-account-requests',
  imports: [Topbar, DatePipe],
  templateUrl: './account-requests.html',
})
export class AdminAccountRequests {
  private readonly service = inject(AdminAccountRequestService);
  private readonly notifications = inject(NotificationService);
  private readonly radial = inject(RadialMenuService);
  private readonly inbox = inject(InboxService);

  protected readonly requests = this.service.requests();
  protected readonly timeAgo = timeAgo;

  /** Id of the request being approved / declined. */
  protected readonly busyId = signal<number | null>(null);

  // --- Client-side filter (name or email) ---
  protected readonly search = signal('');
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const requests = this.requests.value();
    return term
      ? requests.filter((r) => r.displayName.toLowerCase().includes(term) || r.email.toLowerCase().includes(term))
      : requests;
  });

  constructor() {
    // Live: a new request notified while the page is open shows up at once.
    effect(() => {
      if (this.inbox.arrivals().some((n) => n.type === 'ACCOUNT_REQUESTED')) {
        untracked(() => this.requests.reload());
      }
    });
  }

  /** "a Singpass account" / "an account", for the confirmations. */
  private kind(request: AccountRequest): string {
    return request.accountType === 'SINGPASS' ? 'Singpass account' : 'account';
  }

  protected approve(request: AccountRequest): void {
    this.run(request, this.service.approve(request.id), 'Account approved', `${request.displayName} can now sign in.`);
  }

  protected reject(request: AccountRequest): void {
    if (!confirm(`Decline the ${this.kind(request)} request of "${request.displayName}" (${request.email})? They will not be able to sign in.`)) {
      return;
    }
    this.run(request, this.service.reject(request.id), 'Request declined', request.displayName);
  }

  protected onContextMenu(event: MouseEvent, request: AccountRequest): void {
    this.radial.open(event, [
      {
        label: 'Approve',
        icon: 'fas fa-check',
        run: () => this.approve(request),
      },
      {
        label: 'Decline',
        icon: 'fas fa-xmark',
        color: '#b00020',
        bg: '#b00020',
        run: () => this.reject(request),
      },
    ]);
  }

  /** Runs a decision, then reloads the list (errors are already notified). */
  private run(request: AccountRequest, decision: Observable<void>, title: string, detail: string): void {
    this.busyId.set(request.id);
    decision.subscribe({
      next: () => {
        this.busyId.set(null);
        this.notifications.success(title, detail);
        this.requests.reload();
        this.inbox.refresh();
      },
      error: () => {
        this.busyId.set(null);
        // 404: another administrator already decided; show the current list.
        this.requests.reload();
      },
    });
  }
}
