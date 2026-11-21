import { Component, computed, inject } from '@angular/core';
import { ClipboardService } from '../../core/clipboard/clipboard.service';
import { TicketListItem } from '../../core/services/ticket.models';
import { TicketService } from '../../core/services/ticket.service';
import { Topbar } from '../../layout/topbar/topbar';
import { RadialMenuService } from '../../shared/radial-menu/radial-menu.service';

/** Displayed row: ticket + involved customers (across all channels, deduplicated). */
interface TicketRow {
  number: string;
  title: string;
  customers: string;
  channelCount: number;
}

@Component({
  selector: 'app-tickets',
  imports: [Topbar],
  templateUrl: './tickets.html',
})
export class Tickets {
  private readonly clipboard = inject(ClipboardService);
  private readonly radial = inject(RadialMenuService);

  protected readonly tickets = inject(TicketService).visibleTickets();

  protected readonly rows = computed<TicketRow[]>(() =>
    (this.tickets.hasValue() ? this.tickets.value() : []).map(toRow),
  );

  protected readonly count = computed(() => this.rows().length);

  /** Radial action menu on right-click on a row. */
  protected onContextMenu(event: MouseEvent, row: TicketRow): void {
    this.radial.open(event, [
      {
        label: 'Copy number',
        icon: 'fas fa-copy',
        run: () => this.clipboard.copy(row.number, { successTitle: 'Number copied', successDetail: row.number }),
      },
      {
        label: 'Refresh',
        icon: 'fas fa-rotate',
        run: () => this.tickets.reload(),
      },
    ]);
  }
}

function toRow(ticket: TicketListItem): TicketRow {
  const names = new Set(
    ticket.channels.flatMap((ch) => ch.participants.map((p) => p.customerName)),
  );
  return {
    number: ticket.number,
    title: ticket.title,
    customers: [...names].sort((a, b) => a.localeCompare(b)).join(', '),
    channelCount: ticket.channels.length,
  };
}
