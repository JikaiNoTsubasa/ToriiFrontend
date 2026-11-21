import { NgComponentOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SidePanelService } from './side-panel.service';

/**
 * Global side panel host: mount it only once (in `app.html`). It renders the
 * shared template (backdrop, header with title and close button, content area)
 * around the component given to {@link SidePanelService.open}.
 *
 * Closing: backdrop click, close button, or the Escape key. Content components
 * lay out their form with the `.side-panel__body` / `.side-panel__footer` classes.
 */
@Component({
  selector: 'app-side-panel',
  imports: [NgComponentOutlet],
  templateUrl: './side-panel.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class SidePanel {
  private readonly service = inject(SidePanelService);

  protected readonly state = this.service.state;

  protected close(): void {
    this.service.close();
  }
}
