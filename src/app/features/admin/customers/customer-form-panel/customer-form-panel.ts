import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CustomerDetail } from '../../../../core/services/admin-customer.models';
import { AdminCustomerService } from '../../../../core/services/admin-customer.service';
import { SidePanelRef } from '../../../../shared/side-panel/side-panel.models';

/**
 * Side panel form creating a customer, or renaming one when `customer` is given.
 * Closes the panel with the saved {@link CustomerDetail}.
 */
@Component({
  selector: 'app-customer-form-panel',
  imports: [FormField],
  templateUrl: './customer-form-panel.html',
})
export class CustomerFormPanel {
  private readonly service = inject(AdminCustomerService);
  protected readonly ref = inject<SidePanelRef<CustomerDetail>>(SidePanelRef);

  /** Customer to edit; `null` creates a new one. */
  readonly customer = input<{ id: number; name: string } | null>(null);

  protected readonly isEdit = computed(() => this.customer() !== null);
  protected readonly saving = signal(false);

  /** Form model, reset whenever the edited customer changes. */
  private readonly model = linkedSignal(() => ({ name: this.customer()?.name ?? '' }));
  protected readonly form = form(this.model, (path) => {
    required(path.name, { message: 'Name is required.' });
    maxLength(path.name, 128, { message: '128 characters maximum.' });
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    await submit(this.form, async () => {
      const name = this.model().name;
      const customer = this.customer();
      this.saving.set(true);
      try {
        const saved = await firstValueFrom(
          customer ? this.service.rename(customer.id, name) : this.service.create(name),
        );
        this.ref.close(saved);
      } catch {
        // Error already notified by errorInterceptor; the panel stays open.
      } finally {
        this.saving.set(false);
      }
      return undefined;
    });
  }
}
