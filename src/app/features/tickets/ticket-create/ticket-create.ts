import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { TicketService } from '../../../core/services/ticket.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { isBlankHtml } from '../../../shared/rich-text-editor/html-text';
import { RichTextEditorComponent } from '../../../shared/rich-text-editor/rich-text-editor';

/** Form model; `<select>` values are customer ids as strings ('' = none). */
interface TicketForm {
  source: string;
  target: string;
  title: string;
  content: string;
}

/**
 * Dedicated ticket creation page (`/tickets/new`): title and content written in a
 * full-size editor, recipient picked among the customers allowed by the ticket edges.
 * The content becomes the first message of the channel created between the source
 * and target customers. Leaving with unsaved input asks for confirmation.
 */
@Component({
  selector: 'app-ticket-create',
  imports: [Topbar, RouterLink, FormField, RichTextEditorComponent],
  templateUrl: './ticket-create.html',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class TicketCreate {
  private readonly service = inject(TicketService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Customers the user may send from, with their allowed targets. */
  protected readonly options = this.service.sendOptions();

  protected readonly saving = signal(false);
  /** Set once the ticket is sent, so leaving the page no longer asks for confirmation. */
  private sent = false;

  private readonly model = signal<TicketForm>({ source: '', target: '', title: '', content: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.source, { message: 'Select the customer you send from.' });
    required(path.target, { message: 'Select the recipient customer.' });
    required(path.title, { message: 'Title is required.' });
    maxLength(path.title, 200, { message: '200 characters maximum.' });
    validate(path.content, ({ value }) =>
      isBlankHtml(value()) ? { kind: 'required', message: 'Content is required.' } : undefined,
    );
  });

  /** The source picker is only shown when the user belongs to several sending customers. */
  protected readonly hasSeveralSources = computed(() => this.options.value().length > 1);

  /** Allowed recipients of the selected source customer. */
  protected readonly targets = computed(() => {
    const source = this.model().source;
    return this.options.value().find((o) => String(o.customerId) === source)?.targets ?? [];
  });

  constructor() {
    // Single sending customer: select it implicitly.
    effect(() => {
      const options = this.options.value();
      if (options.length === 1 && !this.model().source) {
        this.model.update((m) => ({ ...m, source: String(options[0].customerId) }));
      }
    });

    // Changing the source drops a target that it is not allowed to send to.
    effect(() => {
      const target = this.model().target;
      if (target && !this.targets().some((t) => String(t.id) === target)) {
        this.model.update((m) => ({ ...m, target: '' }));
      }
    });
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    await submit(this.form, async () => {
      const { source, target, title, content } = this.model();
      this.saving.set(true);
      try {
        const created = await firstValueFrom(
          this.service.create({
            sourceCustomerId: Number(source),
            targetCustomerId: Number(target),
            title: title.trim(),
            content,
          }),
        );
        this.sent = true;
        this.notifications.success('Ticket sent', `${created.number} — ${created.title}`);
        this.router.navigate(['/tickets']);
      } catch {
        // Error already notified by errorInterceptor; the draft stays on screen.
      } finally {
        this.saving.set(false);
      }
      return undefined;
    });
  }

  /** Used by the route's canDeactivate guard: confirms before dropping a started draft. */
  canLeave(): boolean {
    return !this.hasDraft() || confirm('Discard this ticket? Your title and content will be lost.');
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasDraft()) {
      event.preventDefault();
    }
  }

  private hasDraft(): boolean {
    const { title, content } = this.model();
    return !this.sent && (title.trim().length > 0 || !isBlankHtml(content));
  }
}
