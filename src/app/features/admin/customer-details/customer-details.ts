import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { UserDto } from '../../../core/auth/auth.models';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CustomerDetail } from '../../../core/services/admin-customer.models';
import { AdminCustomerService } from '../../../core/services/admin-customer.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { EditableInputText } from '../../../shared/editable-input-text/editable-input-text';

/** Delay (ms) between the last keystroke and the user search. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-admin-customer-details',
  imports: [Topbar, RouterLink, DatePipe, EditableInputText],
  templateUrl: './customer-details.html',
})
export class AdminCustomerDetails {
  private readonly service = inject(AdminCustomerService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** `:id` route parameter (withComponentInputBinding). */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly customer = this.service.customer(() => this.id());

  /** Name edited inline; resynchronized every time the customer loads. */
  protected readonly name = signal('');

  /** Request in progress (rename, member add/remove, delete). */
  protected readonly busy = signal(false);

  // --- Search for users to add ---
  protected readonly search = signal('');
  private readonly query = signal('');
  protected readonly searchResults = this.service.searchUsers(() => this.query());

  /** Results excluding current members. */
  protected readonly candidates = computed(() => {
    const memberIds = new Set(this.customer.value()?.members.map((m) => m.id) ?? []);
    return this.searchResults.value().filter((u) => !memberIds.has(u.id));
  });

  constructor() {
    effect(() => {
      const customer = this.customer.value();
      if (customer) {
        this.name.set(customer.name);
      }
    });

    // Debounce: the search only fires after a pause in typing.
    effect((onCleanup) => {
      const value = this.search().trim();
      const timer = setTimeout(() => this.query.set(value), SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected rename(name: string): void {
    this.mutate(this.service.rename(this.id(), name), 'Customer renamed');
  }

  protected addMember(user: UserDto): void {
    this.mutate(this.service.addMember(this.id(), user.id), 'Member added', user.displayName);
  }

  protected removeMember(user: UserDto): void {
    if (!confirm(`Remove ${user.displayName} from this customer?`)) {
      return;
    }
    this.mutate(this.service.removeMember(this.id(), user.id), 'Member removed', user.displayName);
  }

  protected remove(): void {
    const customer = this.customer.value();
    if (!customer || !confirm(`Delete customer "${customer.name}"?`)) {
      return;
    }
    this.busy.set(true);
    this.service.delete(customer.id).subscribe({
      next: () => {
        this.notifications.success('Customer deleted', customer.name);
        this.router.navigate(['/admin/customers']);
      },
      error: () => this.busy.set(false),
    });
  }

  /** Applies a write: the details returned by the API replace the local value. */
  private mutate(request: Observable<CustomerDetail>, title: string, detail?: string): void {
    this.busy.set(true);
    request.subscribe({
      next: (updated) => {
        this.customer.set(updated);
        this.busy.set(false);
        this.notifications.success(title, detail);
      },
      error: () => {
        this.busy.set(false);
        // Revert to the server name if the rename failed (error already notified).
        this.name.set(this.customer.value()?.name ?? '');
      },
    });
  }
}
