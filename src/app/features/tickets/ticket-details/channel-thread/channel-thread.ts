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
import { NotificationService } from '../../../../core/notifications/notification.service';
import {
  FileRef,
  TicketActivity,
  TicketChannelDetail,
  TicketMessage,
} from '../../../../core/services/ticket.models';
import { TicketService } from '../../../../core/services/ticket.service';
import { TICKET_STATUS_META } from '../../../../core/services/ticket-status';
import { TICKET_PRIORITY_META, TICKET_TYPE_META } from '../../../../core/services/ticket-classification';
import {
  fileIcon,
  formatFileSize,
  lastImageIndex,
  namePastedImage,
  saveBlob,
} from '../../../../shared/files/files';
import { isBlankHtml } from '../../../../shared/rich-text-editor/html-text';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor/rich-text-editor';

/** One entry of the channel feed: a message or an activity event. */
export type FeedItem =
  | { kind: 'message'; key: string; at: string; message: TicketMessage }
  | { kind: 'activity'; key: string; at: string; activity: TicketActivity };

/**
 * One channel of a ticket: header (who talks to whom + status + files), the activity feed
 * (messages interleaved with status changes, uploads, forwards…) and a composer bound to
 * *this* channel (reply + file upload). The ticket page keeps one instance per channel (only
 * the selected one is shown), so each channel has its own draft and nothing can be sent to
 * the wrong channel.
 */
@Component({
  selector: 'app-channel-thread',
  imports: [DatePipe, FormField, RichTextEditorComponent],
  templateUrl: './channel-thread.html',
})
export class ChannelThread {
  private readonly service = inject(TicketService);
  private readonly notifications = inject(NotificationService);

  readonly ticketNumber = input.required<string>();
  readonly channel = input.required<TicketChannelDetail>();

  /** The channel changed (reply posted, files uploaded): the page reloads the ticket. */
  readonly changed = output<void>();
  /** The status badge was clicked (the page opens the status panel). */
  readonly statusClick = output<void>();
  /** "Forward" was clicked on a message (the page opens the forward panel). */
  readonly forwardClick = output<TicketMessage>();
  /** "Forward" was clicked on a file (the page opens the forward panel). */
  readonly forwardFileClick = output<FileRef>();

  protected readonly meta = TICKET_STATUS_META;
  protected readonly typeMeta = TICKET_TYPE_META;
  protected readonly priorityMeta = TICKET_PRIORITY_META;
  protected readonly sending = signal(false);
  /** Uploads in progress (pastes can overlap, so a counter rather than a flag). */
  private readonly pendingUploads = signal(0);
  protected readonly uploading = computed(() => this.pendingUploads() > 0);
  protected readonly fileIcon = fileIcon;
  protected readonly formatFileSize = formatFileSize;

  /** The other side of the channel (falls back to everyone when the user is on both sides). */
  protected readonly counterpart = computed(() => sideNames(this.channel(), false) || sideNames(this.channel(), true));
  protected readonly ownSide = computed(() => sideNames(this.channel(), true));

  /** Messages and activity events in chronological order (activities first on equal dates). */
  protected readonly feed = computed<FeedItem[]>(() => buildFeed(this.channel()));

  private readonly model = signal({ content: '' });
  protected readonly form = form(this.model, (path) => {
    validate(path.content, ({ value }) =>
      isBlankHtml(value()) ? { kind: 'required', message: 'Write a message before sending.' } : undefined,
    );
  });

  private readonly feedEnd = viewChild<ElementRef<HTMLElement>>('feedEnd');

  constructor() {
    // Keep the latest entry in view when the feed grows.
    afterRenderEffect(() => {
      this.feed().length;
      this.feedEnd()?.nativeElement.scrollIntoView({ block: 'nearest' });
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
        await firstValueFrom(this.service.postMessage(this.ticketNumber(), this.channel().id, this.model().content));
        this.form().reset({ content: '' });
        this.changed.emit();
      } catch {
        // Error already notified by errorInterceptor; the draft is kept.
      } finally {
        this.sending.set(false);
      }
      return undefined;
    });
  }

  /** Uploads the files picked with "Attach files". */
  protected upload(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = ''; // allow picking the same file again
    void this.uploadFiles(files);
  }

  /**
   * Images pasted into the reply are uploaded as `image_1.png`, `image_2.png`… Numbering
   * continues from the channel's existing `image_N` files and from this session's pastes.
   */
  protected pasteImages(images: File[]): void {
    const named = images.map((image) => {
      this.lastImageIndex = Math.max(this.lastImageIndex, lastImageIndex(this.channel().files.map((f) => f.fileName))) + 1;
      return namePastedImage(image, this.lastImageIndex);
    });
    void this.uploadFiles(named);
  }

  /** Highest `image_N` index assigned by this composer (pastes may outrun the ticket reload). */
  private lastImageIndex = 0;

  /** Uploads files to this channel right away (they appear in the feed). */
  private async uploadFiles(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }
    this.pendingUploads.update((n) => n + 1);
    try {
      const uploaded = await firstValueFrom(this.service.uploadFiles(this.ticketNumber(), this.channel().id, files));
      this.notifications.success(
        uploaded.length > 1 ? `${uploaded.length} files uploaded` : 'File uploaded',
        uploaded.map((f) => f.fileName).join(', '),
      );
      this.changed.emit();
    } catch {
      // Error already notified by errorInterceptor.
    } finally {
      this.pendingUploads.update((n) => n - 1);
    }
  }

  protected async download(file: FileRef): Promise<void> {
    try {
      const blob = await firstValueFrom(this.service.downloadFile(this.ticketNumber(), this.channel().id, file.fileId));
      saveBlob(blob, file.fileName);
    } catch {
      // Error already notified by errorInterceptor.
    }
  }
}

/** Names of the user's own side (`own`) or of the other side of a channel. */
export function sideNames(channel: TicketChannelDetail, own: boolean): string {
  return channel.participants
    .filter((p) => p.isOwn === own)
    .map((p) => p.customerName)
    .join(', ');
}

/** Merges messages and activities chronologically (an activity before a message on equal dates). */
export function buildFeed(channel: TicketChannelDetail): FeedItem[] {
  const items: FeedItem[] = [
    ...channel.activities.map((activity) => ({
      kind: 'activity' as const,
      key: `a${activity.id}`,
      at: activity.createdAt,
      activity,
    })),
    ...channel.messages.map((message) => ({
      kind: 'message' as const,
      key: `m${message.id}`,
      at: message.createdAt,
      message,
    })),
  ];
  return items.sort((a, b) => {
    const byDate = Date.parse(a.at) - Date.parse(b.at);
    return byDate !== 0 ? byDate : a.kind === b.kind ? 0 : a.kind === 'activity' ? -1 : 1;
  });
}
