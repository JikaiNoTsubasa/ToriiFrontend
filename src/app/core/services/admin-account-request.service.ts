import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { skipErrorNotification } from '../http/problem-details';
import { AccountRequest } from './admin-account-request.models';
import { InboxService } from './inbox.service';

/**
 * Accounts requested through the sign-up page, waiting for an administrator
 * (`/api/admin/account-requests`, ADMIN only). Keeps the pending count for the menu badge:
 * loaded at sign-in, refreshed when a new request is notified and after each decision.
 */
@Injectable({ providedIn: 'root' })
export class AdminAccountRequestService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/admin/account-requests`;

  private readonly _pendingCount = signal(0);
  /** Pending requests (0 for non-admins). */
  readonly pendingCount = this._pendingCount.asReadonly();

  constructor() {
    const inbox = inject(InboxService);

    effect(() => {
      if (this.auth.isAdmin()) {
        untracked(() => this.refreshCount());
      } else {
        this._pendingCount.set(0);
      }
    });

    effect(() => {
      if (inbox.arrivals().some((n) => n.type === 'ACCOUNT_REQUESTED')) {
        untracked(() => this.refreshCount());
      }
    });
  }

  /** Pending requests, oldest first. */
  requests(): HttpResourceRef<AccountRequest[]> {
    return httpResource<AccountRequest[]>(() => this.baseUrl, { defaultValue: [] });
  }

  approve(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/approve`, null).pipe(tap(() => this.refreshCount()));
  }

  reject(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/reject`, null).pipe(tap(() => this.refreshCount()));
  }

  refreshCount(): void {
    this.http.get<number>(`${this.baseUrl}/count`, skipErrorNotification()).subscribe({
      next: (count) => this._pendingCount.set(count),
      error: () => {}, // background call: the badge keeps its last value
    });
  }
}
