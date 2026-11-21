import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { TicketEdge } from '../../../core/services/admin-ticket-edge.models';
import { AdminTicketEdgeService } from '../../../core/services/admin-ticket-edge.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { RadialMenuService } from '../../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../../shared/side-panel/side-panel.service';
import { TicketEdgeFormPanel } from './ticket-edge-form-panel/ticket-edge-form-panel';

@Component({
  selector: 'app-admin-ticket-config',
  imports: [Topbar, DatePipe],
  templateUrl: './ticket-config.html',
})
export class AdminTicketConfig {
  private readonly service = inject(AdminTicketEdgeService);
  private readonly notifications = inject(NotificationService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);

  protected readonly edges = this.service.edges();

  /** Request in progress (toggle, reverse, delete). */
  protected readonly busy = signal(false);

  protected readonly activeCount = computed(() => this.edges.value().filter((e) => e.isActive).length);

  // --- Create / edit (side panel) ---
  protected openCreate(): void {
    this.panel
      .open<TicketEdge>(TicketEdgeFormPanel, { title: 'New edge' })
      .closed.then((created) => {
        if (created) {
          this.notifications.success('Edge created', describe(created));
          this.edges.reload();
        }
      });
  }

  protected openEdit(edge: TicketEdge): void {
    this.panel
      .open<TicketEdge>(TicketEdgeFormPanel, { title: 'Edit edge', subtitle: describe(edge), inputs: { edge } })
      .closed.then((saved) => {
        if (saved) {
          this.notifications.success('Edge updated', describe(saved));
          this.edges.reload();
        }
      });
  }

  // --- Row actions ---
  protected toggleActive(edge: TicketEdge): void {
    const isActive = !edge.isActive;
    this.run(
      this.service.update(edge.id, {
        sourceCustomerId: edge.sourceCustomerId,
        targetCustomerId: edge.targetCustomerId,
        isActive,
      }),
      isActive ? 'Edge enabled' : 'Edge disabled',
      describe(edge),
    );
  }

  protected remove(edge: TicketEdge): void {
    if (!confirm(`Delete the edge ${describe(edge)}?`)) {
      return;
    }
    this.run(this.service.delete(edge.id), 'Edge deleted', describe(edge));
  }

  protected onContextMenu(event: MouseEvent, edge: TicketEdge): void {
    this.radial.open(event, [
      {
        label: 'Edit',
        icon: 'fas fa-pen',
        run: () => this.openEdit(edge),
      },
      {
        label: 'Add reverse edge',
        icon: 'fas fa-right-left',
        disabled: this.hasEdge(edge.targetCustomerId, edge.sourceCustomerId),
        run: () =>
          this.run(
            this.service.create(edge.targetCustomerId, edge.sourceCustomerId),
            'Edge created',
            `${edge.targetCustomerName} → ${edge.sourceCustomerName}`,
          ),
      },
      {
        label: edge.isActive ? 'Disable' : 'Enable',
        icon: edge.isActive ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
        run: () => this.toggleActive(edge),
      },
      {
        label: 'Delete',
        icon: 'fas fa-trash',
        color: '#b00020',
        bg: '#b00020',
        run: () => this.remove(edge),
      },
    ]);
  }

  private hasEdge(sourceId: number, targetId: number): boolean {
    return this.edges.value().some((e) => e.sourceCustomerId === sourceId && e.targetCustomerId === targetId);
  }

  /** Runs a write, then reloads the list (errors are already notified). */
  private run(request: Observable<unknown>, title: string, detail: string): void {
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success(title, detail);
        this.edges.reload();
      },
      error: () => this.busy.set(false),
    });
  }
}

function describe(edge: TicketEdge): string {
  return `${edge.sourceCustomerName} → ${edge.targetCustomerName}`;
}
