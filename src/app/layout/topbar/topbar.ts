import { Component, input } from '@angular/core';

/**
 * Optional top bar, to include in the pages that need it.
 * It is "sticky": it stays pinned at the top of the content area
 * while the rest of the page scrolls.
 *
 * The title is provided through the `heading` input, and an actions area on
 * the right is projected through `<ng-content>`.
 */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
})
export class Topbar {
  readonly heading = input<string>('');
}
