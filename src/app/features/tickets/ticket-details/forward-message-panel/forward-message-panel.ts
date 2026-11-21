import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import {
  ForwardMessageRequest,
  ForwardResult,
  TicketChannelDetail,
  TicketDetail,
  TicketMessage,
  TicketSendOption,
} from '../../../../core/services/ticket.models';
import { TicketService } from '../../../../core/services/ticket.service';
import { TICKET_STATUS_META } from '../../../../core/services/ticket-status';
import { isBlankHtml } from '../../../../shared/rich-text-editor/html-text';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor/rich-text-editor';
import { SidePanelRef } from '../../../../shared/side-panel/side-panel.models';
import { sideNames } from '../channel-thread/channel-thread';

/** A place the message can be forwarded to. */
interface Destination {
  key: string;
  label: string;
  hint: string;
  /** True for a channel that will be created by the forward. */
  isNew: boolean;
  request: Omit<ForwardMessageRequest, 'comment'>;
}

/**
 * Side panel forwarding a message to another channel of the ticket: one of the user's
 * other channels, or a new channel towards a customer allowed by the ticket edges (created
 * by the forward). An optional comment goes with it. Closes with the {@link ForwardResult}.
 */
@Component({
  selector: 'app-forward-message-panel',
  imports: [DatePipe, FormField, RichTextEditorComponent],
  templateUrl: './forward-message-panel.html',
})
export class ForwardMessagePanel {
  private readonly service = inject(TicketService);
  protected readonly ref = inject<SidePanelRef<ForwardResult>>(SidePanelRef);

  readonly ticket = input.required<TicketDetail>();
  /** Channel the message comes from. */
  readonly channel = input.required<TicketChannelDetail>();
  readonly message = input.required<TicketMessage>();
  /** Send options of the user (customers they belong to + allowed targets). */
  readonly options = input.required<TicketSendOption[]>();

  protected readonly meta = TICKET_STATUS_META;
  protected readonly saving = signal(false);
  protected readonly selected = signal<string | null>(null);

  private readonly model = signal({ comment: '' });
  protected readonly form = form(this.model);

  /** What is shown as quoted: the forwarded original when forwarding a forward without comment. */
  protected readonly quoted = computed(() => {
    const message = this.message();
    const source = message.forwarded && isBlankHtml(message.content) ? message.forwarded : message;
    return {
      author: source.author.displayName,
      customer: source.authorCustomerName,
      content: source.content,
      createdAt: source.createdAt,
    };
  });

  /** The user's other channels on this ticket. */
  protected readonly existing = computed<Destination[]>(() =>
    this.ticket()
      .channels.filter((ch) => ch.id !== this.channel().id)
      .map((ch) => ({
        key: `channel:${ch.id}`,
        label: `Channel with ${sideNames(ch, false) || sideNames(ch, true)}`,
        hint: this.meta[ch.status].label,
        isNew: false,
        request: { targetChannelId: ch.id, sourceCustomerId: null, targetCustomerId: null },
      })),
  );

  /** Customers reachable through the edges that have no channel with the source yet (created on forward). */
  protected readonly newChannels = computed<Destination[]>(() => {
    const channels = this.ticket().channels;
    const severalSources = this.options().length > 1;
    return this.options().flatMap((option) =>
      option.targets
        .filter((target) => !channels.some((ch) =>
          ch.participants.some((p) => p.customerId === option.customerId) &&
          ch.participants.some((p) => p.customerId === target.id)))
        .map((target) => ({
          key: `new:${option.customerId}:${target.id}`,
          label: `New channel with ${target.name}`,
          hint: severalSources ? `from ${option.customerName}` : 'created on forward',
          isNew: true,
          request: { targetChannelId: null, sourceCustomerId: option.customerId, targetCustomerId: target.id },
        })),
    );
  });

  protected readonly destination = computed(() =>
    [...this.existing(), ...this.newChannels()].find((d) => d.key === this.selected()) ?? null,
  );

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const destination = this.destination();
    if (this.saving() || !destination) {
      return;
    }
    const comment = this.model().comment;
    this.saving.set(true);
    try {
      const result = await firstValueFrom(
        this.service.forwardMessage(this.ticket().number, this.channel().id, this.message().id, {
          ...destination.request,
          comment: isBlankHtml(comment) ? null : comment,
        }),
      );
      this.ref.close(result);
    } catch {
      // Error already notified by errorInterceptor; the panel stays open.
    } finally {
      this.saving.set(false);
    }
  }
}
