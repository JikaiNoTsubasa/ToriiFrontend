import {
  Component,
  ElementRef,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * "Inline" editable text: displayed normally, it becomes an input field
 * on click, then turns back into plain text once confirmed.
 *
 * Confirm: Enter or blur. Cancel: Escape.
 *
 * Standalone usage (two-way binding + save event):
 *   <app-editable-input-text [(value)]="task.title" (save)="rename($event)" />
 */
@Component({
  selector: 'app-editable-input-text',
  templateUrl: './editable-input-text.html',
})
export class EditableInputText {
  /** Current value, two-way bindable: [(value)]. */
  readonly value = model.required<string>();

  /** Greyed-out text shown when the value is empty. */
  readonly placeholder = input('');

  /** Emitted with the edited text on every confirmation. */
  readonly save = output<string>();

  /** True while the user is editing the field. */
  protected readonly editing = signal(false);

  /** Draft being edited, isolated from the value until confirmed. */
  protected readonly draft = signal('');

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  constructor() {
    // As soon as the field appears, focus it and select
    // the text to allow immediate replacement.
    effect(() => {
      if (this.editing()) {
        this.inputRef()?.nativeElement.select();
      }
    });
  }

  /** Enters edit mode, seeding the draft with the current value. */
  protected startEdit(): void {
    this.draft.set(this.value());
    this.editing.set(true);
  }

  /** Confirms the draft: updates the value, emits `save`, leaves edit mode. */
  protected commit(): void {
    if (!this.editing()) {
      return;
    }
    const next = this.draft().trim();
    this.editing.set(false);
    if (next !== this.value()) {
      this.value.set(next);
      this.save.emit(next);
    }
  }

  /** Cancels editing without changing the value. */
  protected cancel(): void {
    this.editing.set(false);
  }
}
