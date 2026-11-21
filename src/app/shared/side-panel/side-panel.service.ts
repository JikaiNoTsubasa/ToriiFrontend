import { Injectable, Injector, Type, inject, signal } from '@angular/core';
import { SidePanelOptions, SidePanelRef, SidePanelState } from './side-panel.models';

/**
 * Drives the app's single right-hand side panel (host mounted once in `app.html`).
 * Meant for create / update forms of list rows, but any component can be shown.
 * Opening a panel while another one is open dismisses the previous one.
 *
 * Example:
 *   private readonly panel = inject(SidePanelService);
 *
 *   edit(customer: CustomerListItem): void {
 *     this.panel
 *       .open<CustomerDetail>(CustomerFormPanel, { title: 'Edit customer', inputs: { customer } })
 *       .closed.then((saved) => saved && this.customers.reload());
 *   }
 *
 * The content component injects the ref to close the panel with a result:
 *   private readonly ref = inject<SidePanelRef<CustomerDetail>>(SidePanelRef);
 *   this.ref.close(saved);
 */
@Injectable({ providedIn: 'root' })
export class SidePanelService {
  private readonly injector = inject(Injector);
  private readonly _state = signal<SidePanelState | null>(null);

  /** Open panel (`null` when closed). */
  readonly state = this._state.asReadonly();

  open<R = unknown>(component: Type<unknown>, options: SidePanelOptions): SidePanelRef<R> {
    this._state()?.ref.close();

    const ref = new SidePanelRef<R>((closing) => {
      if (this._state()?.ref === closing) {
        this._state.set(null);
      }
    });
    const injector = Injector.create({
      providers: [{ provide: SidePanelRef, useValue: ref }],
      parent: this.injector,
    });

    this._state.set({ component, options, ref: ref as SidePanelRef<unknown>, injector });
    return ref;
  }

  /** Dismisses the open panel, if any. */
  close(): void {
    this._state()?.ref.close();
  }
}
