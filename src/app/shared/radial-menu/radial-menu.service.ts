import { Injectable, signal } from '@angular/core';
import { RadialMenuAction, RadialMenuState } from './radial-menu.models';

/**
 * Drives the app's single radial menu (mounted only once in `app.html`).
 * Opens a circular action menu anywhere: just call `open()` from an
 * event handler (usually `contextmenu`).
 *
 * Example — right-click on a table row to offer actions:
 *   private readonly radial = inject(RadialMenuService);
 *
 *   onContextMenu(event: MouseEvent, task: Task): void {
 *     this.radial.open(event, [
 *       { label: 'New task', icon: 'fas fa-plus', color: '#1f7a3d',
 *         run: () => this.create() },
 *       { label: 'Duplicate', icon: 'fas fa-copy',
 *         run: () => this.duplicate(task) },
 *       { label: 'Delete', icon: 'fas fa-trash', color: '#b00020',
 *         run: () => this.remove(task) },
 *     ]);
 *   }
 *
 * In the template:
 *   <tr (contextmenu)="onContextMenu($event, task)"> … </tr>
 */
@Injectable({ providedIn: 'root' })
export class RadialMenuService {
  private readonly _state = signal<RadialMenuState | null>(null);

  /** Current menu state (`null` when closed). */
  readonly state = this._state.asReadonly();

  /** Minimum margin (px) between the menu center and the screen edge. */
  private readonly edgeMargin = 130;

  /**
   * Opens the menu at the click location with the given actions.
   * Prevents the browser's native context menu.
   */
  open(event: MouseEvent, actions: RadialMenuAction[]): void {
    event.preventDefault();
    event.stopPropagation();

    if (actions.length === 0) {
      return;
    }

    // Keep the menu center on screen even when the click is near an edge.
    const x = this.clamp(event.clientX, window.innerWidth);
    const y = this.clamp(event.clientY, window.innerHeight);

    this._state.set({ x, y, actions });
  }

  /** Closes the menu. */
  close(): void {
    this._state.set(null);
  }

  private clamp(value: number, size: number): number {
    return Math.min(Math.max(value, this.edgeMargin), size - this.edgeMargin);
  }
}
