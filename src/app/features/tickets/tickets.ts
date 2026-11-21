import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClipboardService } from '../../core/clipboard/clipboard.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { TicketChannel, TicketListItem, UserRef } from '../../core/services/ticket.models';
import { TicketService } from '../../core/services/ticket.service';
import { TICKET_STATUS_META } from '../../core/services/ticket-status';
import { Topbar } from '../../layout/topbar/topbar';
import { RadialMenuService } from '../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../shared/side-panel/side-panel.service';
import { TicketStatusPanel } from './ticket-status-panel/ticket-status-panel';

/** Displayed row: ticket + counterpart customers (across all channels, deduplicated). */
interface TicketRow {
  ticket: TicketListItem;
  number: string;
  title: string;
  createdBy: UserRef | null;
  createdAt: string;
  customers: string;
  /** The user's channels of the ticket, each with its own status. */
  channels: TicketChannel[];
}

@Component({
  selector: 'app-tickets',
  imports: [Topbar, RouterLink, DatePipe],
  templateUrl: './tickets.html',
})
export class Tickets {
  private readonly clipboard = inject(ClipboardService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);
  private readonly notifications = inject(NotificationService);
  private readonly service = inject(TicketService);

  protected readonly statusMeta = TICKET_STATUS_META;

  protected readonly tickets = this.service.visibleTickets();

  /** Customers the user may send from (+ allowed targets); empty = cannot create tickets. */
  protected readonly sendOptions = this.service.sendOptions();
  protected readonly canCreate = computed(() => this.sendOptions.value().length > 0);

  protected readonly rows = computed<TicketRow[]>(() =>
    (this.tickets.hasValue() ? this.tickets.value() : []).map(toRow),
  );

  protected readonly count = computed(() => this.rows().length);

  /** Opens the status side panel, preselecting `channel` when given. */
  protected changeStatus(row: TicketRow, channel?: TicketChannel): void {
    this.panel
      .open<TicketListItem>(TicketStatusPanel, {
        title: 'Change status',
        subtitle: `${row.number} — ${row.title}`,
        inputs: { ticket: row.ticket, channelId: channel?.id ?? null },
      })
      .closed.then((updated) => {
        if (updated) {
          this.notifications.success('Status updated', updated.number);
          this.tickets.reload();
        }
      });
  }

  /** Radial action menu on right-click on a row. */
  protected onContextMenu(event: MouseEvent, row: TicketRow): void {
    this.radial.open(event, [
      {
        label: 'Change status',
        icon: 'fas fa-flag',
        disabled: row.channels.length === 0,
        run: () => this.changeStatus(row),
      },
      {
        label: 'Copy number',
        icon: 'fas fa-copy',
        run: () => this.clipboard.copy(row.number, { successTitle: 'Number copied', successDetail: row.number }),
      },
      {
        label: 'Copy number + title',
        icon: 'fas fa-copy',
        run: () => this.clipboard.copy(row.number + " - " + row.title, { successTitle: 'Number copied', successDetail: row.number + " - " + row.title}),
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
  // Counterpart = the other customer(s) of the channels, not the user's own one. When the
  // user belongs to every participant, show them all rather than an empty cell.
  const participants = ticket.channels.flatMap((ch) => ch.participants);
  const others = participants.filter((p) => !p.isOwn);
  const names = new Set((others.length ? others : participants).map((p) => p.customerName));
  return {
    ticket,
    number: ticket.number,
    title: ticket.title,
    createdBy: ticket.createdBy,
    createdAt: ticket.createdAt,
    customers: [...names].sort((a, b) => a.localeCompare(b)).join(', '),
    channels: ticket.channels,
  };
}
