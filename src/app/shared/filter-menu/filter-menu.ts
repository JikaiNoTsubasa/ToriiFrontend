import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

/** One checkable value of a filter menu. */
export interface FilterOption {
  value: string;
  label: string;
  /** Font Awesome icon shown before the label. */
  icon?: string;
  /** Badge modifier class (styles.scss) — the option is shown as a badge. */
  className?: string;
}

/** Shortcut selecting a set of values at once (e.g. "Open only"). */
export interface FilterPreset {
  label: string;
  values: readonly string[];
}

/**
 * Multi-select filter dropdown, made to sit in a search bar: a toggle "Label: summary" and a
 * checklist with optional presets. Closes on outside click or Escape. The selection is owned
 * by the parent (`selected` in, `selectedChange` out).
 *
 *   <app-filter-menu label="Priority" [options]="priorityOptions" [selected]="priorities()"
 *                    (selectedChange)="setPriorities($event)" />
 */
@Component({
  selector: 'app-filter-menu',
  templateUrl: './filter-menu.html',
  host: {
    class: 'search-bar__filter',
    '(document:click)': 'closeOnOutsideClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class FilterMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly icon = input('fas fa-filter');
  readonly options = input.required<readonly FilterOption[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  /** Default selection: shown as `defaultLabel` (e.g. "Open"); defaults to every option. */
  readonly defaults = input<readonly string[] | null>(null);
  readonly defaultLabel = input('All');
  readonly presets = input<readonly FilterPreset[]>([]);
  /** Explanatory text under the checklist. */
  readonly hint = input<string | null>(null);

  readonly selectedChange = output<ReadonlySet<string>>();

  protected readonly open = signal(false);

  private readonly defaultValues = computed(() => this.defaults() ?? this.options().map((o) => o.value));

  /** Label of the toggle, e.g. "All", "Open", "Critical", "3 selected". */
  protected readonly summary = computed(() => {
    const selected = this.selected();
    const options = this.options();
    const defaults = this.defaultValues();
    if (selected.size === defaults.length && defaults.every((v) => selected.has(v))) return this.defaultLabel();
    if (selected.size === options.length) return 'All';
    if (selected.size === 0) return 'None';
    if (selected.size === 1) return options.find((o) => selected.has(o.value))?.label ?? '1 selected';
    return `${selected.size} selected`;
  });

  /** The selection differs from the default (the toggle is highlighted). */
  protected readonly isFiltered = computed(() => this.summary() !== this.defaultLabel());

  protected toggle(value: string): void {
    const next = new Set(this.selected());
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    this.selectedChange.emit(next);
  }

  protected apply(values: readonly string[]): void {
    this.selectedChange.emit(new Set(values));
  }

  protected selectAll(): void {
    this.apply(this.options().map((o) => o.value));
  }

  protected closeOnOutsideClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
