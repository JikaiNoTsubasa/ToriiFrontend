import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CustomerDetail, CustomerListItem } from '../../../core/services/admin-customer.models';
import { AdminCustomerService } from '../../../core/services/admin-customer.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { RadialMenuService } from '../../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../../shared/side-panel/side-panel.service';
import { CustomerFormPanel } from './customer-form-panel/customer-form-panel';

@Component({
  selector: 'app-admin-customers',
  imports: [Topbar, RouterLink, DatePipe],
  templateUrl: './customers.html',
})
export class AdminCustomers {
  private readonly service = inject(AdminCustomerService);
  private readonly notifications = inject(NotificationService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);
  private readonly router = inject(Router);

  protected readonly customers = this.service.customers();

  // --- Create / edit (side panel) ---
  protected openCreate(): void {
    this.panel
      .open<CustomerDetail>(CustomerFormPanel, { title: 'New customer' })
      .closed.then((created) => {
        if (created) {
          this.notifications.success('Customer created', created.name);
          this.customers.reload();
        }
      });
  }

  protected openEdit(customer: CustomerListItem): void {
    this.panel
      .open<CustomerDetail>(CustomerFormPanel, {
        title: 'Edit customer',
        subtitle: customer.name,
        inputs: { customer },
      })
      .closed.then((saved) => {
        if (saved) {
          this.notifications.success('Customer updated', saved.name);
          this.customers.reload();
        }
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
        label: 'Edit',
        icon: 'fas fa-pen',
        run: () => this.openEdit(customer),
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
