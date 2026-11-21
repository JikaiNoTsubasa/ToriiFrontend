import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AdminCustomerService } from '../../../../core/services/admin-customer.service';
import { TicketEdge } from '../../../../core/services/admin-ticket-edge.models';
import { AdminTicketEdgeService } from '../../../../core/services/admin-ticket-edge.service';
import { SidePanelRef } from '../../../../shared/side-panel/side-panel.models';

/** Form model; `<select>` values are customer ids as strings ('' = none). */
interface EdgeForm {
  source: string;
  target: string;
  isActive: boolean;
}

/**
 * Side panel form creating a ticket edge, or updating one when `edge` is given.
 * Closes the panel with the saved {@link TicketEdge}.
 */
@Component({
  selector: 'app-ticket-edge-form-panel',
  imports: [FormField],
  templateUrl: './ticket-edge-form-panel.html',
})
export class TicketEdgeFormPanel {
  private readonly service = inject(AdminTicketEdgeService);
  protected readonly ref = inject<SidePanelRef<TicketEdge>>(SidePanelRef);

  protected readonly customers = inject(AdminCustomerService).customers();

  /** Edge to edit; `null` creates a new one. */
  readonly edge = input<TicketEdge | null>(null);

  protected readonly isEdit = computed(() => this.edge() !== null);
  protected readonly saving = signal(false);

  /** Form model, reset whenever the edited edge changes. */
  private readonly model = linkedSignal<EdgeForm>(() => {
    const edge = this.edge();
    return {
      source: edge ? String(edge.sourceCustomerId) : '',
      target: edge ? String(edge.targetCustomerId) : '',
      isActive: edge?.isActive ?? true,
    };
  });
  protected readonly form = form(this.model, (path) => {
    required(path.source, { message: 'Select the source customer.' });
    required(path.target, { message: 'Select the target customer.' });
    validate(path.target, ({ value, valueOf }) =>
      value() && value() === valueOf(path.source)
        ? { kind: 'sameCustomer', message: 'The target must differ from the source.' }
        : undefined,
    );
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    await submit(this.form, async () => {
      const { source, target, isActive } = this.model();
      const sourceCustomerId = Number(source);
      const targetCustomerId = Number(target);
      const edge = this.edge();
      this.saving.set(true);
      try {
        const saved = await firstValueFrom(
          edge
            ? this.service.update(edge.id, { sourceCustomerId, targetCustomerId, isActive })
            : this.service.create(sourceCustomerId, targetCustomerId),
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
