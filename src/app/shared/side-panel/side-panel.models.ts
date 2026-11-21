import { Injector, Type } from '@angular/core';

/** Options of a side panel opened through {@link SidePanelService.open}. */
export interface SidePanelOptions {
  /** Title shown in the panel header. */
  title: string;
  /** Optional muted line under the title. */
  subtitle?: string;
  /** Inputs passed to the content component (`input()` names → values). */
  inputs?: Record<string, unknown>;
  /** CSS width of the panel (default: `$side-panel-width` in styles.scss). */
  width?: string;
}

/**
 * Handle of an open side panel. Injected into the content component
 * (`inject(SidePanelRef)`) to close the panel, optionally with a result.
 */
export class SidePanelRef<R = unknown> {
  private settled = false;
  private resolveClosed!: (result: R | undefined) => void;

  /** Resolves with the result passed to {@link close} (`undefined` when dismissed). */
  readonly closed: Promise<R | undefined> = new Promise((resolve) => (this.resolveClosed = resolve));

  constructor(private readonly onClose: (ref: SidePanelRef<R>) => void) {}

  close(result?: R): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.onClose(this);
    this.resolveClosed(result);
  }
}

/** Internal state of the open panel, rendered by the global `<app-side-panel />` host. */
export interface SidePanelState {
  component: Type<unknown>;
  options: SidePanelOptions;
  ref: SidePanelRef<unknown>;
  injector: Injector;
}
