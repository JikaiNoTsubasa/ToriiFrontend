import { Component, inject } from '@angular/core';
import { RadialMenuAction } from './radial-menu.models';
import { RadialMenuService } from './radial-menu.service';

/**
 * Global radial menu: mount it only once (in `app.html`). When the
 * {@link RadialMenuService} asks for it, it shows a ring of round buttons
 * around the clicked point. The buttons appear one after the other,
 * spinning around the center.
 *
 * Closing: outside click, central close button, or the Escape key.
 * Opening is driven by `RadialMenuService.open(event, actions)`.
 */
@Component({
  selector: 'app-radial-menu',
  templateUrl: './radial-menu.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class RadialMenu {
  private readonly service = inject(RadialMenuService);

  /** Current state (position + actions), `null` when the menu is closed. */
  protected readonly state = this.service.state;

  /** Radius (px) of the circle the buttons are laid out on. */
  protected readonly radius = 70; // 92;

  /** Angle (deg) of the button at `index` among `count` buttons. */
  protected angle(index: number, count: number): number {
    return (360 / count) * index;
  }

  /** Runs the action, then closes the menu. */
  protected trigger(action: RadialMenuAction): void {
    if (action.disabled) {
      return;
    }
    this.service.close();
    action.run();
  }

  /** Closes the menu without running anything. */
  protected close(): void {
    this.service.close();
  }

  protected onEscape(): void {
    this.close();
  }
}
