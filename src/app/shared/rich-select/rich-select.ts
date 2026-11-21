import { NgTemplateOutlet } from '@angular/common';
import { Component, DOCUMENT, DestroyRef, ElementRef, computed, inject, input, model, signal, viewChild } from '@angular/core';

/** One choice of a {@link RichSelect}. */
export interface RichSelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Font Awesome icon shown before the label. */
  icon?: string;
  /** Secondary line under the label. */
  description?: string;
  /** Modifier class (styles.scss) applied to the icon + label, e.g. a color. */
  className?: string;
}

/** Gap (px) between the toggle and the list; margin kept from the viewport edges. */
const GAP = 4;
const VIEWPORT_MARGIN = 8;

let nextId = 0;

/**
 * Single-choice dropdown whose options show an icon, a label and a description (a native
 * `<select>` can only show text). The list opens in the top layer (`popover`), so it is never
 * clipped by a scrolling container such as the side panel body; it is placed under the toggle,
 * or above it when there is no room below, and closes on scroll / resize.
 *
 * Keyboard: ↓ / ↑ / Enter / Space open; in the list ↓ ↑ Home End move, Enter / Space pick,
 * Escape / Tab close.
 *
 *   <app-rich-select [options]="typeOptions" [(value)]="type" ariaLabel="Type" />
 */
@Component({
  selector: 'app-rich-select',
  imports: [NgTemplateOutlet],
  templateUrl: './rich-select.html',
  host: {
    class: 'rich-select',
    '(document:click)': 'closeOnOutsideClick($event)',
    '(window:resize)': 'close()',
  },
})
export class RichSelect<T extends string = string> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Scroll events do not bubble: listen in the capture phase to catch any scrolling
    // container (e.g. the side panel body), which would leave the list floating.
    const document = inject(DOCUMENT);
    const onScroll = (event: Event) => this.closeOnScroll(event);
    document.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('scroll', onScroll, true));
  }

  readonly options = input.required<readonly RichSelectOption<T>[]>();
  readonly value = model.required<T>();
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  protected readonly open = signal(false);
  /** Index of the keyboard-highlighted option while open. */
  protected readonly active = signal(0);
  protected readonly id = `rich-select-${++nextId}`;

  protected readonly selected = computed(() => this.options().find((o) => o.value === this.value()) ?? null);

  private readonly toggleButton = viewChild.required<ElementRef<HTMLButtonElement>>('toggleButton');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  protected onToggleKeydown(event: KeyboardEvent): void {
    if (!this.open() && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.show();
    }
  }

  protected onListKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        this.active.update((i) => Math.min(i + 1, count - 1));
        break;
      case 'ArrowUp':
        this.active.update((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        this.active.set(0);
        break;
      case 'End':
        this.active.set(count - 1);
        break;
      case 'Enter':
      case ' ':
        this.pick(this.options()[this.active()]);
        break;
      case 'Escape':
        this.close(true);
        break;
      case 'Tab':
        this.close(true);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.scrollActiveIntoView();
  }

  protected pick(option: RichSelectOption<T>): void {
    this.value.set(option.value);
    this.close(true);
  }

  close(refocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.list().nativeElement.hidePopover();
    if (refocus) {
      this.toggleButton().nativeElement.focus();
    }
  }

  protected closeOnOutsideClick(event: MouseEvent): void {
    // The list lives in the top layer but stays a DOM child of the host.
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private closeOnScroll(event: Event): void {
    // Scrolling inside the list itself must not close it.
    if (this.open() && !this.list().nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private show(): void {
    if (this.disabled()) {
      return;
    }
    const index = this.options().findIndex((o) => o.value === this.value());
    this.active.set(Math.max(index, 0));
    this.open.set(true);

    const list = this.list().nativeElement;
    list.showPopover();
    this.place(list);
    list.focus();
    this.scrollActiveIntoView();
  }

  /** Fixed position under the toggle (same width), flipped above when it does not fit below. */
  private place(list: HTMLElement): void {
    const rect = this.toggleButton().nativeElement.getBoundingClientRect();
    // Measure at the final width, without the cap of a previous opening.
    list.style.width = `${rect.width}px`;
    list.style.maxHeight = '';
    const height = list.offsetHeight;
    const below = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
    const above = rect.top - GAP - VIEWPORT_MARGIN;
    const top = height <= below || below >= above ? rect.bottom + GAP : Math.max(VIEWPORT_MARGIN, rect.top - GAP - height);

    list.style.left = `${rect.left}px`;
    list.style.top = `${top}px`;
    list.style.maxHeight = `${Math.max(below, above)}px`;
  }

  private scrollActiveIntoView(): void {
    const item = this.list().nativeElement.querySelector<HTMLElement>(`#${this.id}-option-${this.active()}`);
    item?.scrollIntoView({ block: 'nearest' });
  }
}
