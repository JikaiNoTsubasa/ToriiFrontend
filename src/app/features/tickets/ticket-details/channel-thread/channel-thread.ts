import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { TicketChannelDetail, TicketMessage } from '../../../../core/services/ticket.models';
import { TicketService } from '../../../../core/services/ticket.service';
import { TICKET_STATUS_META } from '../../../../core/services/ticket-status';
import { isBlankHtml } from '../../../../shared/rich-text-editor/html-text';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor/rich-text-editor';

/**
 * One channel of a ticket: header (who talks to whom + status), the conversation and a
 * reply composer bound to *this* channel. The ticket page keeps one instance per channel
 * (only the selected one is shown), so each channel has its own draft and a reply can
 * never be sent to the wrong channel.
 */
@Component({
  selector: 'app-channel-thread',
  imports: [DatePipe, FormField, RichTextEditorComponent],
  templateUrl: './channel-thread.html',
})
export class ChannelThread {
  private readonly service = inject(TicketService);

  readonly ticketNumber = input.required<string>();
  readonly channel = input.required<TicketChannelDetail>();

  /** A reply was posted (the page reloads the ticket). */
  readonly messagePosted = output<TicketMessage>();
  /** The status badge was clicked (the page opens the status panel). */
  readonly statusClick = output<void>();
  /** "Forward" was clicked on a message (the page opens the forward panel). */
  readonly forwardClick = output<TicketMessage>();

  protected readonly meta = TICKET_STATUS_META;
  protected readonly sending = signal(false);

  /** The other side of the channel (falls back to everyone when the user is on both sides). */
  protected readonly counterpart = computed(() => sideNames(this.channel(), false) || sideNames(this.channel(), true));
  protected readonly ownSide = computed(() => sideNames(this.channel(), true));

  private readonly model = signal({ content: '' });
  protected readonly form = form(this.model, (path) => {
    validate(path.content, ({ value }) =>
      isBlankHtml(value()) ? { kind: 'required', message: 'Write a message before sending.' } : undefined,
    );
  });

  private readonly messagesEnd = viewChild<ElementRef<HTMLElement>>('messagesEnd');

  constructor() {
    // Keep the latest message in view when the conversation grows.
    afterRenderEffect(() => {
      this.channel().messages.length;
      this.messagesEnd()?.nativeElement.scrollIntoView({ block: 'nearest' });
    });
  }

  protected hasText(html: string): boolean {
    return !isBlankHtml(html);
  }

  /** Unsent text in this channel's composer (used by the page's leave guard). */
  hasDraft(): boolean {
    return !isBlankHtml(this.model().content);
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    if (this.sending()) {
      return;
    }
    await submit(this.form, async () => {
      this.sending.set(true);
      try {
        const message = await firstValueFrom(
          this.service.postMessage(this.ticketNumber(), this.channel().id, this.model().content),
        );
        this.form().reset({ content: '' });
        this.messagePosted.emit(message);
      } catch {
        // Error already notified by errorInterceptor; the draft is kept.
      } finally {
        this.sending.set(false);
      }
      return undefined;
    });
  }
}

/** Names of the user's own side (`own`) or of the other side of a channel. */
export function sideNames(channel: TicketChannelDetail, own: boolean): string {
  return channel.participants
    .filter((p) => p.isOwn === own)
    .map((p) => p.customerName)
    .join(', ');
}
