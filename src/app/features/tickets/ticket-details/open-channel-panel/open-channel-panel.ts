import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { TicketDetail, TicketSendOption } from '../../../../core/services/ticket.models';
import { TicketService } from '../../../../core/services/ticket.service';
import { isBlankHtml } from '../../../../shared/rich-text-editor/html-text';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor/rich-text-editor';
import { SidePanelRef } from '../../../../shared/side-panel/side-panel.models';

/** Form model; `<select>` values are customer ids as strings ('' = none). */
interface ChannelForm {
  source: string;
  target: string;
  content: string;
}

/**
 * Side panel opening a new channel on an existing ticket: from one of the user's
 * customers to another customer allowed by the ticket edges (customers already linked
 * to that source on this ticket are excluded), with a first message.
 * Closes the panel with the updated {@link TicketDetail}.
 */
@Component({
  selector: 'app-open-channel-panel',
  imports: [FormField, RichTextEditorComponent],
  templateUrl: './open-channel-panel.html',
})
export class OpenChannelPanel {
  private readonly service = inject(TicketService);
  protected readonly ref = inject<SidePanelRef<TicketDetail>>(SidePanelRef);

  readonly ticket = input.required<TicketDetail>();
  /** Send options of the signed-in user (customers they belong to + allowed targets). */
  readonly options = input.required<TicketSendOption[]>();

  protected readonly saving = signal(false);

  protected readonly model = signal<ChannelForm>({ source: '', target: '', content: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.source, { message: 'Select the customer you write from.' });
    required(path.target, { message: 'Select the customer to involve.' });
    validate(path.content, ({ value }) =>
      isBlankHtml(value()) ? { kind: 'required', message: 'Write a first message.' } : undefined,
    );
  });

  protected readonly hasSeveralSources = computed(() => this.options().length > 1);

  /** Allowed targets of the selected source, minus customers already linked to it on this ticket. */
  protected readonly targets = computed(() => {
    const sourceId = Number(this.model().source);
    const linked = new Set(
      this.ticket()
        .channels.filter((ch) => ch.participants.some((p) => p.customerId === sourceId))
        .flatMap((ch) => ch.participants.map((p) => p.customerId)),
    );
    const option = this.options().find((o) => o.customerId === sourceId);
    return (option?.targets ?? []).filter((t) => !linked.has(t.id));
  });

  constructor() {
    // Single sending customer: select it implicitly.
    effect(() => {
      const options = this.options();
      if (options.length === 1 && !this.model().source) {
        this.model.update((m) => ({ ...m, source: String(options[0].customerId) }));
      }
    });

    // Changing the source drops a target that is no longer available.
    effect(() => {
      const target = this.model().target;
      if (target && !this.targets().some((t) => String(t.id) === target)) {
        this.model.update((m) => ({ ...m, target: '' }));
      }
    });
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    await submit(this.form, async () => {
      const { source, target, content } = this.model();
      this.saving.set(true);
      try {
        const updated = await firstValueFrom(
          this.service.openChannel(this.ticket().number, {
            sourceCustomerId: Number(source),
            targetCustomerId: Number(target),
            content,
          }),
        );
        this.ref.close(updated);
      } catch {
        // Error already notified by errorInterceptor; the panel stays open.
      } finally {
        this.saving.set(false);
      }
      return undefined;
    });
  }
}
