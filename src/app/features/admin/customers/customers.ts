import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CustomerListItem } from '../../../core/services/admin-customer.models';
import { AdminCustomerService } from '../../../core/services/admin-customer.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { RadialMenuService } from '../../../shared/radial-menu/radial-menu.service';

@Component({
  selector: 'app-admin-customers',
  imports: [Topbar, RouterLink, DatePipe, FormField],
  templateUrl: './customers.html',
})
export class AdminCustomers {
  private readonly service = inject(AdminCustomerService);
  private readonly notifications = inject(NotificationService);
  private readonly radial = inject(RadialMenuService);
  private readonly router = inject(Router);

  protected readonly customers = this.service.customers();

  // --- Creation ---
  protected readonly creating = signal(false);
  private readonly model = signal({ name: '' });
  protected readonly createForm = form(this.model, (path) => {
    required(path.name, { message: 'Name is required.' });
    maxLength(path.name, 128, { message: '128 characters maximum.' });
  });

  protected async create(event: Event): Promise<void> {
    event.preventDefault();
    if (this.creating()) {
      return;
    }
    await submit(this.createForm, async () => {
      this.creating.set(true);
      try {
        const created = await firstValueFrom(this.service.create(this.model().name));
        this.notifications.success('Customer created', created.name);
        this.router.navigate(['/admin/customers', created.id]);
      } catch {
        // Error already notified by errorInterceptor.
      } finally {
        this.creating.set(false);
      }
      return undefined;
    });
  }

  // --- Row actions ---
  protected onContextMenu(event: MouseEvent, customer: CustomerListItem): void {
    this.radial.open(event, [
      {
        label: 'Open',
        icon: 'fas fa-arrow-right',
        run: () => this.router.navigate(['/admin/customers', customer.id]),
      },
      {
        label: 'Delete',
        icon: 'fas fa-trash',
        color: '#b00020',
        bg: '#b00020',
        run: () => this.remove(customer),
      },
    ]);
  }

  private remove(customer: CustomerListItem): void {
    if (!confirm(`Delete customer "${customer.name}"?`)) {
      return;
    }
    this.service.delete(customer.id).subscribe({
      next: () => {
        this.notifications.success('Customer deleted', customer.name);
        this.customers.reload();
      },
      error: () => {},
    });
  }
}
