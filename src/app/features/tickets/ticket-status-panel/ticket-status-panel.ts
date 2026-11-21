import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TicketChannel, TicketListItem } from '../../../core/services/ticket.models';
import { TicketService } from '../../../core/services/ticket.service';
import { TICKET_STATUS_META, TICKET_STATUSES, TicketStatus } from '../../../core/services/ticket-status';
import { SidePanelRef } from '../../../shared/side-panel/side-panel.models';

/**
 * Side panel changing the status of one channel of a ticket. When the user takes part
 * in several channels of the ticket, they pick the channel first (labelled by its
 * counterpart customer). Closes the panel with the updated {@link TicketListItem}.
 */
@Component({
  selector: 'app-ticket-status-panel',
  templateUrl: './ticket-status-panel.html',
})
export class TicketStatusPanel {
  private readonly service = inject(TicketService);
  protected readonly ref = inject<SidePanelRef<TicketListItem>>(SidePanelRef);

  readonly ticket = input.required<TicketListItem>();
  /** Channel to preselect (defaults to the ticket's first channel). */
  readonly channelId = input<number | null>(null);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly meta = TICKET_STATUS_META;
  protected readonly saving = signal(false);

  protected readonly selectedChannelId = linkedSignal(
    () => this.channelId() ?? this.ticket().channels[0]?.id ?? null,
  );
  protected readonly channel = computed(() =>
    this.ticket().channels.find((ch) => ch.id === this.selectedChannelId()),
  );

  /** Status being chosen, reset to the channel's current status when the channel changes. */
  protected readonly status = linkedSignal<TicketStatus | null>(() => this.channel()?.status ?? null);

  protected readonly unchanged = computed(() => this.status() === this.channel()?.status);

  protected counterpart(channel: TicketChannel): string {
    const others = channel.participants.filter((p) => !p.isOwn);
    return (others.length ? others : channel.participants).map((p) => p.customerName).join(', ');
  }

  protected selectChannel(value: string): void {
    this.selectedChannelId.set(Number(value));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const channel = this.channel();
    const status = this.status();
    if (this.saving() || !channel || !status || this.unchanged()) {
      return;
    }
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(
        this.service.updateChannelStatus(this.ticket().number, channel.id, status),
      );
      this.ref.close(updated);
    } catch {
      // Error already notified by errorInterceptor; the panel stays open.
    } finally {
      this.saving.set(false);
    }
  }
}
