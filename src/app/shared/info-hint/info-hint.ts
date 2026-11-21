import { Component, input } from '@angular/core';

/**
 * Small "i" icon revealing a help popover on hover or keyboard focus (CSS only).
 * The popover content is projected:
 *
 *   <app-info-hint label="About statuses">
 *     <p>Any content…</p>
 *   </app-info-hint>
 *
 * `align="end"` opens the popover towards the left (for icons near the right edge).
 */
@Component({
  selector: 'app-info-hint',
  templateUrl: './info-hint.html',
  host: {
    class: 'info-hint',
    '[class.info-hint--end]': "align() === 'end'",
  },
})
export class InfoHint {
  /** Accessible name of the icon (also shown as the popover title when provided). */
  readonly label = input('More information');
  readonly align = input<'start' | 'end'>('start');
}
