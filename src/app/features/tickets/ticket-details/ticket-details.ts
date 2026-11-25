import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, untracked, viewChildren } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClipboardService } from '../../../core/clipboard/clipboard.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import {
  FileRef,
  TicketActivity,
  TicketChannelDetail,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  draftInternalThread,
} from '../../../core/services/ticket.models';
import { InboxService } from '../../../core/services/inbox.service';
import { TicketService } from '../../../core/services/ticket.service';
import { TICKET_STATUS_META } from '../../../core/services/ticket-status';
import { Topbar } from '../../../layout/topbar/topbar';
import { htmlToText } from '../../../shared/rich-text-editor/html-text';
import { SidePanelService } from '../../../shared/side-panel/side-panel.service';
import { TICKET_PRIORITY_META, TICKET_TYPE_META } from '../../../core/services/ticket-classification';
import { TicketClassificationPanel } from '../ticket-classification-panel/ticket-classification-panel';
import { TicketStatusPanel } from '../ticket-status-panel/ticket-status-panel';
import { buildFeed, ChannelThread, sideNames } from './channel-thread/channel-thread';
import { ForwardOutcome, ForwardPanel } from './forward-panel/forward-panel';
import { OpenChannelPanel } from './open-channel-panel/open-channel-panel';

/** Length of the last-message preview in the channel list. */
const PREVIEW_LENGTH = 90;

/**
 * Ticket details (`/tickets/:number?channel=:id`). What is shown depends on who looks:
 * only the channels one of the user's customers takes part in, plus the internal thread of
 * each of those customers (private to its members; created by its first message). A channel
 * list (inbox-like) sits next to the selected conversation; each thread keeps its own
 * composer and draft, and the selection lives in the URL. Leaving with an unsent draft asks
 * for confirmation.
 */
@Component({
  selector: 'app-ticket-details',
  imports: [Topbar, RouterLink, DatePipe, ChannelThread],
  templateUrl: './ticket-details.html',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class TicketDetails {
  private readonly service = inject(TicketService);
  private readonly panel = inject(SidePanelService);
  private readonly notifications = inject(NotificationService);
  private readonly clipboard = inject(ClipboardService);
  private readonly router = inject(Router);
  private readonly inbox = inject(InboxService);

  /** `:number` route parameter. */
  readonly number = input.required<string>();
  /** `?channel=` query parameter (selected channel id). */
  readonly channel = input<string | undefined>();

  protected readonly meta = TICKET_STATUS_META;
  protected readonly typeMeta = TICKET_TYPE_META;
  protected readonly priorityMeta = TICKET_PRIORITY_META;

  protected readonly ticket = this.service.ticket(() => this.number());
  protected readonly sendOptions = this.service.sendOptions();

  /** Exchange channels with other customers. */
  protected readonly exchanges = computed(() => (this.ticket.value()?.channels ?? []).filter((ch) => !ch.isInternal));

  /** One internal thread per own customer: the saved one, or a draft until its first message. */
  protected readonly internalThreads = computed(() => {
    const ticket = this.ticket.value();
    if (!ticket) {
      return [];
    }
    const saved = ticket.channels.filter((ch) => ch.isInternal);
    return ticket.ownCustomers.map(
      (customer) => saved.find((ch) => ch.participants[0]?.customerId === customer.id) ?? draftInternalThread(customer),
    );
  });

  /** Every thread of the page: internal ones first, then the exchanges. */
  protected readonly channels = computed(() => [...this.internalThreads(), ...this.exchanges()]);
  protected readonly multiChannel = computed(() => this.channels().length > 1);
  protected readonly canOpenChannel = computed(() => this.sendOptions.value().length > 0);

  /** Customers of the user taking part in the ticket. */
  protected readonly ownCustomers = computed(() => (this.ticket.value()?.ownCustomers ?? []).map((c) => c.name).join(', '));

  /**
   * Selected thread: from the URL when valid (a draft internal thread `-customerId` maps to the
   * saved one once created), otherwise the first exchange.
   */
  protected readonly selectedId = linkedSignal(() => {
    const requested = Number(this.channel());
    const channels = this.channels();
    const match =
      channels.find((ch) => ch.id === requested) ??
      (requested < 0 ? channels.find((ch) => ch.isInternal && ch.participants[0]?.customerId === -requested) : undefined);
    return match?.id ?? this.exchanges()[0]?.id ?? channels[0]?.id ?? null;
  });

  private readonly threads = viewChildren(ChannelThread);

  constructor() {
    // Viewing a channel reads its notifications.
    effect(() => {
      const id = this.selectedId();
      if (id !== null && id > 0) {
        this.inbox.markChannelRead(id).catch(() => {});
      }
    });

    // A new message in one of this ticket's channels: reload to show it (drafts live in the
    // threads, which are kept since they are tracked by channel id).
    effect(() => {
      const number = this.number();
      const arrived = this.inbox.arrivals().filter((n) => n.ticketNumber === number);
      if (arrived.length) {
        untracked(() => {
          this.ticket.reload();
          // Already on screen: the selected channel's notification is read at once.
          const selected = this.selectedId();
          if (arrived.some((n) => n.channelId === selected)) {
            this.inbox.markChannelRead(selected!).catch(() => {});
          }
        });
      }
    });
  }

  protected select(channel: TicketChannelDetail): void {
    this.selectedId.set(channel.id);
    this.router.navigate([], { queryParams: { channel: channel.id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected counterpart(channel: TicketChannelDetail): string {
    return channel.isInternal ? `${sideNames(channel, true)} (internal)` : sideNames(channel, false) || sideNames(channel, true);
  }

  /** Preview of the latest feed entry (message or activity) for the channel list. */
  protected preview(channel: TicketChannelDetail): string {
    const last = buildFeed(channel).at(-1);
    if (!last) {
      return channel.isInternal ? 'Private notes, only for your team.' : 'Nothing yet.';
    }
    if (last.kind === 'activity') {
      return describeActivity(last.activity, this.meta);
    }
    const message = last.message;
    const comment = htmlToText(message.content);
    const text = message.forwarded ? `↪ ${comment || htmlToText(message.forwarded.content)}` : comment;
    const author = message.isMine ? 'You' : message.author.displayName;
    return `${author}: ${text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH) + '…' : text}`;
  }

  protected lastActivity(channel: TicketChannelDetail): string | null {
    return buildFeed(channel).at(-1)?.at ?? null;
  }

  protected onChanged(): void {
    this.ticket.reload();
  }

  /** Opens the type / priority side panel. */
  protected editClassification(): void {
    const ticket = this.ticket.value();
    if (!ticket) {
      return;
    }
    this.panel
      .open<TicketListItem>(TicketClassificationPanel, {
        title: 'Type & priority',
        subtitle: `${ticket.number} — ${ticket.title}`,
        inputs: { ticket },
      })
      .closed.then((updated) => {
        if (updated) {
          this.notifications.success('Ticket updated', updated.number);
          this.ticket.reload();
        }
      });
  }

  protected changeStatus(channel: TicketChannelDetail): void {
    const ticket = this.ticket.value();
    if (!ticket) {
      return;
    }
    this.panel
      .open<TicketListItem>(TicketStatusPanel, {
        title: 'Change status',
        subtitle: `${ticket.number} — channel with ${this.counterpart(channel)}`,
        inputs: { ticket, channelId: channel.id },
      })
      .closed.then((updated) => {
        if (updated) {
          this.notifications.success('Status updated', `Channel with ${this.counterpart(channel)}`);
          this.ticket.reload();
        }
      });
  }

  /** Opens the forward panel for a message or a file; then shows the channel it landed in. */
  protected forward(channel: TicketChannelDetail, item: { message: TicketMessage } | { file: FileRef }): void {
    const ticket = this.ticket.value();
    if (!ticket) {
      return;
    }
    const isFile = 'file' in item;
    this.panel
      .open<ForwardOutcome>(ForwardPanel, {
        title: isFile ? 'Forward file' : 'Forward message',
        subtitle: `From the channel with ${this.counterpart(channel)}`,
        width: '560px',
        inputs: {
          ticket,
          channel,
          message: isFile ? null : item.message,
          file: isFile ? item.file : null,
          options: this.sendOptions.value(),
        },
      })
      .closed.then((result) => {
        if (!result) {
          return;
        }
        this.ticket.reload();
        // The URL drives the selection; a created channel resolves once the reload lands.
        this.router.navigate([], {
          queryParams: { channel: result.channelId },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        const what = isFile ? 'File' : 'Message';
        this.notifications.success(result.channelCreated ? `${what} forwarded to a new channel` : `${what} forwarded`);
      });
  }

  protected openChannel(): void {
    const ticket = this.ticket.value();
    if (!ticket) {
      return;
    }
    const knownIds = new Set(ticket.channels.map((ch) => ch.id));
    this.panel
      .open<TicketDetail>(OpenChannelPanel, {
        title: 'Open a channel',
        subtitle: `${ticket.number} — ${ticket.title}`,
        width: '640px',
        inputs: { ticket, options: this.sendOptions.value() },
      })
      .closed.then((updated) => {
        if (updated) {
          this.ticket.set(updated);
          const opened = updated.channels.find((ch) => !knownIds.has(ch.id));
          if (opened) {
            this.select(opened);
            this.notifications.success('Channel opened', `With ${this.counterpart(opened)}`);
          }
        }
      });
  }

  protected copyNumber(): void {
    const ticket = this.ticket.value();
    if (ticket) {
      this.clipboard.copy(ticket.number, { successTitle: 'Number copied', successDetail: ticket.number });
    }
  }

  /** Used by the route's canDeactivate guard: confirms before dropping unsent replies. */
  canLeave(): boolean {
    return !this.hasDrafts() || confirm('You have an unsent reply. Leave this ticket and discard it?');
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasDrafts()) {
      event.preventDefault();
    }
  }

  private hasDrafts(): boolean {
    return this.threads().some((thread) => thread.hasDraft());
  }
}

/** One-line summary of an activity event (channel list preview). */
function describeActivity(activity: TicketActivity, meta: typeof TICKET_STATUS_META): string {
  const actor = activity.actor.displayName;
  switch (activity.type) {
    case 'CHANNEL_OPENED':
      return `${actor} opened this channel`;
    case 'STATUS_CHANGED':
      return `${actor} set the status to ${activity.toStatus ? meta[activity.toStatus].label : '—'}`;
    case 'FILE_UPLOADED':
      return `${actor} uploaded ${activity.file?.fileName ?? 'a file'}`;
    case 'FILE_FORWARDED':
      return `${actor} forwarded ${activity.file?.fileName ?? 'a file'}`;
    case 'TYPE_CHANGED':
      return `${actor} set the type to ${activity.toType ? TICKET_TYPE_META[activity.toType].label : '—'}`;
    case 'PRIORITY_CHANGED':
      return `${actor} set the priority to ${activity.toPriority ? TICKET_PRIORITY_META[activity.toPriority].label : '—'}`;
  }
}
