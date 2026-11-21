import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  TICKET_TYPE_META,
  TICKET_TYPE_OPTIONS,
  TicketPriority,
  TicketType,
} from '../../../core/services/ticket-classification';
import { TicketListItem } from '../../../core/services/ticket.models';
import { TicketService } from '../../../core/services/ticket.service';
import { RichSelect } from '../../../shared/rich-select/rich-select';
import { SidePanelRef } from '../../../shared/side-panel/side-panel.models';
import { PriorityPicker } from '../priority-picker/priority-picker';

/**
 * Side panel changing the type and priority of a ticket (shared by all its channels).
 * Closes the panel with the updated {@link TicketListItem}.
 */
@Component({
  selector: 'app-ticket-classification-panel',
  imports: [PriorityPicker, RichSelect],
  templateUrl: './ticket-classification-panel.html',
})
export class TicketClassificationPanel {
  private readonly service = inject(TicketService);
  protected readonly ref = inject<SidePanelRef<TicketListItem>>(SidePanelRef);

  readonly ticket = input.required<{ number: string; type: TicketType; priority: TicketPriority }>();

  protected readonly typeOptions = TICKET_TYPE_OPTIONS;
  protected readonly typeMeta = TICKET_TYPE_META;
  protected readonly saving = signal(false);

  protected readonly type = linkedSignal(() => this.ticket().type);
  protected readonly priority = linkedSignal(() => this.ticket().priority);
  protected readonly unchanged = computed(
    () => this.type() === this.ticket().type && this.priority() === this.ticket().priority,
  );

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving() || this.unchanged()) {
      return;
    }
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(
        this.service.updateClassification(this.ticket().number, this.type(), this.priority()),
      );
      this.ref.close(updated);
    } catch {
      // Error already notified by errorInterceptor; the panel stays open.
    } finally {
      this.saving.set(false);
    }
  }
}
